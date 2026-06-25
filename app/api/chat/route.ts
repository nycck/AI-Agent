import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { ChatMessage } from "@/lib/types";

// Streaming response can run a while — give it room (Node runtime).
export const runtime = "nodejs";
export const maxDuration = 120;

// Lokaal, gratis model via Ollama. Geen API-sleutel, geen kosten.
// Standaard draait Ollama op http://localhost:11434.
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

export async function POST(req: Request) {
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error("empty");
    }
  } catch {
    return new Response(JSON.stringify({ error: "Ongeldige aanvraag." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Roep Ollama aan met streaming (NDJSON: één JSON-object per regel).
  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
  } catch {
    return new Response(
      JSON.stringify({
        error:
          "Kan Ollama niet bereiken. Draait Ollama? Start het met 'ollama serve' of open de Ollama-app.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const detail = await ollamaRes.text().catch(() => "");
    const hint = detail.includes("not found")
      ? ` Model '${OLLAMA_MODEL}' ontbreekt — haal het op met 'ollama pull ${OLLAMA_MODEL}'.`
      : "";
    return new Response(
      JSON.stringify({ error: `Ollama-fout (${ollamaRes.status}).${hint}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = ollamaRes.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Ollama stuurt per regel een JSON-object.
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            try {
              const obj = JSON.parse(line);
              const text: string | undefined = obj?.message?.content;
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              /* onvolledige regel; negeer */
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Onbekende fout.";
        controller.enqueue(encoder.encode(`\n\n_[Fout: ${msg}]_`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInput from "@/components/ChatInput";
import MessageBubble from "@/components/MessageBubble";
import type { ChatMessage, Conversation } from "@/lib/types";

const STORAGE_KEY = "officeheart-conversations";

const SUGGESTIONS = [
  {
    title: "E-mail opstellen",
    prompt:
      "Schrijf een professionele e-mail naar een klant om een afspraak te verzetten naar volgende week.",
  },
  {
    title: "Factuur maken",
    prompt: "Ik wil een factuur opstellen. Welke gegevens heb je van me nodig?",
  },
  {
    title: "Tekst vertalen",
    prompt:
      "Vertaal de volgende zin naar zakelijk Engels: 'Bedankt voor uw bestelling, wij verzenden deze morgen.'",
  },
  {
    title: "Samenvatten",
    prompt: "Vat de belangrijkste punten samen uit een tekst die ik je geef.",
  },
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Laad gesprekken uit localStorage bij start
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Conversation[] = JSON.parse(raw);
        setConversations(parsed);
        if (parsed.length > 0) setActiveId(parsed[0].id);
      }
    } catch {
      /* negeer corrupte opslag */
    }
  }, []);

  // Bewaar gesprekken bij elke wijziging
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // Auto-scroll naar beneden
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.messages, streaming]);

  function newConversation(): string {
    const conv: Conversation = {
      id: uid(),
      title: "",
      messages: [],
      createdAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv.id;
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }

  function updateConversation(id: string, updater: (c: Conversation) => Conversation) {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  async function handleSend(text: string) {
    if (streaming) return;

    // Zorg dat er een actief gesprek is
    let convId = activeId;
    if (!convId || !conversations.some((c) => c.id === convId)) {
      convId = newConversation();
    }

    const userMsg: ChatMessage = { role: "user", content: text };

    // Bouw de berichtgeschiedenis voor de API
    const existing = conversations.find((c) => c.id === convId)?.messages ?? [];
    const history = [...existing, userMsg];

    updateConversation(convId, (c) => ({
      ...c,
      title: c.title || text.slice(0, 40),
      messages: [...c.messages, userMsg, { role: "assistant", content: "" }],
    }));

    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Onbekende fout." }));
        throw new Error(err.error ?? "Onbekende fout.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        updateConversation(convId!, (c) => {
          const msgs = [...c.messages];
          msgs[msgs.length - 1] = { role: "assistant", content: snapshot };
          return { ...c, messages: msgs };
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Onbekende fout.";
      updateConversation(convId!, (c) => {
        const msgs = [...c.messages];
        msgs[msgs.length - 1] = {
          role: "assistant",
          content: `_[Fout: ${msg}]_`,
        };
        return { ...c, messages: msgs };
      });
    } finally {
      setStreaming(false);
    }
  }

  const showEmptyState = !active || active.messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newConversation}
        onDelete={deleteConversation}
      />

      <main className="flex h-full flex-1 flex-col bg-surface">
        <header className="flex items-center gap-2 border-b border-zinc-800 px-6 py-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            OH
          </span>
          <h1 className="text-sm font-semibold">OfficeHeart AI-assistent</h1>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {showEmptyState ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center">
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-white">
                OH
              </span>
              <h2 className="text-2xl font-semibold">Waar kan ik mee helpen?</h2>
              <p className="mt-2 text-zinc-400">
                Je interne assistent voor e-mails, facturen en meer.
              </p>
              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => handleSend(s.prompt)}
                    className="rounded-xl border border-zinc-700 bg-bubble/50 p-4 text-left transition hover:border-brand hover:bg-bubble"
                  >
                    <div className="text-sm font-medium text-zinc-100">
                      {s.title}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">{s.prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
              {active!.messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  streaming={
                    streaming &&
                    i === active!.messages.length - 1 &&
                    m.role === "assistant"
                  }
                />
              ))}
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={streaming} />
      </main>
    </div>
  );
}

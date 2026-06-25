"use client";

import { useRef, useState, type KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoGrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-6">
      <div className="flex items-end gap-2 rounded-2xl border border-zinc-700 bg-bubble p-2 shadow-lg">
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKey}
          placeholder="Stel een vraag, vraag om een e-mail of een factuur…"
          className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-zinc-100 placeholder-zinc-500 outline-none"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Verstuur"
        >
          ↑
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500">
        Enter om te versturen · Shift+Enter voor een nieuwe regel
      </p>
    </div>
  );
}

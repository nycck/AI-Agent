"use client";

import Markdown from "./Markdown";
import type { ChatMessage } from "@/lib/types";

interface Props {
  message: ChatMessage;
  streaming?: boolean;
}

export default function MessageBubble({ message, streaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-bubble text-zinc-100" : "bg-transparent text-zinc-100"
        }`}
      >
        {!isUser && (
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-brand">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] text-white">
              OH
            </span>
            OfficeHeart Assistent
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {message.content}
          </p>
        ) : (
          <>
            <Markdown content={message.content} />
            {streaming && message.content === "" && (
              <span className="text-zinc-400 cursor-blink" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

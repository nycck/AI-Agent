"use client";

import type { Conversation } from "@/lib/types";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-zinc-200">
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium transition hover:bg-zinc-800"
        >
          <span className="text-lg leading-none">+</span> Nieuw gesprek
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        <p className="px-2 py-2 text-xs uppercase tracking-wide text-zinc-500">
          Gesprekken
        </p>
        {conversations.length === 0 && (
          <p className="px-2 text-sm text-zinc-500">Nog geen gesprekken.</p>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center justify-between rounded-lg px-2 py-2 text-sm transition ${
              c.id === activeId ? "bg-zinc-800" : "hover:bg-zinc-800/60"
            }`}
          >
            <button
              onClick={() => onSelect(c.id)}
              className="flex-1 truncate text-left"
              title={c.title}
            >
              {c.title || "Nieuw gesprek"}
            </button>
            <button
              onClick={() => onDelete(c.id)}
              className="ml-2 hidden text-zinc-500 hover:text-brand group-hover:block"
              title="Verwijder gesprek"
              aria-label="Verwijder gesprek"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800 p-4 text-xs text-zinc-500">
        <div className="font-semibold text-zinc-300">OfficeHeart</div>
        Interne AI-assistent
      </div>
    </aside>
  );
}

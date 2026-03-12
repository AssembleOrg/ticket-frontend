"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "list" | "grid";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-lg border border-white/[0.08] bg-surface p-0.5">
      <button
        onClick={() => onChange("list")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
          view === "list"
            ? "bg-white/10 text-white"
            : "text-white/30 hover:text-white/60"
        }`}
        aria-label="Vista lista"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("grid")}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
          view === "grid"
            ? "bg-white/10 text-white"
            : "text-white/30 hover:text-white/60"
        }`}
        aria-label="Vista tarjetas"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}

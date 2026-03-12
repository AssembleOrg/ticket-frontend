"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const LIMIT_OPTIONS = [10, 25, 50];

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  total?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  total,
}: PaginationProps) {
  const pages: number[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    for (let i = start; i <= end; i++) pages.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Info + rows selector */}
      <div className="flex items-center gap-3">
        {total != null && limit != null ? (
          <span className="text-sm text-white/30">
            {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total}
          </span>
        ) : null}

        {onLimitChange && limit != null ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-white/30 sm:inline">Filas:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none transition-colors focus:border-neon/50 [&>option]:bg-[#1a1a22]"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {/* Page buttons */}
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pages[0] > 1 ? (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium text-white/60 hover:bg-white/10"
              >
                1
              </button>
              {pages[0] > 2 ? (
                <span className="flex h-8 w-8 items-center justify-center text-sm text-white/30">…</span>
              ) : null}
            </>
          ) : null}
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-neon text-black"
                  : "text-white/60 hover:bg-white/10"
              }`}
            >
              {p}
            </button>
          ))}
          {pages[pages.length - 1] < totalPages ? (
            <>
              {pages[pages.length - 1] < totalPages - 1 ? (
                <span className="flex h-8 w-8 items-center justify-center text-sm text-white/30">…</span>
              ) : null}
              <button
                onClick={() => onPageChange(totalPages)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium text-white/60 hover:bg-white/10"
              >
                {totalPages}
              </button>
            </>
          ) : null}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

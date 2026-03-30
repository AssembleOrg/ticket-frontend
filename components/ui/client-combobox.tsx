"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { useClients } from "@/lib/hooks";
import { clientsService } from "@/lib/services";
import type { Client } from "@/lib/types";

interface ClientComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function ClientCombobox({ value, onChange }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Local clients (preloaded)
  const { data: localClients } = useClients({ page: 1, limit: 100 });

  // Filter local clients by query
  const localMatches = (localClients ?? []).filter((c) =>
    !query || c.name.toLowerCase().includes(query.toLowerCase()),
  );

  // Search backend when 3+ chars and no local matches
  const searchBackend = useCallback(async (q: string) => {
    if (q.length < 3) {
      setRemoteResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await clientsService.list({ page: 1, limit: 20 });
      const all = Array.isArray(res.data) ? res.data : [];
      const filtered = all.filter((c) =>
        c.name.toLowerCase().includes(q.toLowerCase()),
      );
      setRemoteResults(filtered);
    } catch {
      setRemoteResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced backend search when local matches are empty
  useEffect(() => {
    if (!open || query.length < 3) {
      setRemoteResults([]);
      return;
    }
    if (localMatches.length > 0) {
      setRemoteResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchBackend(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, localMatches.length, searchBackend]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayList = localMatches.length > 0 ? localMatches : remoteResults;

  function handleSelect(name: string) {
    onChange(name);
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center h-10 rounded-lg border bg-white/5 px-3 transition-colors ${
          open ? "border-neon/30 bg-white/6" : "border-white/8"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={open ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          placeholder={value || "Buscar cliente..."}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none min-w-0"
        />
        {value && !open && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {searching && <Loader2 className="h-3.5 w-3.5 text-white/30 animate-spin" />}
        <ChevronDown className={`h-3.5 w-3.5 text-white/20 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/8 bg-[#111117] shadow-xl overflow-hidden">
          <div className="max-h-48 overflow-y-auto overscroll-contain">
            {displayList.length === 0 && !searching && query.length < 3 && (
              <div className="px-3 py-4 text-center text-xs text-white/25">
                Escribí para filtrar
              </div>
            )}
            {displayList.length === 0 && !searching && query.length >= 3 && (
              <div className="px-3 py-4 text-center text-xs text-white/25">
                No se encontraron clientes
              </div>
            )}
            {searching && displayList.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-white/25">
                Buscando...
              </div>
            )}
            {displayList.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.name)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${
                  c.name === value ? "bg-neon/5" : ""
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-[11px] font-bold text-white/40">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${c.name === value ? "text-neon font-medium" : "text-white"}`}>
                    {c.name}
                  </p>
                  {c.company && (
                    <p className="text-[11px] text-white/30 truncate">{c.company}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Ticket, Users, FolderOpen, FileText, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import type { Ticket as TicketType, Client, Project, Receipt } from "@/lib/types";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "ticket" | "client" | "project" | "receipt";
}

const typeConfig = {
  ticket: { icon: Ticket, label: "Ticket", color: "text-neon" },
  client: { icon: Users, label: "Cliente", color: "text-blue-400" },
  project: { icon: FolderOpen, label: "Proyecto", color: "text-yellow-400" },
  receipt: { icon: FileText, label: "Comprobante", color: "text-emerald-400" },
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      document.body.style.overflow = "";
    }
  }, [open]);

  // Search logic
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [tickets, clients, projects, receipts] = await Promise.allSettled([
        api<TicketType[]>(`/tickets?page=1&limit=5&search=${encodeURIComponent(q)}`),
        api<Client[]>(`/clients?page=1&limit=5&search=${encodeURIComponent(q)}`),
        api<Project[]>(`/projects?page=1&limit=5&search=${encodeURIComponent(q)}`),
        api<Receipt[]>(`/receipts?page=1&limit=5&search=${encodeURIComponent(q)}`),
      ]);

      const items: SearchResult[] = [];

      if (tickets.status === "fulfilled" && tickets.value.data) {
        const data = Array.isArray(tickets.value.data) ? tickets.value.data : [];
        for (const t of data) {
          if (t.title?.toLowerCase().includes(q.toLowerCase()) || t.code?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              id: t.id,
              title: t.title,
              subtitle: `#${t.code} · ${t.client?.name ?? ""}`,
              href: `/tickets/${t.id}`,
              type: "ticket",
            });
          }
        }
      }

      if (clients.status === "fulfilled" && clients.value.data) {
        const data = Array.isArray(clients.value.data) ? clients.value.data : [];
        for (const c of data) {
          if (c.name?.toLowerCase().includes(q.toLowerCase()) || c.company?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              id: c.id,
              title: c.name,
              subtitle: c.company || c.email,
              href: `/clientes/${c.id}`,
              type: "client",
            });
          }
        }
      }

      if (projects.status === "fulfilled" && projects.value.data) {
        const data = Array.isArray(projects.value.data) ? projects.value.data : [];
        for (const p of data) {
          if (p.name?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              id: p.id,
              title: p.name,
              subtitle: p.client?.name ?? "",
              href: `/proyectos`,
              type: "project",
            });
          }
        }
      }

      if (receipts.status === "fulfilled" && receipts.value.data) {
        const data = Array.isArray(receipts.value.data) ? receipts.value.data : [];
        for (const r of data) {
          const num = `CP-${String(r.receiptNumber).padStart(8, "0")}`;
          if (num.toLowerCase().includes(q.toLowerCase()) || r.clientName?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              id: r.id,
              title: num,
              subtitle: r.clientName,
              href: `/comprobantes/${r.id}`,
              type: "receipt",
            });
          }
        }
      }

      setResults(items.slice(0, 10));
      setActiveIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    router.push(result.href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh]"
      onClick={(e) => {
        if (e.target === overlayRef.current) setOpen(false);
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg rounded-xl border border-white/10 bg-[#111117] shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/6 px-4">
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar tickets, clientes, proyectos, comprobantes..."
            className="h-12 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-mono text-white/30">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto overscroll-contain">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-white/30">Buscando...</div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-white/30">
              No se encontraron resultados para &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="px-4 py-6 text-center text-sm text-white/20">
              Escribí al menos 2 caracteres para buscar
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map((result, i) => {
                const config = typeConfig[result.type];
                const Icon = config.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === activeIndex ? "bg-white/5" : "hover:bg-white/3"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{result.title}</p>
                      <p className="text-xs text-white/40 truncate">{result.subtitle}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/30">
                      {config.label}
                    </span>
                    {i === activeIndex && (
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/20" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-white/6 px-4 py-2.5 text-[11px] text-white/20">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono">↑↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono">↵</kbd>
            abrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono">esc</kbd>
            cerrar
          </span>
        </div>
      </div>
    </div>
  );
}

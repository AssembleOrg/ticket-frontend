"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { useTickets } from "@/lib/hooks";
import { useMediaQuery } from "@/lib/use-media-query";
import { statusLabels, priorityLabels, formatDate } from "@/lib/format";
import type { TicketStatus, TicketPriority, Ticket } from "@/lib/types";
import { TicketForm } from "@/components/forms/ticket-form";

const estadoOptions = [
  { value: "OPEN", label: "Abierto" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "RESOLVED", label: "Revisión" },
  { value: "CLOSED", label: "Cerrado" },
];

const prioridadOptions = [
  { value: "CRITICAL", label: "Urgente" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Media" },
  { value: "LOW", label: "Bajo" },
];

export default function TicketsPage() {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Ticket | undefined>();
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    setView(isDesktop ? "list" : "grid");
  }, [isDesktop]);

  const { data: tickets, pagination, isLoading, mutate } = useTickets({
    page,
    limit,
    status: (status || undefined) as TicketStatus | undefined,
    priority: (priority || undefined) as TicketPriority | undefined,
  });

  const filtered = tickets?.filter(
    (t) =>
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()),
  );

  function handleEdit(ticket: Ticket) {
    setEditTarget(ticket);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditTarget(undefined);
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tickets"
        subtitle={pagination ? `${pagination.total} tickets` : undefined}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nuevo ticket
          </Button>
        }
      />

      <TicketForm
        open={showForm}
        onClose={handleCloseForm}
        onSuccess={() => mutate()}
        initialData={editTarget}
      />

      {/* Search + Filters + View toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          placeholder="Buscar tickets..."
          value={search}
          onChange={setSearch}
          className="min-w-0 flex-1"
        />
        <Select placeholder="Estado" options={estadoOptions} value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="w-32 sm:w-36" />
        <Select placeholder="Prioridad" options={prioridadOptions} value={priority} onChange={(v) => { setPriority(v); setPage(1); }} className="w-32 sm:w-36" />
        <ViewToggle view={view} onChange={setView} />
      </div>

      {isLoading ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <Card><TableSkeleton rows={6} cols={5} /></Card>
        )
      ) : (
        <>
          {/* Grid view */}
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered?.map((t) => (
                <Card key={t.id} className="flex flex-col gap-3 p-5 transition-colors hover:border-white/15">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={statusLabels[t.status] ?? t.status} />
                    <PriorityBadge priority={priorityLabels[t.priority] ?? t.priority} />
                    <span className="ml-auto font-mono text-[10px] text-white/25">#{t.code}</span>
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-white">{t.title}</p>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{t.client?.name ?? "—"}</span>
                    <span>{t.project?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-white/6 pt-2">
                    <span className="flex-1 font-mono text-[11px] text-white/25">{formatDate(t.createdAt)}</span>
                    <Link
                      href={`/tickets/${t.id}`}
                      className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => handleEdit(t)}
                      className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
              {filtered?.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-white/30">
                  No se encontraron tickets
                </p>
              ) : null}
            </div>
          ) : (
            /* List view */
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                      <th className="px-5 py-3">Ticket</th>
                      <th className="hidden px-5 py-3 sm:table-cell">Cliente</th>
                      <th className="hidden px-5 py-3 md:table-cell">Proyecto</th>
                      <th className="px-5 py-3 text-center">Estado</th>
                      <th className="hidden px-5 py-3 text-center sm:table-cell">Prioridad</th>
                      <th className="hidden px-5 py-3 lg:table-cell">Fecha</th>
                      <th className="px-5 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t border-white/4 transition-colors hover:bg-white/2"
                      >
                        <td className="px-5 py-4">
                          <Link href={`/tickets/${t.id}`} className="group">
                            <p className="text-sm font-medium text-white transition-colors group-hover:text-neon">
                              {t.title}
                            </p>
                            <p className="font-mono text-xs text-neon/60">#{t.code}</p>
                          </Link>
                        </td>
                        <td className="hidden px-5 py-4 text-sm text-white/50 sm:table-cell">
                          {t.client?.name ?? "—"}
                        </td>
                        <td className="hidden px-5 py-4 text-sm text-white/50 md:table-cell">
                          {t.project?.name ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={statusLabels[t.status] ?? t.status} />
                        </td>
                        <td className="hidden px-5 py-4 text-center sm:table-cell">
                          <PriorityBadge priority={priorityLabels[t.priority] ?? t.priority} />
                        </td>
                        <td className="hidden px-5 py-4 font-mono text-sm text-white/30 lg:table-cell">
                          {formatDate(t.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/tickets/${t.id}`}
                              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleEdit(t)}
                              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-sm text-white/30">
                          No se encontraron tickets
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <Pagination
        page={page}
        totalPages={pagination?.totalPages ?? 1}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={handleLimitChange}
        total={pagination?.total}
      />
    </div>
  );
}

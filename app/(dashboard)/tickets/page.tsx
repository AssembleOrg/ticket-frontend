"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Eye, Pencil, CheckCircle, RotateCcw, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTickets } from "@/lib/hooks";
import { useMediaQuery } from "@/lib/use-media-query";
import { ticketsService, timeEntriesService } from "@/lib/services";
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
  const [closeTarget, setCloseTarget] = useState<Ticket | null>(null);
  const [closeHours, setCloseHours] = useState(0);
  const [closeMinutes, setCloseMinutes] = useState(0);
  const [closingTicket, setClosingTicket] = useState(false);
  const [reopenTarget, setReopenTarget] = useState<Ticket | null>(null);

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

  async function handleCloseTicket() {
    if (!closeTarget) return;
    const totalMins = closeHours * 60 + closeMinutes;
    if (totalMins <= 0) {
      toast.error("Ingresá el tiempo dedicado antes de cerrar");
      return;
    }
    setClosingTicket(true);
    try {
      await timeEntriesService.create({
        minutes: totalMins,
        description: "Cierre de ticket",
        loggedBy: "Admin",
        ticketId: closeTarget.id,
      });
      await ticketsService.update(closeTarget.id, { status: "CLOSED" });
      mutate();
      setCloseTarget(null);
      setCloseHours(0);
      setCloseMinutes(0);
      toast.success("Ticket cerrado");
    } catch {
      toast.error("Error al cerrar ticket");
    } finally {
      setClosingTicket(false);
    }
  }

  async function handleReopenTicket() {
    if (!reopenTarget) return;
    try {
      await ticketsService.update(reopenTarget.id, { status: "IN_PROGRESS" });
      mutate();
      setReopenTarget(null);
      toast.success("Ticket reabierto");
    } catch {
      toast.error("Error al reabrir ticket");
    }
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

      {/* Close ticket modal */}
      <Modal
        open={closeTarget !== null}
        onClose={() => setCloseTarget(null)}
        title="Cerrar ticket"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCloseTarget(null)}>
              Cancelar
            </Button>
            <Button loading={closingTicket} onClick={handleCloseTicket}>
              <CheckCircle className="h-4 w-4" />
              Cerrar ticket
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-white/50">
            Indicá el tiempo total dedicado a este ticket antes de cerrarlo.
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-medium text-white/50">Horas</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCloseHours(Math.max(0, closeHours - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={closeHours}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n)) setCloseHours(Math.max(0, Math.min(999, n)));
                  }}
                  className="h-12 w-16 rounded-lg border border-white/10 bg-white/5 text-center text-2xl font-bold text-white outline-none focus:border-neon/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setCloseHours(Math.min(999, closeHours + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <span className="mt-6 text-2xl font-bold text-white/30">:</span>
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-medium text-white/50">Minutos</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCloseMinutes(Math.max(0, closeMinutes - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={closeMinutes}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n)) setCloseMinutes(Math.max(0, Math.min(59, n)));
                  }}
                  className="h-12 w-16 rounded-lg border border-white/10 bg-white/5 text-center text-2xl font-bold text-white outline-none focus:border-neon/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setCloseMinutes(Math.min(59, closeMinutes + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Reopen ticket confirmation */}
      <ConfirmDialog
        open={reopenTarget !== null}
        onClose={() => setReopenTarget(null)}
        onConfirm={handleReopenTicket}
        title="Reabrir ticket"
        description="¿Querés reabrir este ticket? Se cambiará el estado a En progreso."
        confirmLabel="Reabrir"
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
                    {t.status === "CLOSED" ? (
                      <button
                        onClick={() => setReopenTarget(t)}
                        className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-amber-400"
                        title="Reabrir"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setCloseTarget(t)}
                        className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-green-400"
                        title="Cerrar"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
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
                            {t.status === "CLOSED" ? (
                              <button
                                onClick={() => setReopenTarget(t)}
                                className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-amber-400"
                                title="Reabrir"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setCloseTarget(t)}
                                className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-green-400"
                                title="Cerrar"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
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

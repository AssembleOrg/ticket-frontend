"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Mail, Phone, Building2, ChevronRight, Plus, Ticket, FileText, ArrowUpRight, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useClient, useProjectsByClient, useHourPackStatus, useHourPackByClient, useTickets, useReceipts } from "@/lib/hooks";
import { clientsService } from "@/lib/services";
import { statusLabels, priorityLabels, formatDate } from "@/lib/format";
import { ClientForm } from "@/components/forms/client-form";
import { HourPackForm } from "@/components/forms/hour-pack-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { client, isLoading: loadingClient, mutate } = useClient(id);
  const { data: projects, isLoading: loadingProjects } = useProjectsByClient(id);
  const { status: hourPackStatus, isLoading: loadingHours, mutate: mutateHours } = useHourPackStatus(id);
  const { hourPack, mutate: mutateHourPack } = useHourPackByClient(id);
  const { data: allTickets } = useTickets({ page: 1, limit: 100, clientId: id });
  const { data: allReceipts } = useReceipts({ page: 1, limit: 100 });

  // Filter receipts by client name (no backend filter available)
  const clientReceipts = useMemo(() => {
    if (!allReceipts || !client) return [];
    return allReceipts.filter((r) => r.clientName === client.name);
  }, [allReceipts, client]);

  const [showEdit, setShowEdit] = useState(false);
  const [showHourPack, setShowHourPack] = useState(false);
  const [editHourPackData, setEditHourPackData] = useState<{ id: string; weeklyHours: number; active: boolean } | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasHourPack = !!hourPackStatus;
  const packWeeklyHours = Number(
    hourPackStatus?.pack?.weeklyHours ?? hourPackStatus?.hourPack?.weeklyHours ?? 0,
  );
  const packIsActive = hourPack?.active ?? true;
  const consumedMinutes = hourPackStatus?.currentMonth?.consumedMinutes ?? 0;
  const availableMinutes =
    hourPackStatus?.currentMonth?.totalAvailableMinutes ??
    hourPackStatus?.currentMonth?.allocatedMinutes ??
    0;
  const carryOverMinutes = hourPackStatus?.currentMonth?.carryOverMinutes ?? 0;
  const consumedPercentage =
    availableMinutes > 0 ? Math.round((consumedMinutes / availableMinutes) * 100) : 0;

  async function handleDelete() {
    try {
      await clientsService.delete(id);
      toast.success("Cliente eliminado");
      router.push("/clientes");
    } catch {
      toast.error("Error al eliminar cliente");
    }
  }

  if (loadingClient) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-white/40">Cliente no encontrado</p>
        <Link href="/clientes" className="mt-4 text-sm text-neon hover:underline">
          Volver a clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Clientes", href: "/clientes" },
          { label: client.name },
        ]}
      />

      <ClientForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={() => mutate()}
        initialData={client}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar cliente"
        description={`¿Eliminar a ${client.name}? Se eliminarán todos sus proyectos y tickets asociados. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />

      <HourPackForm
        open={showHourPack}
        onClose={() => { setShowHourPack(false); setEditHourPackData(undefined); }}
        onSuccess={() => { mutateHours(); mutateHourPack(); }}
        clientId={id}
        editData={editHourPackData}
      />

      {/* Client header */}
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={client.name} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-white">{client.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-white/40">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {client.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {client.company}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="ghost"
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-white/40">Proyectos</p>
          <p className="mt-1 text-2xl font-bold text-white">{projects?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">Tickets</p>
          <p className="mt-1 text-2xl font-bold text-white">{allTickets?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">Comprobantes</p>
          <p className="mt-1 text-2xl font-bold text-white">{clientReceipts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">Horas consumidas</p>
          <p className="mt-1 text-2xl font-bold text-neon">
            {availableMinutes > 0 ? `${Math.round(consumedMinutes / 60)}h` : "—"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Tickets */}
          <Card>
            <CardHeader
              title="Tickets"
              action={
                <Link
                  href={`/tickets?clientId=${id}`}
                  className="flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/70"
                >
                  Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-white/6 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                    <th className="px-5 py-3">Ticket</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="hidden px-5 py-3 sm:table-cell">Prioridad</th>
                    <th className="hidden px-5 py-3 md:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {allTickets?.slice(0, 8).map((t) => (
                    <tr key={t.id} className="border-t border-white/4 transition-colors hover:bg-white/2">
                      <td className="px-5 py-3">
                        <Link href={`/tickets/${t.id}`} className="group">
                          <p className="text-sm font-medium text-white transition-colors group-hover:text-neon">{t.title}</p>
                          <p className="text-xs font-mono text-neon/60">#{t.code}</p>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={statusLabels[t.status] ?? t.status} />
                      </td>
                      <td className="hidden px-5 py-3 sm:table-cell">
                        <PriorityBadge priority={priorityLabels[t.priority] ?? t.priority} />
                      </td>
                      <td className="hidden px-5 py-3 md:table-cell">
                        <span className="text-xs text-white/30">{formatDate(t.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                  {(!allTickets || allTickets.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-white/30">Sin tickets</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Receipts */}
          <Card>
            <CardHeader
              title="Comprobantes"
              action={
                <Link
                  href="/comprobantes"
                  className="flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/70"
                >
                  Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-white/6 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                    <th className="px-5 py-3">Comprobante</th>
                    <th className="hidden px-5 py-3 sm:table-cell">Fecha</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {clientReceipts.slice(0, 5).map((r) => (
                    <tr key={r.id} className="border-t border-white/4 transition-colors hover:bg-white/2">
                      <td className="px-5 py-3">
                        <Link href={`/comprobantes/${r.id}`} className="flex items-center gap-2 group">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${r.status === "VOIDED" ? "bg-red-500/10" : "bg-neon/10"}`}>
                            <FileText className={`h-3.5 w-3.5 ${r.status === "VOIDED" ? "text-red-400" : "text-neon"}`} />
                          </div>
                          <span className={`text-sm font-mono font-medium transition-colors group-hover:text-neon ${r.status === "VOIDED" ? "text-white/30 line-through" : "text-white"}`}>
                            CP-{String(r.receiptNumber).padStart(8, "0")}
                          </span>
                        </Link>
                      </td>
                      <td className="hidden px-5 py-3 sm:table-cell">
                        <span className="flex items-center gap-1.5 text-xs text-white/40">
                          <Calendar className="h-3 w-3" />
                          {formatDate(r.paymentDate)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-semibold font-mono ${r.status === "VOIDED" ? "text-white/20 line-through" : "text-neon"}`}>
                          {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(r.totalPaid)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {clientReceipts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-white/30">Sin comprobantes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Projects */}
          <Card>
            <CardHeader
              title="Proyectos"
              action={
                projects ? (
                  <span className="text-xs font-medium text-white/40">
                    {projects.length} activos
                  </span>
                ) : null
              }
            />
            {loadingProjects ? (
              <TableSkeleton rows={3} cols={2} />
            ) : (
              <div className="flex flex-col">
                {projects?.map((p) => (
                  <Link
                    key={p.id}
                    href={`/tickets?projectId=${p.id}`}
                    className="flex items-center justify-between border-t border-white/4 px-5 py-4 transition-colors hover:bg-white/2"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-white/30">
                          {p._count?.tickets ?? 0} tickets
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20" />
                  </Link>
                ))}
                {projects?.length === 0 ? (
                  <div className="border-t border-white/4 px-5 py-8 text-center text-sm text-white/30">
                    Sin proyectos
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          {/* Hour packs */}
          <Card>
            <CardHeader
              title="Packs de Horas"
              action={
                <button
                  onClick={() => setShowHourPack(true)}
                  disabled={hasHourPack}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/15 text-neon transition-colors hover:bg-neon/25 disabled:opacity-30 disabled:pointer-events-none"
                  title={hasHourPack ? "Este cliente ya tiene un pack asignado" : "Crear pack de horas"}
                >
                  <Plus className="h-4 w-4" />
                </button>
              }
            />
            <div className="flex flex-col gap-4 px-5 pb-5">
              {loadingHours ? (
                <Skeleton className="h-24 w-full" />
              ) : hasHourPack ? (
                <div className="rounded-lg border border-white/6 bg-white/2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Pack Mensual</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={packIsActive ? "Activo" : "Inactivo"} />
                      <button
                        onClick={() => {
                          if (!hourPack?.id) return;
                          setEditHourPackData({ id: hourPack.id, weeklyHours: packWeeklyHours, active: packIsActive });
                          setShowHourPack(true);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/10 hover:text-white"
                        title="Editar pack"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-white/30">
                      {Math.round(consumedMinutes / 60)}h / {Math.round(availableMinutes / 60)}h
                    </span>
                    <span className="font-bold text-neon">{consumedPercentage}%</span>
                  </div>
                  <ProgressBar
                    value={consumedMinutes}
                    max={availableMinutes}
                    className="mt-2"
                  />
                  <p className="mt-2 text-xs text-white/30">
                    {packWeeklyHours}h semanales · carry-over: {Math.round(carryOverMinutes / 60)}h
                  </p>
                </div>
              ) : (
                <p className="text-sm text-white/30">Sin pack de horas asignado</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

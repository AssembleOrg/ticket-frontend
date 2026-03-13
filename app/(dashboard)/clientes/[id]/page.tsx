"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Mail, Phone, Building2, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useClient, useProjectsByClient, useHourPackStatus, useHourPackByClient } from "@/lib/hooks";
import { clientsService } from "@/lib/services";
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
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
  );
}

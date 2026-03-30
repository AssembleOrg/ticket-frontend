"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, Users, Clock, CheckCircle, FolderOpen, ArrowUpRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject, useTickets } from "@/lib/hooks";
import { statusLabels, priorityLabels, formatDate } from "@/lib/format";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, isLoading: loadingProject } = useProject(id);
  const { data: tickets, isLoading: loadingTickets } = useTickets({ page: 1, limit: 100, projectId: id });

  const stats = useMemo(() => {
    if (!tickets) return { open: 0, inProgress: 0, resolved: 0, closed: 0, totalMinutes: 0 };
    return {
      open: tickets.filter((t) => t.status === "OPEN").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
      closed: tickets.filter((t) => t.status === "CLOSED").length,
      totalMinutes: tickets.reduce((sum, t) => sum + (t.totalMinutes ?? 0), 0),
    };
  }, [tickets]);

  if (loadingProject) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-white/50">Proyecto no encontrado</p>
        <Link href="/proyectos" className="text-neon hover:underline text-sm">
          Volver a proyectos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Proyectos", href: "/proyectos" },
          { label: project.name },
        ]}
      />

      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neon/10">
              <FolderOpen className="h-6 w-6 text-neon" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="mt-1 text-sm text-white/40">{project.description}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-white/30">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {project.client?.name ?? "—"}
                </span>
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>
          <Link
            href="/proyectos"
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs text-white/40">Abiertos</p>
          <p className="mt-1 text-2xl font-bold text-neon">{stats.open}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">En progreso</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{stats.inProgress}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">Revisión</p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">{stats.resolved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">Cerrados</p>
          <p className="mt-1 text-2xl font-bold text-white/40">{stats.closed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">Horas totales</p>
          <p className="mt-1 text-2xl font-bold text-white">{Math.round(stats.totalMinutes / 60)}h</p>
        </Card>
      </div>

      {/* Tickets table */}
      <Card>
        <CardHeader
          title="Tickets del proyecto"
          action={
            <Link
              href={`/tickets?projectId=${id}`}
              className="flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Ver en tickets <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {loadingTickets ? (
          <div className="p-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-white/6 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Responsable</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="hidden px-5 py-3 text-center sm:table-cell">Prioridad</th>
                  <th className="hidden px-5 py-3 md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tickets?.map((t) => (
                  <tr key={t.id} className="border-t border-white/4 transition-colors hover:bg-white/2">
                    <td className="px-5 py-4">
                      <Link href={`/tickets/${t.id}`} className="group">
                        <p className="text-sm font-medium text-white transition-colors group-hover:text-neon">{t.title}</p>
                        <p className="text-xs font-mono text-neon/60">#{t.code}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-white/50">
                      {t.responsible?.name ?? "No asignado"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={statusLabels[t.status] ?? t.status} />
                    </td>
                    <td className="hidden px-5 py-4 text-center sm:table-cell">
                      <PriorityBadge priority={priorityLabels[t.priority] ?? t.priority} />
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      <span className="text-xs text-white/30">{formatDate(t.createdAt)}</span>
                    </td>
                  </tr>
                ))}
                {(!tickets || tickets.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-white/30">Sin tickets en este proyecto</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

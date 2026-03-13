"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Users,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/lib/hooks";
import { statusLabels, priorityLabels } from "@/lib/format";
import { TicketForm } from "@/components/forms/ticket-form";

export default function DashboardPage() {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const { stats, isLoading, mutate } = useDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general del sistema"
        action={
          <Button onClick={() => setShowTicketForm(true)}>
            <Plus className="h-4 w-4" />
            Nuevo ticket
          </Button>
        }
      />

      <TicketForm
        open={showTicketForm}
        onClose={() => setShowTicketForm(false)}
        onSuccess={() => mutate()}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tickets abiertos", value: stats?.openTickets ?? 0, icon: Ticket },
          { label: "Clientes activos", value: stats?.totalClients ?? 0, icon: Users },
          { label: "Horas consumidas", value: `${stats?.consumedHoursThisMonth ?? 0}h`, icon: Clock, subtitle: "este mes" },
          { label: "Tickets cerrados", value: stats?.closedTickets ?? 0, icon: CheckCircle },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-white/40">{s.label}</p>
              <s.icon className="h-5 w-5 text-white/20" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <>
                <p className="mt-2 text-3xl font-bold text-white">{s.value}</p>
                {"subtitle" in s && (
                  <p className="mt-0.5 text-xs text-white/30">{s.subtitle}</p>
                )}
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Recent tickets */}
        <Card>
          <CardHeader
            title="Tickets recientes"
            action={
              <Link
                href="/tickets"
                className="flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/70"
              >
                Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {isLoading ? (
            <div className="flex flex-col gap-4 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-white/6 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                    <th className="px-5 py-3">Código/Título</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Prioridad</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentTickets?.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-white/4 transition-colors hover:bg-white/2"
                    >
                      <td className="px-5 py-4">
                        <Link href={`/tickets/${t.id}`} className="group">
                          <span className="text-neon text-xs font-mono">{t.code}</span>
                          <span className="ml-1 text-sm text-white group-hover:text-neon transition-colors">
                            {t.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/60">
                        {t.client?.name ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={statusLabels[t.status] ?? t.status} />
                      </td>
                      <td className="px-5 py-4">
                        <PriorityBadge priority={priorityLabels[t.priority] ?? t.priority} />
                      </td>
                    </tr>
                  ))}
                  {stats?.recentTickets?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-white/30">
                        No hay tickets aún
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Hour packs per client */}
        <Card>
          <CardHeader
            title="Packs de horas"
            action={
              <Link
                href="/clientes"
                className="flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/70"
              >
                Ver clientes <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="flex flex-col gap-3 px-5 pb-5">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : stats?.hourPacks && stats.hourPacks.length > 0 ? (
              stats.hourPacks.map((hp) => (
                <Link
                  key={hp.clientId}
                  href={`/clientes/${hp.clientId}`}
                  className="rounded-lg border border-white/6 bg-white/2 p-4 transition-colors hover:border-white/15"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{hp.clientName}</span>
                    <span className="text-xs font-bold text-neon">{hp.percentage}%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/30">
                    <span>
                      {Math.round(hp.consumedMinutes / 60)}h / {Math.round(hp.totalAvailableMinutes / 60)}h
                    </span>
                    <span>{hp.weeklyHours}h/sem</span>
                  </div>
                  <ProgressBar
                    value={hp.consumedMinutes}
                    max={hp.totalAvailableMinutes}
                    className="mt-2"
                  />
                </Link>
              ))
            ) : (
              <p className="text-sm text-white/30">Sin packs de horas activos</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

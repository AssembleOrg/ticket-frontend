"use client";

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
import { useTickets, useClients } from "@/lib/hooks";
import { statusLabels, priorityLabels, formatDate } from "@/lib/format";
import { TicketForm } from "@/components/forms/ticket-form";
import { useState } from "react";

export default function DashboardPage() {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const { data: tickets, isLoading: loadingTickets, pagination: ticketsPag, mutate: mutateTickets } = useTickets({ page: 1, limit: 4 });
  const { data: clients, isLoading: loadingClients, pagination: clientsPag } = useClients({ page: 1, limit: 100 });

  const totalTickets = ticketsPag?.total ?? 0;
  const totalClients = clientsPag?.total ?? 0;

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
        onSuccess={() => mutateTickets()}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tickets abiertos", value: totalTickets, icon: Ticket },
          { label: "Clientes activos", value: totalClients, icon: Users },
          { label: "Horas consumidas", value: "—", icon: Clock },
          { label: "Tickets resueltos", value: "—", icon: CheckCircle },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-white/40">{s.label}</p>
              <s.icon className="h-5 w-5 text-white/20" />
            </div>
            {loadingTickets || loadingClients ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-white">{s.value}</p>
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
          {loadingTickets ? (
            <div className="flex flex-col gap-4 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-white/[0.06] text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                    <th className="px-5 py-3">Código/Título</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Prioridad</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets?.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]"
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
                  {tickets?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-white/30">
                        No hay tickets aún
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Hour packs placeholder - requires aggregation not available in a single endpoint */}
        <Card>
          <CardHeader title="Packs de horas" />
          <div className="px-5 pb-5">
            <p className="text-sm text-white/30">
              Los packs de horas se muestran en el detalle de cada cliente.
            </p>
            <Link
              href="/clientes"
              className="mt-3 flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/70"
            >
              Ver clientes <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

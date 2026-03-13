"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useHourPackAudits } from "@/lib/hooks";
import { formatDate, formatRelativeTime } from "@/lib/format";

const actionLabels: Record<string, string> = {
  CREATED: "Creación",
  UPDATED: "Actualización",
  CARRY_OVER: "Carry-over",
  MANUAL_ADJUSTMENT: "Ajuste manual",
};

function formatChange(prev: Record<string, any> | null, next: Record<string, any> | null): string {
  if (!prev || !next) return "—";
  const parts: string[] = [];

  if (prev.weeklyHours !== undefined && next.weeklyHours !== undefined && prev.weeklyHours !== next.weeklyHours) {
    parts.push(`Horas semanales: ${prev.weeklyHours}h → ${next.weeklyHours}h`);
  }
  if (prev.monthlyHours !== undefined && next.monthlyHours !== undefined && prev.monthlyHours !== next.monthlyHours) {
    parts.push(`Horas mensuales: ${prev.monthlyHours}h → ${next.monthlyHours}h`);
  }
  if (prev.active !== undefined && next.active !== undefined && prev.active !== next.active) {
    parts.push(`Estado: ${prev.active ? "Activo" : "Inactivo"} → ${next.active ? "Activo" : "Inactivo"}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Sin cambios de valores";
}

export default function AuditoriaPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: audits, pagination, isLoading } = useHourPackAudits({ page, limit });

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Auditoría"
        subtitle={pagination ? `${pagination.total} registros` : undefined}
      />

      {isLoading ? (
        <Card><TableSkeleton rows={8} cols={5} /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3 text-center">Acción</th>
                  <th className="hidden px-5 py-3 md:table-cell">Cambios</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Motivo</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {audits?.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-white/4 transition-colors hover:bg-white/2"
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-white/60">{formatDate(a.createdAt)}</span>
                        <span className="text-xs text-white/25">{formatRelativeTime(a.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {a.hourPack?.client ? (
                        <Link
                          href={`/clientes/${a.hourPack.client.id}`}
                          className="text-sm font-medium text-white transition-colors hover:text-neon"
                        >
                          {a.hourPack.client.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        a.action === "CREATED"
                          ? "bg-green-500/15 text-green-400"
                          : a.action === "UPDATED"
                            ? "bg-blue-500/15 text-blue-400"
                            : a.action === "CARRY_OVER"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-white/10 text-white/50"
                      }`}>
                        {actionLabels[a.action] ?? a.action}
                      </span>
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      <span className="text-sm text-white/50">
                        {formatChange(a.previousValue, a.newValue)}
                      </span>
                    </td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <span className="text-sm text-white/40">{a.reason || "—"}</span>
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      <span className="text-sm text-white/40">{a.changedBy}</span>
                    </td>
                  </tr>
                ))}
                {audits?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-white/30">
                      No hay registros de auditoría
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
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

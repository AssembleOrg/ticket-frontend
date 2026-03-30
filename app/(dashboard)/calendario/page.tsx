"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTickets } from "@/lib/hooks";
import { statusLabels } from "@/lib/format";
import type { Ticket } from "@/lib/types";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Next month padding
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }

  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function generateGoogleCalendarUrl(ticket: Ticket): string {
  const date = new Date(ticket.createdAt);
  const start = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const end = new Date(date.getTime() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `[${ticket.code}] ${ticket.title}`,
    dates: `${start}/${end}`,
    details: `Ticket: ${ticket.code}\nCliente: ${ticket.client?.name ?? ""}\nEstado: ${statusLabels[ticket.status] ?? ticket.status}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-neon/30",
  IN_PROGRESS: "bg-blue-400/30",
  RESOLVED: "bg-yellow-400/30",
  CLOSED: "bg-white/10",
};

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { data: tickets } = useTickets({ page: 1, limit: 100 });

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const ticketsByDate = useMemo(() => {
    if (!tickets) return new Map<string, Ticket[]>();
    const map = new Map<string, Ticket[]>();
    for (const t of tickets) {
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tickets]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Calendario" subtitle="Vista mensual de actividad" />

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-white">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/6">
          {DAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-white/30">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map(({ date, isCurrentMonth }, i) => {
            const isToday = isSameDay(date, today);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayTickets = ticketsByDate.get(key) ?? [];

            return (
              <div
                key={i}
                className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-white/4 p-1.5 ${
                  !isCurrentMonth ? "bg-white/1" : ""
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-neon text-black" :
                  isCurrentMonth ? "text-white/50" : "text-white/15"
                }`}>
                  {date.getDate()}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayTickets.slice(0, 3).map((t) => (
                    <a
                      key={t.id}
                      href={generateGoogleCalendarUrl(t)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-center gap-1 rounded px-1 py-0.5 text-[9px] sm:text-[10px] truncate transition-colors hover:bg-white/5 ${STATUS_COLORS[t.status] ?? "bg-white/5"}`}
                      title={`${t.code}: ${t.title} — Click para agregar a Google Calendar`}
                    >
                      <span className="truncate text-white/70">{t.title}</span>
                      <ExternalLink className="h-2 w-2 shrink-0 text-white/20 opacity-0 group-hover:opacity-100" />
                    </a>
                  ))}
                  {dayTickets.length > 3 && (
                    <span className="text-[9px] text-white/20 px-1">+{dayTickets.length - 3} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-neon/30" />
          <span className="text-white/40">Abierto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-blue-400/30" />
          <span className="text-white/40">En progreso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-yellow-400/30" />
          <span className="text-white/40">Revisión</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-white/10" />
          <span className="text-white/40">Cerrado</span>
        </div>
        <span className="text-white/20 ml-auto">Click en ticket para agregar a Google Calendar</span>
      </div>
    </div>
  );
}

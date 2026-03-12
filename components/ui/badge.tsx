import { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-neon/15 text-neon border-neon/30",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  muted: "bg-white/10 text-white/60 border-white/20",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

const statusMap: Record<string, BadgeVariant> = {
  OPEN: "success",
  Abierto: "success",
  IN_PROGRESS: "info",
  "En progreso": "info",
  RESOLVED: "warning",
  Revisión: "warning",
  CLOSED: "muted",
  Cerrado: "muted",
  Activo: "success",
  "En pausa": "warning",
  Finalizado: "muted",
  Agotado: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusMap[status] ?? "muted"}>{status}</Badge>;
}

const priorityMap: Record<string, BadgeVariant> = {
  LOW: "muted",
  Bajo: "muted",
  MEDIUM: "warning",
  Media: "warning",
  HIGH: "danger",
  Alta: "danger",
  CRITICAL: "danger",
  Urgente: "danger",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant={priorityMap[priority] ?? "muted"}>{priority}</Badge>;
}

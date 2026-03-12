"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Pencil,
  CheckCircle,
  Plus,
  Upload,
  FileText,
  ImageIcon,
  Send,
  Building2,
  FolderOpen,
  Calendar,
  Square,
  SquareCheckBig,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTicket, useComments, useTasks, useAttachments } from "@/lib/hooks";
import { commentsService, tasksService, attachmentsService } from "@/lib/services";
import {
  statusLabels,
  priorityLabels,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  minutesToHours,
} from "@/lib/format";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ticket, isLoading: loadingTicket, mutate: mutateTicket } = useTicket(id);
  const { data: comments, mutate: mutateComments } = useComments(id);
  const { data: tasks, mutate: mutateTasks } = useTasks(id);
  const { data: attachments, mutate: mutateAttachments } = useAttachments(id);

  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const completedTasks = tasks?.filter((t) => t.status === "DONE").length ?? 0;

  async function handleSendComment() {
    if (!comment.trim() || !ticket) return;
    setSendingComment(true);
    try {
      await commentsService.create({
        content: comment,
        authorName: "Admin",
        authorType: "admin",
        ticketId: ticket.id,
      });
      setComment("");
      mutateComments();
      toast.success("Comentario agregado");
    } catch {
      toast.error("Error al enviar comentario");
    } finally {
      setSendingComment(false);
    }
  }

  async function handleToggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "DONE" ? "PENDING" : "DONE";
    try {
      await tasksService.update(taskId, { status: newStatus });
      mutateTasks();
    } catch {
      toast.error("Error al actualizar tarea");
    }
  }

  async function handleDownload(attachmentId: string) {
    try {
      const res = await attachmentsService.getUrl(attachmentId);
      window.open(res.data.signedUrl, "_blank");
    } catch {
      toast.error("Error al obtener URL del archivo");
    }
  }

  if (loadingTicket) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-white/40">Ticket no encontrado</p>
        <Link href="/tickets" className="mt-4 text-sm text-neon hover:underline">
          Volver a tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Tickets", href: "/tickets" },
          { label: `#${ticket.code}` },
        ]}
      />

      {/* Ticket header */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-white/40">
                #{ticket.code}
              </span>
              <StatusBadge status={statusLabels[ticket.status] ?? ticket.status} />
              <PriorityBadge priority={priorityLabels[ticket.priority] ?? ticket.priority} />
            </div>
            <h1 className="mt-2 text-xl font-bold text-white">
              {ticket.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/40">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {ticket.client?.name ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                {ticket.project?.name ?? "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(ticket.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button>
              <CheckCircle className="h-4 w-4" />
              Cerrar ticket
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Description */}
          <Card>
            <CardHeader title="Descripción" />
            <div className="px-5 pb-5">
              <p className="text-sm leading-relaxed text-white/60">
                {ticket.description}
              </p>
            </div>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader
              title="Comentarios"
              action={
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-2 text-xs text-white/40">
                  {comments?.length ?? 0}
                </span>
              }
            />
            <div className="flex flex-col gap-4 px-5 pb-5">
              {comments?.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.authorName} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {c.authorName}
                      </span>
                      <span className="text-xs text-white/30">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/50">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments?.length === 0 ? (
                <p className="text-sm text-white/30">Sin comentarios aún</p>
              ) : null}

              {/* Comment input */}
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Escribir comentario..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  disabled={sendingComment}
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-4 pr-10 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-white/20 disabled:opacity-50"
                />
                <button
                  onClick={handleSendComment}
                  disabled={sendingComment || !comment.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-neon disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader
              title="Tareas"
              action={
                <span className="text-xs text-white/30">
                  {completedTasks}/{tasks?.length ?? 0} completadas
                </span>
              }
            />
            <div className="flex flex-col gap-1 px-5 pb-5">
              {tasks?.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleToggleTask(t.id, t.status)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03] text-left"
                >
                  {t.status === "DONE" ? (
                    <SquareCheckBig className="h-5 w-5 shrink-0 text-neon" />
                  ) : (
                    <Square className="h-5 w-5 shrink-0 text-white/20" />
                  )}
                  <span
                    className={`text-sm ${
                      t.status === "DONE"
                        ? "text-white/30 line-through"
                        : "text-white/70"
                    }`}
                  >
                    {t.title}
                  </span>
                </button>
              ))}
              {tasks?.length === 0 ? (
                <p className="text-sm text-white/30">Sin tareas</p>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Attachments */}
          <Card>
            <CardHeader
              title="Archivos adjuntos"
              action={
                <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/15 text-neon transition-colors hover:bg-neon/25">
                  <Upload className="h-4 w-4" />
                </button>
              }
            />
            <div className="flex flex-col gap-3 px-5 pb-5">
              {attachments?.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleDownload(a.id)}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.03] cursor-pointer text-left w-full"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
                    {a.mimeType.startsWith("image/") ? (
                      <ImageIcon className="h-5 w-5 text-blue-400" />
                    ) : (
                      <FileText className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white">{a.originalName}</p>
                    <p className="text-xs text-white/30">{formatFileSize(a.size)}</p>
                  </div>
                </button>
              ))}
              {attachments?.length === 0 ? (
                <p className="text-sm text-white/30">Sin archivos</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

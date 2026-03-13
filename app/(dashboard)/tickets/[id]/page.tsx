"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
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
  Clock,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Modal } from "@/components/ui/modal";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TicketForm } from "@/components/forms/ticket-form";
import { useTicket } from "@/lib/hooks";
import { commentsService, attachmentsService, timeEntriesService, ticketsService } from "@/lib/services";
import type { Attachment } from "@/lib/types";
import {
  statusLabels,
  priorityLabels,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  minutesToHours,
} from "@/lib/format";

function Lightbox({
  attachments,
  initialIndex,
  onClose,
  onDelete,
}: {
  attachments: Attachment[];
  initialIndex: number;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = attachments[index];

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % attachments.length);
  }, [attachments.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + attachments.length) % attachments.length);
  }, [attachments.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  if (!current) return null;

  const url = current.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <span className="text-sm text-white/60">{current.originalName}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(current.id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
              title="Abrir original"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {attachments.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="relative z-0 max-h-[80vh] max-w-[90vw]">
        {url ? (
          <img
            src={url}
            alt={current.originalName}
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-64 w-96 items-center justify-center rounded-lg bg-white/5">
            <FileText className="h-16 w-16 text-white/20" />
            <p className="ml-4 text-white/40">Vista previa no disponible</p>
          </div>
        )}
      </div>

      {attachments.length > 1 && (
        <div className="absolute bottom-4 text-sm text-white/40">
          {index + 1} / {attachments.length}
        </div>
      )}
    </div>
  );
}

function SpinnerInput({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-sm font-medium text-white/50">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          className="h-12 w-16 rounded-lg border border-white/10 bg-white/5 text-center text-2xl font-bold text-white outline-none focus:border-neon/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ticket, isLoading: loadingTicket, mutate: mutateTicket } = useTicket(id);

  const comments = ticket?.comments;
  const attachments = ticket?.attachments;
  const totalMinutes = ticket?.totalMinutes ?? 0;

  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [showEditTicket, setShowEditTicket] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeHours, setCloseHours] = useState(0);
  const [closeMinutes, setCloseMinutes] = useState(0);
  const [closingTicket, setClosingTicket] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageAttachments = attachments?.filter((a) => a.mimeType.startsWith("image/")) ?? [];
  const fileAttachments = attachments?.filter((a) => !a.mimeType.startsWith("image/")) ?? [];

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
      mutateTicket();
      toast.success("Comentario agregado");
    } catch {
      toast.error("Error al enviar comentario");
    } finally {
      setSendingComment(false);
    }
  }

  async function handleCloseTicket() {
    if (!ticket) return;
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
        ticketId: ticket.id,
      });
      await ticketsService.update(ticket.id, { status: "CLOSED" });
      mutateTicket();
      setShowCloseModal(false);
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
    if (!ticket) return;
    try {
      await ticketsService.update(ticket.id, { status: "IN_PROGRESS" });
      mutateTicket();
      setShowReopenConfirm(false);
      toast.success("Ticket reabierto");
    } catch {
      toast.error("Error al reabrir ticket");
    }
  }

  function handleDownload(url: string | null) {
    if (url) window.open(url, "_blank");
    else toast.error("URL no disponible");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !ticket) return;
    setUploading(true);
    try {
      await attachmentsService.upload(file, ticket.id, "Admin");
      mutateTicket();
      toast.success("Archivo subido");
    } catch {
      toast.error("Error al subir archivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAttachment() {
    if (!deleteAttachmentId) return;
    try {
      await attachmentsService.delete(deleteAttachmentId);
      mutateTicket();
      toast.success("Archivo eliminado");
      if (lightboxIndex !== null) {
        const allAttachments = [...imageAttachments, ...fileAttachments];
        if (allAttachments[lightboxIndex]?.id === deleteAttachmentId) {
          setLightboxIndex(null);
        }
      }
    } catch {
      toast.error("Error al eliminar archivo");
    } finally {
      setDeleteAttachmentId(null);
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

  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Tickets", href: "/tickets" },
          { label: `#${ticket.code}` },
        ]}
      />

      <TicketForm
        open={showEditTicket}
        onClose={() => setShowEditTicket(false)}
        onSuccess={() => mutateTicket()}
        initialData={ticket}
      />

      {/* Close ticket modal with time spinner */}
      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Cerrar ticket"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowCloseModal(false)}>
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
            <SpinnerInput label="Horas" value={closeHours} onChange={setCloseHours} max={999} />
            <span className="mt-6 text-2xl font-bold text-white/30">:</span>
            <SpinnerInput label="Minutos" value={closeMinutes} onChange={setCloseMinutes} max={59} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteAttachmentId !== null}
        onClose={() => setDeleteAttachmentId(null)}
        onConfirm={handleDeleteAttachment}
        title="Eliminar archivo"
        description="¿Eliminar este archivo adjunto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />

      <ConfirmDialog
        open={showReopenConfirm}
        onClose={() => setShowReopenConfirm(false)}
        onConfirm={handleReopenTicket}
        title="Reabrir ticket"
        description="¿Querés reabrir este ticket? Se cambiará el estado a En progreso."
        confirmLabel="Reabrir"
      />

      {lightboxIndex !== null && (
        <Lightbox
          attachments={[...imageAttachments, ...fileAttachments]}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={(id) => {
            setLightboxIndex(null);
            setDeleteAttachmentId(id);
          }}
        />
      )}

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
              {totalMinutes > 0 && (
                <span className="flex items-center gap-1.5 text-neon">
                  <Clock className="h-3.5 w-3.5" />
                  {minutesToHours(totalMinutes)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setShowEditTicket(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            {isClosed ? (
              <Button variant="secondary" onClick={() => setShowReopenConfirm(true)}>
                <RotateCcw className="h-4 w-4" />
                Reabrir
              </Button>
            ) : (
              <Button onClick={() => setShowCloseModal(true)}>
                <CheckCircle className="h-4 w-4" />
                Cerrar ticket
              </Button>
            )}
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
                  className="h-10 w-full rounded-lg border border-white/8 bg-white/3 pl-4 pr-10 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-white/20 disabled:opacity-50"
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

        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Attachments */}
          <Card>
            <CardHeader
              title="Archivos adjuntos"
              action={
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/15 text-neon transition-colors hover:bg-neon/25 disabled:opacity-30"
                >
                  <Upload className="h-4 w-4" />
                </button>
              }
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              className="hidden"
            />
            <div className="px-5 pb-5">
              {imageAttachments.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imageAttachments.map((a, idx) => (
                    <div key={a.id} className="group relative">
                      <button
                        onClick={() => setLightboxIndex(idx)}
                        className="relative aspect-square w-full overflow-hidden rounded-lg border border-white/6 bg-white/3 cursor-pointer transition-all hover:border-white/20"
                      >
                        {a.url ? (
                          <img
                            src={a.url}
                            alt={a.originalName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-white/20 animate-pulse" />
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteAttachmentId(a.id)}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/60 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/80 hover:text-white cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {fileAttachments.length > 0 && (
                <div className="flex flex-col gap-2">
                  {fileAttachments.map((a) => (
                    <div
                      key={a.id}
                      className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/3"
                    >
                      <button
                        onClick={() => handleDownload(a.url)}
                        className="flex flex-1 items-center gap-3 cursor-pointer text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/6">
                          <FileText className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{a.originalName}</p>
                          <p className="text-xs text-white/30">{formatFileSize(a.size)}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setDeleteAttachmentId(a.id)}
                        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {attachments?.length === 0 && (
                <p className="text-sm text-white/30">Sin archivos</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

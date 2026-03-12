"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ticketsService } from "@/lib/services";
import { useClients, useProjects } from "@/lib/hooks";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";

interface TicketFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Ticket;
}

const priorityOptions = [
  { value: "LOW", label: "Bajo" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
  { value: "CRITICAL", label: "Urgente" },
];

const statusOptions = [
  { value: "OPEN", label: "Abierto" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "RESOLVED", label: "Revisión" },
  { value: "CLOSED", label: "Cerrado" },
];

export function TicketForm({ open, onClose, onSuccess, initialData }: TicketFormProps) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [status, setStatus] = useState<string>("OPEN");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");

  const { data: clients } = useClients({ page: 1, limit: 100 });
  const { data: projects } = useProjects({ page: 1, limit: 100 });

  const clientOptions = (clients ?? []).map((c) => ({ value: c.id, label: c.name }));

  const projectOptions = (projects ?? [])
    .filter((p) => !clientId || p.clientId === clientId)
    .map((p) => ({ value: p.id, label: p.name }));

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setPriority(initialData.priority);
      setStatus(initialData.status);
      setClientId(initialData.clientId);
      setProjectId(initialData.projectId);
    } else {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setStatus("OPEN");
      setClientId("");
      setProjectId("");
    }
  }, [initialData, open]);

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();

    if (!title || !clientId || !projectId || !priority) {
      toast.error("Completá los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await ticketsService.update(initialData.id, {
          title,
          description,
          priority: priority as TicketPriority,
          status: status as TicketStatus,
          clientId,
          projectId,
        });
        toast.success("Ticket actualizado");
      } else {
        await ticketsService.create({
          title,
          description,
          priority: priority as TicketPriority,
          clientId,
          projectId,
        });
        toast.success("Ticket creado correctamente");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(isEditing ? "Error al actualizar ticket" : "Error al crear ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar ticket" : "Nuevo ticket"}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={handleSubmit}>
            {isEditing ? "Guardar cambios" : "Crear ticket"}
          </Button>
        </div>
      }
    >
      <form id="ticket-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Título *"
          placeholder="Descripción breve del problema"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Descripción</label>
          <textarea
            placeholder="Detalle del problema o solicitud..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-neon/50 focus:ring-1 focus:ring-neon/25"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Prioridad *</label>
          <Select placeholder="Seleccionar prioridad" options={priorityOptions} value={priority} onChange={setPriority} />
        </div>
        {isEditing && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Estado</label>
            <Select placeholder="Seleccionar estado" options={statusOptions} value={status} onChange={setStatus} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Cliente *</label>
          <Select
            placeholder="Seleccionar cliente"
            options={clientOptions}
            value={clientId}
            onChange={(v) => {
              setClientId(v);
              setProjectId("");
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Proyecto *</label>
          <Select
            placeholder={clientId ? "Seleccionar proyecto" : "Primero seleccioná un cliente"}
            options={projectOptions}
            value={projectId}
            onChange={setProjectId}
          />
        </div>
      </form>
    </Modal>
  );
}

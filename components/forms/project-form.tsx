"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { projectsService } from "@/lib/services";
import { useClients } from "@/lib/hooks";
import type { Project } from "@/lib/types";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultClientId?: string;
  initialData?: Project;
}

export function ProjectForm({ open, onClose, onSuccess, defaultClientId, initialData }: ProjectFormProps) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState(defaultClientId ?? "");

  const { data: clients } = useClients({ page: 1, limit: 100 });

  const clientOptions = (clients ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? "");
      setClientId(initialData.clientId);
    } else {
      setName("");
      setDescription("");
      setClientId(defaultClientId ?? "");
    }
  }, [initialData, defaultClientId, open]);

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();

    if (!name || !clientId) {
      toast.error("Completá los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await projectsService.update(initialData.id, { name, description, clientId });
        toast.success("Proyecto actualizado");
      } else {
        await projectsService.create({ name, description, clientId });
        toast.success("Proyecto creado correctamente");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(isEditing ? "Error al actualizar proyecto" : "Error al crear proyecto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar proyecto" : "Nuevo proyecto"}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={handleSubmit}>
            {isEditing ? "Guardar cambios" : "Crear proyecto"}
          </Button>
        </div>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          placeholder="Sistema de Ventas"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Descripción</label>
          <textarea
            placeholder="Descripción del proyecto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-neon/50 focus:ring-1 focus:ring-neon/25"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Cliente *</label>
          <Select
            placeholder="Seleccionar cliente"
            options={clientOptions}
            value={clientId}
            onChange={setClientId}
          />
        </div>
      </form>
    </Modal>
  );
}

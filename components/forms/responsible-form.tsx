"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { responsiblesService } from "@/lib/services";
import type { Responsible } from "@/lib/types";

interface ResponsibleFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Responsible;
}

export function ResponsibleForm({ open, onClose, onSuccess, initialData }: ResponsibleFormProps) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
    } else {
      setName("");
    }
  }, [initialData, open]);

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await responsiblesService.update(initialData.id, { name: name.trim() });
        toast.success("Responsable actualizado");
      } else {
        await responsiblesService.create({ name: name.trim() });
        toast.success("Responsable creado");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(isEditing ? "Error al actualizar" : "Error al crear responsable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar responsable" : "Nuevo responsable"}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={handleSubmit}>
            {isEditing ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      }
    >
      <form id="responsible-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          placeholder="Nombre del responsable"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
}

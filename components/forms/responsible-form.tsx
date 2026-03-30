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
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email ?? "");
    } else {
      setName("");
      setEmail("");
    }
  }, [initialData, open]);

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("El email es obligatorio y debe ser válido");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await responsiblesService.update(initialData.id, { name: name.trim(), email: email.trim() });
        toast.success("Responsable actualizado");
      } else {
        await responsiblesService.create({ name: name.trim(), email: email.trim() });
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
        <Input
          label="Email *"
          type="email"
          placeholder="email@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p className="text-[11px] text-white/25">
          El email debe coincidir con una cuenta autorizada en el sistema.
        </p>
      </form>
    </Modal>
  );
}

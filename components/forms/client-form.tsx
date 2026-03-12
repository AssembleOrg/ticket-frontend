"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { clientsService } from "@/lib/services";
import type { Client } from "@/lib/types";

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Client;
}

export function ClientForm({ open, onClose, onSuccess, initialData }: ClientFormProps) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPhone(initialData.phone ?? "");
      setCompany(initialData.company);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
    }
  }, [initialData, open]);

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();

    if (!name || !email || !company) {
      toast.error("Completá los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await clientsService.update(initialData.id, { name, email, phone, company });
        toast.success("Cliente actualizado");
      } else {
        await clientsService.create({ name, email, phone, company });
        toast.success("Cliente creado correctamente");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(isEditing ? "Error al actualizar cliente" : "Error al crear cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar cliente" : "Nuevo cliente"}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={handleSubmit}>
            {isEditing ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </div>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          placeholder="María López"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email *"
          type="email"
          placeholder="maria@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Teléfono"
          placeholder="+54 11 1234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="Empresa *"
          placeholder="TechCorp SA"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
}

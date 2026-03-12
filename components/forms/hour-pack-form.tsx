"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { hourPacksService } from "@/lib/services";

interface HourPackFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
}

export function HourPackForm({ open, onClose, onSuccess, clientId }: HourPackFormProps) {
  const [loading, setLoading] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState("10");

  function handleClose() {
    setWeeklyHours("10");
    onClose();
  }

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();
    const hours = Number(weeklyHours);
    if (!hours || hours <= 0) {
      toast.error("Ingresá una cantidad válida de horas");
      return;
    }
    setLoading(true);
    try {
      await hourPacksService.create({ clientId, weeklyHours: hours });
      toast.success("Pack de horas creado");
      onSuccess();
      handleClose();
    } catch {
      toast.error("Error al crear pack de horas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo pack de horas"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={handleSubmit}>
            Crear pack
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">Horas por semana *</label>
          <input
            type="number"
            min="1"
            max="168"
            step="0.5"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-neon/50 focus:ring-1 focus:ring-neon/25"
            required
          />
          <p className="text-xs text-white/30">
            El sistema calcula el total mensual a partir de las horas semanales. Las horas sobrantes se acumulan al mes siguiente.
          </p>
        </div>
      </form>
    </Modal>
  );
}

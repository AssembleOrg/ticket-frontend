"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { hourPacksService } from "@/lib/services";

interface HourPackFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  /** Pass to enter edit mode */
  editData?: { id: string; weeklyHours: number; active: boolean };
}

export function HourPackForm({ open, onClose, onSuccess, clientId, editData }: HourPackFormProps) {
  const isEdit = !!editData;
  const [loading, setLoading] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState("10");
  const [active, setActive] = useState(true);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (editData) {
      setWeeklyHours(String(editData.weeklyHours));
      setActive(editData.active);
    } else {
      setWeeklyHours("10");
      setActive(true);
    }
    setReason("");
  }, [editData, open]);

  function handleClose() {
    onClose();
  }

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();
    const hours = Number(weeklyHours);
    if (!hours || hours <= 0) {
      toast.error("Ingresá una cantidad válida de horas");
      return;
    }
    if (isEdit && !reason.trim()) {
      toast.error("Indicá el motivo del cambio");
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await hourPacksService.update(editData.id, {
          weeklyHours: hours,
          active,
          reason: reason.trim(),
          changedBy: "Admin",
        });
        toast.success("Pack de horas actualizado");
      } else {
        await hourPacksService.create({ clientId, weeklyHours: hours });
        toast.success("Pack de horas creado");
      }
      onSuccess();
      handleClose();
    } catch {
      toast.error(isEdit ? "Error al actualizar pack" : "Error al crear pack de horas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar pack de horas" : "Nuevo pack de horas"}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={handleSubmit}>
            {isEdit ? "Guardar cambios" : "Crear pack"}
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

        {isEdit && (
          <>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-white/70">Estado</label>
              <button
                type="button"
                onClick={() => setActive((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  active ? "bg-neon" : "bg-white/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
                    active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm text-white/50">{active ? "Activo" : "Inactivo"}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/70">Motivo del cambio *</label>
              <input
                type="text"
                placeholder="Ej: Ajuste de contrato mensual"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-neon/50 focus:ring-1 focus:ring-neon/25"
                required
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

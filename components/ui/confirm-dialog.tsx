"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

const variantConfig: Record<
  ConfirmVariant,
  { icon: typeof Trash2; iconBg: string; iconColor: string; buttonClass: string }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    buttonClass: "bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-500/50",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    buttonClass: "bg-yellow-500 hover:bg-yellow-600 text-black focus-visible:ring-yellow-500/50",
  },
  info: {
    icon: Info,
    iconBg: "bg-neon/10",
    iconColor: "text-neon",
    buttonClass: "",
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="sm:max-w-md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            loading={loading}
            onClick={handleConfirm}
            className={variant !== "info" ? config.buttonClass : ""}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <p className="text-sm leading-relaxed text-white/60">{description}</p>
      </div>
    </Modal>
  );
}

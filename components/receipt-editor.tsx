"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, RotateCcw, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReceiptPreview } from "@/components/receipt-preview";
import { receiptsService } from "@/lib/services";
import type { Receipt, ReceiptItem, CreateReceiptPayload } from "@/lib/types";

interface ReceiptEditorProps {
  receipt?: Receipt;
  nextNumber?: number;
}

const emptyItem: ReceiptItem = {
  quantity: 1,
  code: "",
  description: "",
  unitPrice: 0,
  taxPercent: 0,
  discountPercent: 0,
};

const defaultCompany = {
  companyName: "PISTECH",
  companyAddress: "Contreras 575, Florencio Varela, Buenos Aires",
  companyPhone: "1138207230",
};

function formatReceiptNumber(n: number): string {
  return `CP-${String(n).padStart(8, "0")}`;
}

function calculateTotals(items: ReceiptItem[]) {
  let subtotal = 0;
  let discounts = 0;
  let taxTotal = 0;

  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    const lineDiscount = lineTotal * (item.discountPercent / 100);
    const lineTax = (lineTotal - lineDiscount) * (item.taxPercent / 100);
    subtotal += lineTotal;
    discounts += lineDiscount;
    taxTotal += lineTax;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discounts: Math.round(discounts * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    totalPaid: Math.round((subtotal - discounts + taxTotal) * 100) / 100,
  };
}

export function ReceiptEditor({ receipt, nextNumber }: ReceiptEditorProps) {
  const router = useRouter();
  const isEditing = !!receipt;
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState(receipt?.companyName ?? defaultCompany.companyName);
  const [companyAddress, setCompanyAddress] = useState(receipt?.companyAddress ?? defaultCompany.companyAddress);
  const [companyPhone, setCompanyPhone] = useState(receipt?.companyPhone ?? defaultCompany.companyPhone);
  const [paymentDate, setPaymentDate] = useState(receipt?.paymentDate ?? new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(receipt?.paymentMethod ?? "Transferencia Bancaria");
  const [clientName, setClientName] = useState(receipt?.clientName ?? "");
  const [items, setItems] = useState<ReceiptItem[]>(receipt?.items?.length ? receipt.items : [{ ...emptyItem }]);

  const receiptNumber = receipt?.receiptNumber ?? nextNumber ?? 500;

  const totals = useMemo(() => calculateTotals(items), [items]);

  function updateItem(index: number, field: keyof ReceiptItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleReset() {
    if (receipt) {
      setCompanyName(receipt.companyName);
      setCompanyAddress(receipt.companyAddress);
      setCompanyPhone(receipt.companyPhone);
      setPaymentDate(receipt.paymentDate);
      setPaymentMethod(receipt.paymentMethod);
      setClientName(receipt.clientName);
      setItems(receipt.items?.length ? receipt.items : [{ ...emptyItem }]);
    } else {
      setCompanyName(defaultCompany.companyName);
      setCompanyAddress(defaultCompany.companyAddress);
      setCompanyPhone(defaultCompany.companyPhone);
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod("Transferencia Bancaria");
      setClientName("");
      setItems([{ ...emptyItem }]);
    }
  }

  async function handleSave() {
    if (!clientName.trim()) {
      toast.error("Ingrese el nombre del cliente");
      return;
    }
    if (items.length === 0) {
      toast.error("Agregue al menos un item");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateReceiptPayload = {
        companyName,
        companyAddress,
        companyPhone,
        paymentDate,
        paymentMethod,
        clientName,
        items,
      };

      if (isEditing) {
        await receiptsService.update(receipt.id, payload);
        toast.success("Comprobante actualizado");
      } else {
        await receiptsService.create(payload);
        toast.success("Comprobante creado");
      }
      router.push("/comprobantes");
    } catch {
      toast.error("Error al guardar comprobante");
    } finally {
      setSaving(false);
    }
  }

  const formattedDate = paymentDate
    ? new Date(paymentDate + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "numeric", year: "numeric" })
    : "";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
      {/* Left panel - Config */}
      <div className="rounded-xl border border-white/8 bg-surface p-6 flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-lg">&#9881;</span> Configuración
        </h2>

        {/* Company info */}
        <section>
          <h3 className="text-sm font-semibold text-neon mb-3 flex items-center gap-2">
            <span>&#127970;</span> Información de la Empresa
          </h3>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Nombre de la Empresa</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Dirección</span>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Teléfono</span>
              <input
                type="text"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
              />
            </label>
          </div>
        </section>

        {/* Payment info */}
        <section>
          <h3 className="text-sm font-semibold text-neon mb-3 flex items-center gap-2">
            <span>&#128179;</span> Información del Pago
          </h3>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Número de Comprobante</span>
              <input
                type="text"
                value={formatReceiptNumber(receiptNumber)}
                readOnly
                className="h-10 rounded-lg border border-white/8 bg-white/3 px-3 text-sm text-white/50 outline-none cursor-not-allowed"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Fecha de Pago</span>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20 [color-scheme:dark]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Método de Pago</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20 [color-scheme:dark]"
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                <option value="MercadoPago">MercadoPago</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Cliente</span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
                className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/20"
              />
            </label>
          </div>
        </section>

        {/* Items */}
        <section>
          <h3 className="text-sm font-semibold text-neon mb-3 flex items-center gap-2">
            <span>&#128230;</span> Productos/Servicios
          </h3>
          <div className="flex flex-col gap-4">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-white/6 bg-white/2 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/50">Item {i + 1}</span>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Cantidad</span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)}
                      className="h-9 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Código</span>
                    <input
                      type="text"
                      value={item.code}
                      onChange={(e) => updateItem(i, "code", e.target.value)}
                      className="h-9 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Descripción</span>
                    <textarea
                      rows={3}
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 resize-y"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Precio Unitario</span>
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="h-9 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">IVA %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.taxPercent}
                      onChange={(e) => updateItem(i, "taxPercent", parseFloat(e.target.value) || 0)}
                      className="h-9 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Descuento %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discountPercent}
                      onChange={(e) => updateItem(i, "discountPercent", parseFloat(e.target.value) || 0)}
                      className="h-9 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
                    />
                  </label>
                </div>
              </div>
            ))}

            <Button variant="secondary" onClick={addItem} className="w-full">
              <Plus className="h-4 w-4" />
              Agregar Item
            </Button>
          </div>
        </section>

        {/* Actions */}
        <section>
          <h3 className="text-sm font-semibold text-neon mb-3 flex items-center gap-2">
            <span>&#127919;</span> Acciones
          </h3>
          <div className="flex flex-col gap-2">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Comprobante"}
            </Button>
            <Button variant="secondary" onClick={handleReset} className="w-full">
              <RotateCcw className="h-4 w-4" />
              Restablecer
            </Button>
          </div>
        </section>
      </div>

      {/* Right panel - Preview */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-lg">&#128065;</span> Vista Previa
          </h2>
          <span className="text-xs text-white/30">Los cambios se actualizan en tiempo real</span>
        </div>
        <ReceiptPreview
          companyName={companyName}
          companyAddress={companyAddress}
          companyPhone={companyPhone}
          receiptNumber={formatReceiptNumber(receiptNumber)}
          paymentDate={formattedDate}
          paymentMethod={paymentMethod}
          clientName={clientName}
          items={items}
          subtotal={totals.subtotal}
          discounts={totals.discounts}
          taxTotal={totals.taxTotal}
          totalPaid={totals.totalPaid}
        />
      </div>
    </div>
  );
}

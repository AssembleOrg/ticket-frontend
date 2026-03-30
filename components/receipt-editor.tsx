"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, RotateCcw, Building2, Banknote, Package, GripVertical, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClientCombobox } from "@/components/ui/client-combobox";
import { ReceiptPreview } from "@/components/receipt-preview";
import { receiptsService } from "@/lib/services";
import { exportReceiptToPdf } from "@/lib/export-pdf";
import type { Receipt, ReceiptItem, CreateReceiptPayload } from "@/lib/types";

interface ReceiptEditorProps {
  receipt?: Receipt;
  nextNumber?: number;
}

const emptyItem: ReceiptItem = {
  quantity: 1,
  code: "",
  description: "Pago por servidores, base de datos, soporte y mantenimiento",
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

const inputClass =
  "h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none transition-colors focus:border-neon/30 focus:bg-white/6";
const labelClass = "text-[11px] font-medium uppercase tracking-wider text-white/40";

export function ReceiptEditor({ receipt, nextNumber }: ReceiptEditorProps) {
  const router = useRouter();
  const isEditing = !!receipt;
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

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
    <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-6 items-start">
      {/* Left panel - Config */}
      <div className="flex flex-col gap-4">
        {/* Sticky actions */}
        <div className="rounded-xl border border-white/8 bg-surface p-4 flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Comprobante"}
          </Button>
          <Button
            variant="secondary"
            loading={exporting}
            size="md"
            onClick={async () => {
              if (!clientName.trim()) {
                toast.error("Ingrese el nombre del cliente");
                return;
              }
              if (items.length === 0) {
                toast.error("Agregue al menos un item");
                return;
              }

              setExporting(true);
              try {
                // Save first
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
                } else {
                  await receiptsService.create(payload);
                }

                // Then export PDF
                await exportReceiptToPdf(
                  "receipt-preview-editor",
                  `comprobante-${formatReceiptNumber(receiptNumber)}`,
                  {
                    companyName,
                    companyAddress,
                    companyPhone,
                    receiptNumber: formatReceiptNumber(receiptNumber),
                    paymentDate: formattedDate,
                    paymentMethod,
                    clientName,
                    items,
                    subtotal: totals.subtotal,
                    discounts: totals.discounts,
                    taxTotal: totals.taxTotal,
                    totalPaid: totals.totalPaid,
                  },
                );
                toast.success("Comprobante guardado y PDF descargado");
                router.push("/comprobantes");
              } catch {
                toast.error("Error al guardar o generar PDF");
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={handleReset} size="md">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-xl border border-white/8 bg-surface p-6 flex flex-col gap-6">
          {/* Payment info - most important, goes first */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/10">
                <Banknote className="h-3.5 w-3.5 text-neon" />
              </div>
              <h3 className="text-sm font-semibold text-white">Información del Pago</h3>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Número de Comprobante</span>
                <input
                  type="text"
                  value={formatReceiptNumber(receiptNumber)}
                  readOnly
                  className="h-10 rounded-lg border border-white/8 bg-white/3 px-3 text-sm font-mono text-neon/60 outline-none cursor-not-allowed"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Fecha de Pago</span>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>Método de Pago</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={`${inputClass} [color-scheme:dark]`}
                  >
                    {["Transferencia Bancaria", "Efectivo", "Tarjeta de Crédito", "Tarjeta de Débito", "MercadoPago", "Otro"].map((m) => (
                      <option key={m} value={m} className="bg-[#111117] text-white">{m}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <span className={labelClass}>Cliente</span>
                <ClientCombobox value={clientName} onChange={setClientName} />
              </div>
            </div>
          </section>

          <div className="h-px bg-white/6" />

          {/* Items */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/10">
                <Package className="h-3.5 w-3.5 text-neon" />
              </div>
              <h3 className="text-sm font-semibold text-white">Productos / Servicios</h3>
              <span className="ml-auto text-xs text-white/25">{items.length} {items.length === 1 ? "item" : "items"}</span>
            </div>
            <div className="flex flex-col gap-3">
              {items.map((item, i) => (
                <div key={i} className="rounded-lg border border-white/6 bg-white/2 p-4 flex flex-col gap-3 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-white/15" />
                      <span className="text-xs font-medium text-white/40">Item {i + 1}</span>
                    </div>
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="rounded-md p-1.5 text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-[60px_1fr] gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Cant.</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)}
                        className="h-9 rounded-lg border border-white/8 bg-white/5 px-2 text-sm text-center text-white outline-none focus:border-neon/30"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Descripción</span>
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                        placeholder="Descripción del servicio o producto"
                        className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/15 outline-none focus:border-neon/30 resize-y"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Código</span>
                      <input
                        type="text"
                        value={item.code}
                        onChange={(e) => updateItem(i, "code", e.target.value)}
                        placeholder="—"
                        className="h-9 rounded-lg border border-white/8 bg-white/5 px-2 text-sm text-center font-mono text-white placeholder:text-white/15 outline-none focus:border-neon/30"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Precio Unit.</span>
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="h-9 rounded-lg border border-white/8 bg-white/5 px-2 text-sm text-center text-white outline-none focus:border-neon/30"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">IVA %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.taxPercent}
                        onChange={(e) => updateItem(i, "taxPercent", parseFloat(e.target.value) || 0)}
                        className="h-9 rounded-lg border border-white/8 bg-white/5 px-2 text-sm text-center text-white outline-none focus:border-neon/30"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Dto. %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discountPercent}
                        onChange={(e) => updateItem(i, "discountPercent", parseFloat(e.target.value) || 0)}
                        className="h-9 rounded-lg border border-white/8 bg-white/5 px-2 text-sm text-center text-white outline-none focus:border-neon/30"
                      />
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-3 text-sm text-white/40 transition-colors hover:border-neon/30 hover:text-neon/70 hover:bg-neon/3"
              >
                <Plus className="h-4 w-4" />
                Agregar item
              </button>
            </div>
          </section>

          <div className="h-px bg-white/6" />

          {/* Company info - collapsible, less important */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
                <Building2 className="h-3.5 w-3.5 text-white/40" />
              </div>
              <h3 className="text-sm font-semibold text-white/50">Datos de la Empresa</h3>
              <span className="ml-auto text-[10px] text-white/20 group-open:hidden">Expandir</span>
              <span className="ml-auto text-[10px] text-white/20 hidden group-open:inline">Contraer</span>
            </summary>
            <div className="flex flex-col gap-3 mt-4">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Nombre de la Empresa</span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Dirección</span>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Teléfono</span>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </details>
        </div>
      </div>

      {/* Right panel - Preview */}
      <div className="flex flex-col gap-3 xl:sticky xl:top-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-medium text-white/40">Vista Previa</h2>
          <span className="text-[11px] text-white/20">Actualización en tiempo real</span>
        </div>
        <ReceiptPreview
          id="receipt-preview-editor"
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

"use client";

import Image from "next/image";
import { Calendar, CreditCard, User, Hash } from "lucide-react";
import type { ReceiptItem } from "@/lib/types";

interface ReceiptPreviewProps {
  id?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  clientName: string;
  items: ReceiptItem[];
  subtotal: number;
  discounts: number;
  taxTotal: number;
  totalPaid: number;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export function ReceiptPreview({
  id: elementId,
  companyName,
  companyAddress,
  companyPhone,
  receiptNumber,
  paymentDate,
  paymentMethod,
  clientName,
  items,
  subtotal,
  discounts,
  taxTotal,
  totalPaid,
}: ReceiptPreviewProps) {
  return (
    <div id={elementId} className="rounded-xl border border-white/8 bg-surface overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-neon via-neon/60 to-transparent" />

      <div className="p-5 sm:p-7 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.jpg"
              alt={companyName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-contain shrink-0"
            />
            <div>
              <h2 className="text-lg font-bold text-white">{companyName}</h2>
              {companyAddress && <p className="text-xs text-white/40">{companyAddress}</p>}
              {companyPhone && <p className="text-xs text-white/40">Tel.: {companyPhone}</p>}
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Comprobante de Pago</p>
            <p className="text-lg font-bold font-mono text-neon">{receiptNumber}</p>
          </div>
        </div>

        {/* Info cards - 4 columns on desktop, 2 on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-white/6 bg-white/2 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Hash className="h-3 w-3 text-neon/60" />
              <p className="text-[9px] font-semibold text-neon/60 uppercase tracking-wider">N° Comprobante</p>
            </div>
            <p className="text-sm font-medium font-mono text-white">{receiptNumber}</p>
          </div>
          <div className="rounded-lg border border-white/6 bg-white/2 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3 text-white/30" />
              <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Fecha de Pago</p>
            </div>
            <p className="text-sm font-medium text-white">{paymentDate || "—"}</p>
          </div>
          <div className="rounded-lg border border-white/6 bg-white/2 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard className="h-3 w-3 text-white/30" />
              <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Método de Pago</p>
            </div>
            <p className="text-sm font-medium text-white">{paymentMethod}</p>
          </div>
          <div className="rounded-lg border border-white/6 bg-white/2 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <User className="h-3 w-3 text-white/30" />
              <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Cliente</p>
            </div>
            <p className="text-sm font-medium text-white">{clientName || "—"}</p>
          </div>
        </div>

        {/* Detail table */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-white/6" />
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Detalle del Pago</span>
            <div className="h-px flex-1 bg-white/6" />
          </div>

          {/* Mobile: card layout / Desktop: table */}
          <div className="hidden sm:block">
            <div className="rounded-lg border border-white/6 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/3 text-[11px] uppercase tracking-wider text-white/30">
                    <th className="px-4 py-2.5 text-left font-medium">Cant.</th>
                    <th className="px-4 py-2.5 text-left font-medium">Código</th>
                    <th className="px-4 py-2.5 text-left font-medium">Descripción</th>
                    <th className="px-4 py-2.5 text-right font-medium">Precio Unit.</th>
                    <th className="px-4 py-2.5 text-center font-medium">IVA</th>
                    <th className="px-4 py-2.5 text-center font-medium">Dto.</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-white/20">Sin items</td>
                    </tr>
                  ) : (
                    items.map((item, i) => {
                      const lineTotal = item.quantity * item.unitPrice;
                      const lineDiscount = lineTotal * (item.discountPercent / 100);
                      const lineTax = (lineTotal - lineDiscount) * (item.taxPercent / 100);
                      const itemTotal = lineTotal - lineDiscount + lineTax;
                      return (
                        <tr key={i} className="border-t border-white/4 hover:bg-white/2">
                          <td className="px-4 py-3 text-white/70">{item.quantity}</td>
                          <td className="px-4 py-3">
                            {item.code ? (
                              <span className="rounded-md border border-neon/20 bg-neon/5 px-1.5 py-0.5 text-xs font-mono text-neon/80">{item.code}</span>
                            ) : <span className="text-white/20">—</span>}
                          </td>
                          <td className="px-4 py-3 text-white/60">{item.description || "—"}</td>
                          <td className="px-4 py-3 text-right text-white/70 font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-center text-white/40">{item.taxPercent}%</td>
                          <td className="px-4 py-3 text-center text-white/40">{item.discountPercent}%</td>
                          <td className="px-4 py-3 text-right font-medium font-mono text-white">{formatCurrency(itemTotal)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: card layout */}
          <div className="sm:hidden flex flex-col gap-2">
            {items.length === 0 ? (
              <p className="text-center text-xs text-white/20 py-4">Sin items</p>
            ) : items.map((item, i) => {
              const lineTotal = item.quantity * item.unitPrice;
              const lineDiscount = lineTotal * (item.discountPercent / 100);
              const lineTax = (lineTotal - lineDiscount) * (item.taxPercent / 100);
              const itemTotal = lineTotal - lineDiscount + lineTax;
              return (
                <div key={i} className="rounded-lg border border-white/6 bg-white/2 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-white/40">{item.quantity}x</span>
                        {item.code && (
                          <span className="rounded border border-neon/20 bg-neon/5 px-1.5 py-0.5 text-[10px] font-mono text-neon/80">{item.code}</span>
                        )}
                      </div>
                      <p className="text-sm text-white/70">{item.description || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold font-mono text-white">{formatCurrency(itemTotal)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72">
            <div className="flex justify-between border-b border-white/6 py-2.5 text-sm">
              <span className="text-white/40">Subtotal</span>
              <span className="font-medium font-mono text-white/70">{formatCurrency(subtotal)}</span>
            </div>
            {discounts > 0 && (
              <div className="flex justify-between border-b border-white/6 py-2.5 text-sm">
                <span className="text-white/40">Descuentos</span>
                <span className="font-medium font-mono text-red-400/80">-{formatCurrency(discounts)}</span>
              </div>
            )}
            {taxTotal > 0 && (
              <div className="flex justify-between border-b border-white/6 py-2.5 text-sm">
                <span className="text-white/40">IVA</span>
                <span className="font-medium font-mono text-white/70">{formatCurrency(taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-center rounded-lg bg-neon/10 border border-neon/20 px-4 py-3 mt-2">
              <span className="text-sm font-semibold text-neon">Total Pagado</span>
              <span className="text-base font-bold font-mono text-neon">{formatCurrency(totalPaid)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

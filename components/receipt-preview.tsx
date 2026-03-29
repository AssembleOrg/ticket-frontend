"use client";

import type { ReceiptItem } from "@/lib/types";

interface ReceiptPreviewProps {
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
  return `$ ${new Intl.NumberFormat("es-AR").format(n)}`;
}

export function ReceiptPreview({
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
    <div className="rounded-xl border border-white/10 bg-white text-gray-800 p-8 shadow-lg max-w-[800px] mx-auto">
      {/* Top bar */}
      <div className="h-2 -mt-8 -mx-8 mb-6 rounded-t-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-red-400" />

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-emerald-600 select-none">
            {companyName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{companyName}</h2>
            {companyAddress ? <p className="text-sm text-gray-500">{companyAddress}</p> : null}
            {companyPhone ? <p className="text-sm text-gray-500">Tel.: {companyPhone}</p> : null}
          </div>
        </div>
        <div className="text-right">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white ml-auto mb-1">
            <span className="text-2xl font-bold">$</span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Pago</p>
          <p className="text-sm font-bold text-gray-800">COMPROBANTE DE PAGO</p>
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">N° de Comprobante</p>
          <p className="text-sm font-medium text-gray-800">{receiptNumber}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Fecha de Pago</p>
          <p className="text-sm font-medium text-gray-800">{paymentDate}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Método de Pago</p>
          <p className="text-sm font-medium text-gray-800">{paymentMethod}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Cliente</p>
          <p className="text-sm font-medium text-gray-800">{clientName}</p>
        </div>
      </div>

      {/* Detail table */}
      <div className="mb-8">
        <h3 className="text-center text-base font-semibold text-gray-800 mb-1">Detalle del Pago</h3>
        <div className="h-0.5 w-16 bg-emerald-500 mx-auto mb-4" />

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2 text-left font-medium">Cant.</th>
              <th className="px-3 py-2 text-left font-medium">Código</th>
              <th className="px-3 py-2 text-left font-medium">Descripción</th>
              <th className="px-3 py-2 text-right font-medium">Precio Unit.</th>
              <th className="px-3 py-2 text-center font-medium">IVA</th>
              <th className="px-3 py-2 text-center font-medium">Descuento</th>
              <th className="px-3 py-2 text-right font-medium">Total Pagado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                  Sin items
                </td>
              </tr>
            ) : (
              items.map((item, i) => {
                const lineTotal = item.quantity * item.unitPrice;
                const lineDiscount = lineTotal * (item.discountPercent / 100);
                const lineTax = (lineTotal - lineDiscount) * (item.taxPercent / 100);
                const itemTotal = lineTotal - lineDiscount + lineTax;

                return (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-700">{item.quantity}</td>
                    <td className="px-3 py-2">
                      <span className="rounded border border-emerald-200 px-1.5 py-0.5 text-xs text-emerald-700 bg-emerald-50">
                        {item.code}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 max-w-[180px]">{item.description}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{item.taxPercent} %</td>
                    <td className="px-3 py-2 text-center text-gray-500">{item.discountPercent} %</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-800">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-700">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">Descuentos</span>
            <span className="font-medium text-gray-700">{formatCurrency(discounts)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
            <span className="text-gray-500">IVA Total</span>
            <span className="font-medium text-gray-700">{formatCurrency(taxTotal)}</span>
          </div>
          <div className="flex justify-between rounded-lg border-2 border-emerald-500 px-3 py-2 mt-1">
            <span className="text-sm font-semibold text-emerald-600">Total Pagado</span>
            <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

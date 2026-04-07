"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, FileText, Calendar, Ban, Download } from "lucide-react";
import { toast } from "sonner";
import { exportReceiptToPdf } from "@/lib/export-pdf";
import { exportToCsv } from "@/lib/export-csv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchBar } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ReceiptPreview } from "@/components/receipt-preview";
import { useReceipts } from "@/lib/hooks";
import { receiptsService } from "@/lib/services";
import { RequireRole } from "@/components/require-role";
import { formatDate } from "@/lib/format";
import type { Receipt } from "@/lib/types";

function formatReceiptNumber(n: number): string {
  return `CP-${String(n).padStart(8, "0")}`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

function isWithin24h(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

export default function ComprobantesPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <ComprobantesContent />
    </RequireRole>
  );
}

function ComprobantesContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Receipt | null>(null);
  const [voidTarget, setVoidTarget] = useState<Receipt | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: receipts, pagination, isLoading, mutate } = useReceipts({ page, limit });

  const filtered = receipts?.filter(
    (r) =>
      !search ||
      formatReceiptNumber(r.receiptNumber).toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.companyName.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await receiptsService.delete(deleteTarget.id);
      toast.success("Comprobante eliminado");
      setDeleteTarget(null);
      mutate();
    } catch {
      toast.error("No se puede eliminar: pasaron más de 24hs desde su creación");
    }
  }

  async function handleVoid() {
    if (!voidTarget) return;
    try {
      await receiptsService.void(voidTarget.id);
      toast.success("Comprobante anulado");
      setVoidTarget(null);
      mutate();
    } catch {
      toast.error("Error al anular comprobante");
    }
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Comprobantes"
        subtitle={pagination ? `${pagination.total} comprobantes registrados` : undefined}
        action={
          <div className="flex items-center gap-2">
            {filtered && filtered.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  exportToCsv(
                    "comprobantes",
                    ["Número", "Cliente", "Estado", "Fecha", "Método", "Total"],
                    filtered.map((r) => [
                      formatReceiptNumber(r.receiptNumber), r.clientName, r.status,
                      r.paymentDate, r.paymentMethod, String(r.totalPaid),
                    ]),
                  );
                  toast.success("CSV exportado");
                }}
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            )}
            <Link href="/comprobantes/nuevo">
              <Button>
                <Plus className="h-4 w-4" />
                Nuevo comprobante
              </Button>
            </Link>
          </div>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar comprobante"
        description="¿Estás seguro de que querés eliminar este comprobante? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />

      <div className="flex items-center gap-3">
        <SearchBar placeholder="Buscar por número, cliente o empresa..." value={search} onChange={setSearch} />
      </div>

      {isLoading ? (
        <Card><TableSkeleton rows={6} cols={7} /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3">N° Comprobante</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Estado</th>
                  <th className="hidden px-5 py-3 md:table-cell">Fecha</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Método de Pago</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((r) => {
                  const editable = r.status === "ACTIVE" && isWithin24h(r.createdAt);
                  const isVoided = r.status === "VOIDED";

                  return (
                    <tr
                      key={r.id}
                      className={`border-t border-white/4 transition-colors hover:bg-white/2 ${isVoided ? "opacity-50" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isVoided ? "bg-red-500/10" : "bg-neon/10"}`}>
                            <FileText className={`h-4 w-4 ${isVoided ? "text-red-400" : "text-neon"}`} />
                          </div>
                          <span className={`text-sm font-mono font-medium ${isVoided ? "text-white/40 line-through" : "text-white"}`}>
                            {formatReceiptNumber(r.receiptNumber)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/70">{r.clientName}</td>
                      <td className="hidden px-5 py-4 sm:table-cell">
                        {isVoided ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400">
                            <Ban className="h-3 w-3" />
                            Anulado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neon/10 px-2.5 py-1 text-[11px] font-medium text-neon">
                            Activo
                          </span>
                        )}
                      </td>
                      <td className="hidden px-5 py-4 md:table-cell">
                        <span className="flex items-center gap-1.5 text-sm text-white/50">
                          <Calendar className="h-3 w-3" />
                          {formatDate(r.paymentDate)}
                        </span>
                      </td>
                      <td className="hidden px-5 py-4 text-sm text-white/50 lg:table-cell">
                        {r.paymentMethod}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`flex items-center justify-end gap-1 text-sm font-semibold font-mono ${isVoided ? "text-white/30 line-through" : "text-neon"}`}>
                          {formatCurrency(r.totalPaid)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewReceipt(r)}
                            className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                            title="Ver comprobante"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {editable && (
                            <Link
                              href={`/comprobantes/${r.id}`}
                              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                              title="Editar comprobante"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                          {!isVoided && (
                            <button
                              onClick={() => setVoidTarget(r)}
                              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-yellow-400"
                              title="Anular comprobante"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          {editable && (
                            <button
                              onClick={() => setDeleteTarget(r)}
                              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-red-400"
                              title="Eliminar comprobante"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-white/10" />
                        <p className="text-sm text-white/30">No se encontraron comprobantes</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination
        page={page}
        totalPages={pagination?.totalPages ?? 1}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={handleLimitChange}
        total={pagination?.total}
      />

      {/* Quick view modal */}
      <Modal
        open={viewReceipt !== null}
        onClose={() => setViewReceipt(null)}
        title={viewReceipt ? `Comprobante ${formatReceiptNumber(viewReceipt.receiptNumber)}` : ""}
        className="sm:max-w-5xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setViewReceipt(null)}>
              Cerrar
            </Button>
            <Button
              variant="secondary"
              loading={exporting}
              onClick={async () => {
                if (!viewReceipt) return;
                setExporting(true);
                try {
                  await exportReceiptToPdf(
                    "receipt-preview-modal",
                    `comprobante-${formatReceiptNumber(viewReceipt.receiptNumber)}`,
                    {
                      companyName: viewReceipt.companyName,
                      companyAddress: viewReceipt.companyAddress,
                      companyPhone: viewReceipt.companyPhone,
                      receiptNumber: formatReceiptNumber(viewReceipt.receiptNumber),
                      paymentDate: new Date(viewReceipt.paymentDate + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "numeric", year: "numeric" }),
                      paymentMethod: viewReceipt.paymentMethod,
                      clientName: viewReceipt.clientName,
                      items: viewReceipt.items ?? [],
                      subtotal: viewReceipt.subtotal,
                      discounts: viewReceipt.discounts,
                      taxTotal: viewReceipt.taxTotal,
                      totalPaid: viewReceipt.totalPaid,
                    },
                  );
                  toast.success("PDF descargado");
                } catch {
                  toast.error("Error al generar PDF");
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            {viewReceipt && viewReceipt.status === "ACTIVE" && isWithin24h(viewReceipt.createdAt) && (
              <Link href={`/comprobantes/${viewReceipt.id}`}>
                <Button>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
          </div>
        }
      >
        {viewReceipt && (
          <div className="flex flex-col gap-3">
            {viewReceipt.status === "VOIDED" && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                <Ban className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Comprobante anulado</span>
              </div>
            )}
            <ReceiptPreview
              id="receipt-preview-modal"
              companyName={viewReceipt.companyName}
              companyAddress={viewReceipt.companyAddress}
              companyPhone={viewReceipt.companyPhone}
              receiptNumber={formatReceiptNumber(viewReceipt.receiptNumber)}
              paymentDate={new Date(viewReceipt.paymentDate + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "numeric", year: "numeric" })}
              paymentMethod={viewReceipt.paymentMethod}
              clientName={viewReceipt.clientName}
              items={viewReceipt.items ?? []}
              subtotal={viewReceipt.subtotal}
              discounts={viewReceipt.discounts}
              taxTotal={viewReceipt.taxTotal}
              totalPaid={viewReceipt.totalPaid}
            />
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar comprobante"
        description={
          deleteTarget
            ? `¿Estás seguro de eliminar el comprobante ${formatReceiptNumber(deleteTarget.receiptNumber)} del cliente "${deleteTarget.clientName}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        variant="danger"
      />

      {/* Void confirmation */}
      <ConfirmDialog
        open={voidTarget !== null}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleVoid}
        title="Anular comprobante"
        description={
          voidTarget
            ? `¿Estás seguro de anular el comprobante ${formatReceiptNumber(voidTarget.receiptNumber)} del cliente "${voidTarget.clientName}"? El comprobante quedará marcado como anulado y no se podrá editar.`
            : ""
        }
        confirmLabel="Anular"
        variant="warning"
      />
    </div>
  );
}

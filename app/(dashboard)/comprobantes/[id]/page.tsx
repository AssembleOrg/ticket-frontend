"use client";

import { use, useState } from "react";
import { ArrowLeft, Ban, Lock, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ReceiptEditor } from "@/components/receipt-editor";
import { ReceiptPreview } from "@/components/receipt-preview";
import { Skeleton } from "@/components/ui/skeleton";
import { useReceipt } from "@/lib/hooks";
import { exportReceiptToPdf } from "@/lib/export-pdf";
import { RequireRole } from "@/components/require-role";

function formatReceiptNumber(n: number): string {
  return `CP-${String(n).padStart(8, "0")}`;
}

function isWithin24h(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

export default function EditarComprobantePage({ params }: { params: Promise<{ id: string }> }) {
  return <RequireRole roles={["ADMIN"]}><EditarComprobanteContent params={params} /></RequireRole>;
}

function EditarComprobanteContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { receipt, isLoading } = useReceipt(id);
  const [exporting, setExporting] = useState(false);

  async function handleExportPdf() {
    if (!receipt) return;
    setExporting(true);
    try {
      await exportReceiptToPdf(
        "receipt-preview-detail",
        `comprobante-${formatReceiptNumber(receipt.receiptNumber)}`,
      );
      toast.success("PDF descargado");
    } catch {
      toast.error("Error al generar PDF");
    } finally {
      setExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-white/50">Comprobante no encontrado</p>
        <Link href="/comprobantes" className="text-neon hover:underline text-sm">
          Volver a comprobantes
        </Link>
      </div>
    );
  }

  const receiptNum = formatReceiptNumber(receipt.receiptNumber);
  const isVoided = receipt.status === "VOIDED";
  const isLocked = !isWithin24h(receipt.createdAt);
  const canEdit = !isVoided && !isLocked;

  // Read-only view for voided or locked receipts
  if (!canEdit) {
    const formattedDate = receipt.paymentDate
      ? new Date(receipt.paymentDate + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "numeric", year: "numeric" })
      : "";

    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`Comprobante ${receiptNum}`}
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" loading={exporting} onClick={handleExportPdf}>
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Link
                href="/comprobantes"
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </div>
          }
        />

        {isVoided && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-3">
            <Ban className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Este comprobante fue anulado y no se puede editar.</span>
          </div>
        )}

        {!isVoided && isLocked && (
          <div className="flex items-center gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-5 py-3">
            <Lock className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">
              Este comprobante tiene más de 24 horas y no se puede editar.
            </span>
          </div>
        )}

        <div className="max-w-3xl">
          <ReceiptPreview
            id="receipt-preview-detail"
            companyName={receipt.companyName}
            companyAddress={receipt.companyAddress}
            companyPhone={receipt.companyPhone}
            receiptNumber={receiptNum}
            paymentDate={formattedDate}
            paymentMethod={receipt.paymentMethod}
            clientName={receipt.clientName}
            items={receipt.items ?? []}
            subtotal={receipt.subtotal}
            discounts={receipt.discounts}
            taxTotal={receipt.taxTotal}
            totalPaid={receipt.totalPaid}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Editar Comprobante ${receiptNum}`}
        action={
          <Link
            href="/comprobantes"
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        }
      />
      <ReceiptEditor receipt={receipt} />
    </div>
  );
}

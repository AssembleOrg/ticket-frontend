"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ReceiptEditor } from "@/components/receipt-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useReceipt } from "@/lib/hooks";

export default function EditarComprobantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { receipt, isLoading } = useReceipt(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
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

  const receiptNum = `CP-${String(receipt.receiptNumber).padStart(8, "0")}`;

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

"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ReceiptEditor } from "@/components/receipt-editor";
import { receiptsService } from "@/lib/services";
import { RequireRole } from "@/components/require-role";

export default function NuevoComprobantePage() {
  return <RequireRole roles={["ADMIN"]}><NuevoComprobanteContent /></RequireRole>;
}

function NuevoComprobanteContent() {
  const [nextNumber, setNextNumber] = useState<number | undefined>();

  useEffect(() => {
    receiptsService.getNextNumber().then((res) => {
      setNextNumber(res.data.nextNumber);
    }).catch(() => {
      setNextNumber(500);
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nuevo Comprobante"
        subtitle={nextNumber ? `N° CP-${String(nextNumber).padStart(8, "0")}` : undefined}
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
      {nextNumber !== undefined ? <ReceiptEditor nextNumber={nextNumber} /> : null}
    </div>
  );
}

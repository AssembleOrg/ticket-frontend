"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, FileText, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useReceipts } from "@/lib/hooks";
import { receiptsService } from "@/lib/services";
import { formatDate } from "@/lib/format";

function formatReceiptNumber(n: number): string {
  return `CP-${String(n).padStart(8, "0")}`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export default function ComprobantesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: receipts, pagination, isLoading, mutate } = useReceipts({ page, limit });

  const filtered = receipts?.filter(
    (r) =>
      !search ||
      formatReceiptNumber(r.receiptNumber).toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.companyName.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(id: string) {
    try {
      await receiptsService.delete(id);
      toast.success("Comprobante eliminado");
      mutate();
    } catch {
      toast.error("Error al eliminar comprobante");
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
          <Link href="/comprobantes/nuevo">
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo comprobante
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <SearchBar placeholder="Buscar comprobantes..." value={search} onChange={setSearch} />
      </div>

      {isLoading ? (
        <Card><TableSkeleton rows={6} cols={6} /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3">N° Comprobante</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="hidden px-5 py-3 md:table-cell">Fecha</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Método de Pago</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-white/4 transition-colors hover:bg-white/2"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10">
                          <FileText className="h-4 w-4 text-neon" />
                        </div>
                        <span className="text-sm font-mono font-medium text-white">
                          {formatReceiptNumber(r.receiptNumber)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-white/70">{r.clientName}</td>
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
                      <span className="flex items-center justify-end gap-1 text-sm font-semibold text-neon">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(r.totalPaid)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/comprobantes/${r.id}`}
                          className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/comprobantes/${r.id}`}
                          className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-white/30">
                      No se encontraron comprobantes
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
    </div>
  );
}

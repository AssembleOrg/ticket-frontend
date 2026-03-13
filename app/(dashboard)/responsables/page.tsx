"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResponsibleForm } from "@/components/forms/responsible-form";
import { useResponsibles } from "@/lib/hooks";
import { responsiblesService } from "@/lib/services";
import type { Responsible } from "@/lib/types";

export default function ResponsablesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Responsible | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Responsible | null>(null);

  const { data: responsibles, pagination, isLoading, mutate } = useResponsibles({ page, limit });

  const filtered = responsibles?.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await responsiblesService.delete(deleteTarget.id);
      toast.success("Responsable eliminado");
      mutate();
    } catch {
      toast.error("Error al eliminar responsable");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleEdit(responsible: Responsible) {
    setEditTarget(responsible);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditTarget(undefined);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Responsables"
        subtitle={pagination ? `${pagination.total} responsables registrados` : undefined}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nuevo responsable
          </Button>
        }
      />

      <ResponsibleForm
        open={showForm}
        onClose={handleCloseForm}
        onSuccess={() => mutate()}
        initialData={editTarget}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar responsable"
        description={`¿Eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />

      <SearchBar placeholder="Buscar responsables..." value={search} onChange={setSearch} />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} size="sm" />
                        <span className="text-sm font-medium text-white">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered?.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-sm text-white/30">
                      No se encontraron responsables
                    </td>
                  </tr>
                )}
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
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        total={pagination?.total}
      />
    </div>
  );
}

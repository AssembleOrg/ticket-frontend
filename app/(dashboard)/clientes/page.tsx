"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Mail, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { useClients } from "@/lib/hooks";
import { useMediaQuery } from "@/lib/use-media-query";
import { clientsService } from "@/lib/services";
import { ClientForm } from "@/components/forms/client-form";
import type { Client } from "@/lib/types";

export default function ClientesPage() {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | undefined>();
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    setView(isDesktop ? "list" : "grid");
  }, [isDesktop]);

  const { data: clients, pagination, isLoading, mutate } = useClients({ page, limit });

  const filtered = clients?.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(id: string) {
    try {
      await clientsService.delete(id);
      toast.success("Cliente eliminado");
      mutate();
    } catch {
      toast.error("Error al eliminar cliente");
    }
  }

  function handleEdit(client: Client) {
    setEditTarget(client);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditTarget(undefined);
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        subtitle={pagination ? `${pagination.total} clientes registrados` : undefined}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      <ClientForm
        open={showForm}
        onClose={handleCloseForm}
        onSuccess={() => mutate()}
        initialData={editTarget}
      />

      {/* Search + View toggle */}
      <div className="flex items-center gap-3">
        <SearchBar placeholder="Buscar clientes..." value={search} onChange={setSearch} />
        <ViewToggle view={view} onChange={setView} />
      </div>

      {isLoading ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : (
          <Card><TableSkeleton rows={6} cols={5} /></Card>
        )
      ) : (
        <>
          {/* Grid view */}
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered?.map((c) => (
                <Card key={c.id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                      <p className="truncate text-xs text-white/40">{c.company}</p>
                    </div>
                    <span className="ml-auto inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-neon/15 px-2 text-xs font-semibold text-neon">
                      {c._count?.projects ?? c.projects?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-white/40">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 shrink-0" /> {c.email}
                    </span>
                    {c.phone ? (
                      <span className="flex items-center gap-1.5 truncate">
                        <Phone className="h-3 w-3 shrink-0" /> {c.phone}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1.5 truncate">
                      <Building2 className="h-3 w-3 shrink-0" /> {c.company}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-white/[0.06] pt-3">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="flex-1 rounded-lg border border-white/10 py-1.5 text-center text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Ver detalle
                    </Link>
                    <button
                      onClick={() => handleEdit(c)}
                      className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
              {filtered?.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-white/30">
                  No se encontraron clientes
                </p>
              ) : null}
            </div>
          ) : (
            /* List view */
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                      <th className="px-5 py-3">Nombre</th>
                      <th className="hidden px-5 py-3 md:table-cell">Email</th>
                      <th className="hidden px-5 py-3 lg:table-cell">Teléfono</th>
                      <th className="hidden px-5 py-3 sm:table-cell">Empresa</th>
                      <th className="px-5 py-3 text-center">Proyectos</th>
                      <th className="px-5 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((c) => (
                      <tr
                        key={c.id}
                        className="border-t border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} size="sm" />
                            <span className="text-sm font-medium text-white">{c.name}</span>
                          </div>
                        </td>
                        <td className="hidden px-5 py-4 text-sm text-white/50 md:table-cell">{c.email}</td>
                        <td className="hidden px-5 py-4 text-sm text-white/50 lg:table-cell">{c.phone}</td>
                        <td className="hidden px-5 py-4 text-sm text-white/50 sm:table-cell">{c.company}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-neon/15 px-2 text-xs font-semibold text-neon">
                            {c._count?.projects ?? c.projects?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/clientes/${c.id}`}
                              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleEdit(c)}
                              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
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
                          No se encontraron clientes
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
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

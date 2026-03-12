"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { useProjects } from "@/lib/hooks";
import { useMediaQuery } from "@/lib/use-media-query";
import { ProjectForm } from "@/components/forms/project-form";
import type { Project } from "@/lib/types";

export default function ProyectosPage() {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | undefined>();
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    setView(isDesktop ? "list" : "grid");
  }, [isDesktop]);

  const { data: projects, pagination, isLoading, mutate } = useProjects({ page, limit });

  const filtered = projects?.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  function handleEdit(project: Project) {
    setEditTarget(project);
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
        title="Proyectos"
        subtitle={pagination ? `${pagination.total} proyectos registrados` : undefined}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </Button>
        }
      />

      <ProjectForm
        open={showForm}
        onClose={handleCloseForm}
        onSuccess={() => mutate()}
        initialData={editTarget}
      />

      {/* Search + View toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar placeholder="Buscar proyectos..." value={search} onChange={setSearch} />
        <ViewToggle view={view} onChange={setView} />
      </div>

      {isLoading ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : (
          <Card><TableSkeleton rows={6} cols={4} /></Card>
        )
      ) : (
        <>
          {/* Grid view */}
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered?.map((p) => (
                <Card key={p.id} className="flex flex-col gap-3 p-5">
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    {p.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-white/30">{p.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{p.client?.name ?? "—"}</span>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-medium text-white/60">
                      {p._count?.tickets ?? 0} tickets
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-white/6 pt-3">
                    <span className="flex-1 truncate text-xs text-white/30">{p.client?.name ?? "—"}</span>
                    <button
                      onClick={() => handleEdit(p)}
                      className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
              {filtered?.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-white/30">
                  No se encontraron proyectos
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
                      <th className="px-5 py-3">Proyecto</th>
                      <th className="hidden px-5 py-3 sm:table-cell">Cliente</th>
                      <th className="px-5 py-3 text-center">Tickets</th>
                      <th className="px-5 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-white/4 transition-colors hover:bg-white/2"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-white">{p.name}</p>
                          <p className="text-xs text-white/30">{p.description}</p>
                        </td>
                        <td className="hidden px-5 py-4 text-sm text-white/50 sm:table-cell">
                          {p.client?.name ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 px-2 text-xs font-medium text-white/60">
                            {p._count?.tickets ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(p)}
                              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-white/30">
                          No se encontraron proyectos
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

"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, EyeOff, Copy, Pencil, Trash2, Key, Globe, User, Users, Shield, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useProjects } from "@/lib/hooks";
import { vaultService } from "@/lib/services";
import type { VaultEntry } from "@/lib/types";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiado al portapapeles");
}

export default function VaultPage() {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<VaultEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VaultEntry | null>(null);

  // Form state
  const [formLabel, setFormLabel] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: clients } = useClients({ page: 1, limit: 100 });
  const { data: projects } = useProjects({ page: 1, limit: 100 });

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      const res = await vaultService.list();
      setEntries(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditTarget(null);
    setFormLabel("");
    setFormUsername("");
    setFormPassword("");
    setFormUrl("");
    setFormNotes("");
    setFormClientId("");
    setFormProjectId("");
    setShowForm(true);
  }

  function openEditForm(entry: VaultEntry) {
    setEditTarget(entry);
    setFormLabel(entry.label);
    setFormUsername(entry.username ?? "");
    setFormPassword(entry.password);
    setFormUrl(entry.url ?? "");
    setFormNotes(entry.notes ?? "");
    setFormClientId(entry.clientId ?? "");
    setFormProjectId(entry.projectId ?? "");
    setShowForm(true);
  }

  async function handleSave() {
    if (!formLabel.trim() || !formPassword.trim()) {
      toast.error("Label y contraseña son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: formLabel,
        username: formUsername || undefined,
        password: formPassword,
        url: formUrl || undefined,
        notes: formNotes || undefined,
        clientId: formClientId || undefined,
        projectId: formProjectId || undefined,
      };
      if (editTarget) {
        await vaultService.update(editTarget.id, payload);
        toast.success("Credencial actualizada");
      } else {
        await vaultService.create(payload);
        toast.success("Credencial creada");
      }
      setShowForm(false);
      fetchEntries();
    } catch {
      toast.error("Error al guardar credencial");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await vaultService.delete(deleteTarget.id);
      toast.success("Credencial eliminada");
      setDeleteTarget(null);
      fetchEntries();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  function togglePassword(id: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = entries.filter((e) => {
    if (search && !e.label.toLowerCase().includes(search.toLowerCase()) &&
        !(e.username ?? "").toLowerCase().includes(search.toLowerCase()) &&
        !(e.url ?? "").toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterClient && e.clientId !== filterClient) return false;
    if (filterProject && e.projectId !== filterProject) return false;
    return true;
  });

  const inputClass = "h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none transition-colors focus:border-neon/30";
  const labelClass = "text-[11px] font-medium uppercase tracking-wider text-white/40";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vault"
        subtitle={`${entries.length} credenciales`}
        action={
          isAdmin ? (
            <Button onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              Nueva credencial
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBar placeholder="Buscar credenciales..." value={search} onChange={setSearch} className="min-w-0 flex-1" />
        <div className="flex gap-3">
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="h-10 flex-1 sm:flex-none sm:w-40 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none [color-scheme:dark]"
          >
            <option value="" className="bg-[#111117]">Todos los clientes</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#111117] text-white">{c.name}</option>
            ))}
          </select>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="h-10 flex-1 sm:flex-none sm:w-40 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none [color-scheme:dark]"
          >
          <option value="" className="bg-[#111117]">Todos los proyectos</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#111117] text-white">{p.name}</option>
          ))}
        </select>
        </div>
      </div>

      {/* Entries grouped by client */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12">
          <Shield className="h-10 w-10 text-white/10" />
          <p className="text-sm text-white/30">No se encontraron credenciales</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {(() => {
            // Group by clientId
            const groups = new Map<string, { name: string; entries: typeof filtered }>();
            for (const entry of filtered) {
              const key = entry.clientId ?? "__none__";
              const clientName = entry.clientId
                ? clients?.find((c) => c.id === entry.clientId)?.name ?? "Cliente desconocido"
                : "Sin asignar";
              if (!groups.has(key)) groups.set(key, { name: clientName, entries: [] });
              groups.get(key)!.entries.push(entry);
            }
            // Sort: named clients first, "Sin asignar" last
            const sorted = [...groups.entries()].sort((a, b) => {
              if (a[0] === "__none__") return 1;
              if (b[0] === "__none__") return -1;
              return a[1].name.localeCompare(b[1].name);
            });

            return sorted.map(([key, group]) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-white/20" />
                  <h3 className="text-sm font-semibold text-white/60">{group.name}</h3>
                  <span className="text-xs text-white/20">{group.entries.length}</span>
                  <div className="h-px flex-1 bg-white/6" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.entries.map((entry) => {
                    const projectName = projects?.find((p) => p.id === entry.projectId)?.name;
                    const isVisible = visiblePasswords.has(entry.id);

                    return (
                      <Card key={entry.id} className="flex flex-col gap-3 p-4 group">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10">
                              <Key className="h-4 w-4 text-neon" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{entry.label}</p>
                              {projectName && (
                                <p className="text-[11px] text-white/30">{projectName}</p>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditForm(entry)} className="rounded-md p-1.5 text-white/30 hover:bg-white/10 hover:text-white/70">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(entry)} className="rounded-md p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          )}
                        </div>

                        {entry.username && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-white/20 shrink-0" />
                            <span className="text-xs text-white/50 flex-1 truncate">{entry.username}</span>
                            <button onClick={() => copyToClipboard(entry.username!)} className="text-white/20 hover:text-white/50">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-white/20 shrink-0" />
                          <span className="text-xs text-white/50 flex-1 truncate font-mono">
                            {isVisible ? entry.password : "••••••••••••"}
                          </span>
                          <button onClick={() => togglePassword(entry.id)} className="text-white/20 hover:text-white/50">
                            {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <button onClick={() => copyToClipboard(entry.password)} className="text-white/20 hover:text-white/50">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>

                        {entry.url && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-white/20 shrink-0" />
                            <span className="text-xs text-neon/60 flex-1 truncate">{entry.url}</span>
                            <button onClick={() => copyToClipboard(entry.url!)} className="text-white/20 hover:text-white/50">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Editar credencial" : "Nueva credencial"}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button loading={saving} onClick={handleSave}>
              {editTarget ? "Guardar cambios" : "Crear credencial"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Label *</span>
            <input type="text" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Servidor producción" className={inputClass} />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Usuario</span>
              <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="admin" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Contraseña *</span>
              <input type="text" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className={`${inputClass} font-mono`} />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>URL</span>
            <input type="text" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." className={inputClass} />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Cliente</span>
              <select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} className={`${inputClass} [color-scheme:dark]`}>
                <option value="" className="bg-[#111117]">Sin cliente</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#111117] text-white">{c.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Proyecto</span>
              <select value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} className={`${inputClass} [color-scheme:dark]`}>
                <option value="" className="bg-[#111117]">Sin proyecto</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#111117] text-white">{p.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Notas</span>
            <textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notas adicionales..." className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-neon/30 resize-y" />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar credencial"
        description={deleteTarget ? `¿Eliminar "${deleteTarget.label}"? Esta acción no se puede deshacer.` : ""}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}

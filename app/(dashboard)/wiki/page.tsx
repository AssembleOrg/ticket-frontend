"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, FileText, Tag, X, Save, Trash2, Search, ChevronLeft, List, Share2, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { WikiGraph } from "@/components/wiki-graph";
import { wikiService } from "@/lib/services";
import { formatRelativeTime } from "@/lib/format";
import type { WikiNode, WikiPage } from "@/lib/types";

type WikiViewMode = "list" | "graph";

const TAG_STYLES = [
  { bg: "bg-neon/15", text: "text-neon", dot: "bg-neon" },
  { bg: "bg-blue-500/15", text: "text-blue-400", dot: "bg-blue-400" },
  { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  { bg: "bg-pink-500/15", text: "text-pink-400", dot: "bg-pink-400" },
  { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  { bg: "bg-rose-500/15", text: "text-rose-400", dot: "bg-rose-400" },
];

function getTagStyle(tag: string, allTags: string[]) {
  const idx = allTags.indexOf(tag);
  if (idx === -1) return TAG_STYLES[Math.abs(tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_STYLES.length];
  return TAG_STYLES[idx % TAG_STYLES.length];
}

export default function WikiNodesPage() {
  const [viewMode, setViewMode] = useState<WikiViewMode>("list");
  const [nodes, setNodes] = useState<WikiNode[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("wiki-bookmarks");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Selected node state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WikiNode | null>(null);
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null);

  // Load all nodes (metadata only)
  const fetchNodes = useCallback(async () => {
    setLoadingNodes(true);
    try {
      const res = await wikiService.nodes();
      setNodes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNodes([]);
    } finally {
      setLoadingNodes(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  // Normalize tags (handle simple-array legacy format)
  const normalizedNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      tags: Array.isArray(n.tags) ? n.tags.filter(Boolean) : typeof n.tags === "string" ? (n.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    }));
  }, [nodes]);

  // All unique tags
  const allTags = useMemo(
    () => Array.from(new Set(normalizedNodes.flatMap((n) => n.tags))).sort(),
    [normalizedNodes],
  );

  // Filtered nodes
  const filtered = useMemo(() => {
    return normalizedNodes.filter((n) => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterTag && !n.tags.includes(filterTag)) return false;
      return true;
    });
  }, [normalizedNodes, search, filterTag]);

  // Load content when selecting a node
  async function handleSelectNode(id: string) {
    if (dirty) {
      setPendingNodeId(id);
      return;
    }
    await loadNode(id);
  }

  async function loadNode(id: string) {
    setSelectedId(id);
    setLoadingContent(true);
    setDirty(false);
    setPendingNodeId(null);
    try {
      const res = await wikiService.get(id);
      const page = res.data;
      setTitle(page.title);
      setContent(page.content);
      setTags(Array.isArray(page.tags) ? page.tags.filter(Boolean) : []);
    } catch {
      toast.error("Error al cargar página");
      setSelectedId(null);
    } finally {
      setLoadingContent(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await wikiService.create({ title: "Nueva página", content: "" });
      const newNode: WikiNode = {
        id: res.data.id,
        title: res.data.title,
        tags: res.data.tags,
        createdBy: res.data.createdBy,
        updatedBy: res.data.updatedBy,
        createdAt: res.data.createdAt,
        updatedAt: res.data.updatedAt,
      };
      setNodes((prev) => [newNode, ...prev]);
      toast.success("Página creada");
      handleSelectNode(res.data.id);
    } catch {
      toast.error("Error al crear página");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!selectedId || !title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      await wikiService.update(selectedId, { title, content, tags });
      setDirty(false);
      // Update node in list
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedId ? { ...n, title, tags, updatedAt: new Date().toISOString() } : n,
        ),
      );
      toast.success("Guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await wikiService.delete(deleteTarget.id);
      setNodes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
      }
      setDeleteTarget(null);
      toast.success("Página eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("wiki-bookmarks", JSON.stringify([...next]));
      return next;
    });
  }

  function addTag() {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setDirty(true);
    }
    setNewTag("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
    setDirty(true);
  }

  // Ctrl+S
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (selectedId) handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Wiki"
          subtitle={`${nodes.length} páginas`}
          action={
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-white/8 bg-surface p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                  }`}
                  title="Vista lista"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("graph")}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    viewMode === "graph" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                  }`}
                  title="Vista nodos"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              <Button loading={creating} onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                Nueva página
              </Button>
            </div>
          }
        />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar página"
        description={deleteTarget ? `¿Eliminar "${deleteTarget.title}"?` : ""}
        confirmLabel="Eliminar"
        variant="danger"
      />

      <ConfirmDialog
        open={pendingNodeId !== null}
        onClose={() => setPendingNodeId(null)}
        onConfirm={async () => {
          if (pendingNodeId) await loadNode(pendingNodeId);
        }}
        title="Cambios sin guardar"
        description="Tenés cambios sin guardar. ¿Querés descartarlos?"
        confirmLabel="Descartar"
        cancelLabel="Cancelar"
        variant="warning"
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left panel - List or Graph */}
        {viewMode === "graph" ? (
          <div className={`flex-1 min-h-0 ${selectedId ? "hidden md:flex" : "flex"}`}>
            <WikiGraph nodes={filtered} selectedId={selectedId} onSelectNode={handleSelectNode} />
          </div>
        ) : (
        <div className={`flex flex-col border border-white/6 rounded-xl bg-surface overflow-hidden ${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80 md:shrink-0`}>
          {/* Search + filter */}
          <div className="flex flex-col gap-2 p-3 border-b border-white/6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
              <input
                type="text"
                placeholder="Buscar páginas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-white/8 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-neon/30"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setFilterTag("")}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    !filterTag ? "bg-neon/15 text-neon" : "bg-white/5 text-white/30 hover:text-white/50"
                  }`}
                >
                  Todas
                </button>
                {allTags.map((tag) => {
                  const style = getTagStyle(tag, allTags);
                  const isActive = filterTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(isActive ? "" : tag)}
                      className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        isActive ? `${style.bg} ${style.text}` : "bg-white/5 text-white/30 hover:text-white/50"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? style.dot : "bg-white/20"}`} />
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Node list */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loadingNodes ? (
              <div className="flex flex-col gap-1 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-white/20">
                <FileText className="h-8 w-8" />
                <p className="text-xs">Sin páginas</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-1.5">
                {filtered.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNode(node.id)}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors w-full ${
                      selectedId === node.id
                        ? "bg-neon/10 border border-neon/20"
                        : "hover:bg-white/3 border border-transparent"
                    }`}
                  >
                    {bookmarks.has(node.id) ? (
                      <Bookmark className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" fill="currentColor" />
                    ) : (
                      <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${selectedId === node.id ? "text-neon" : "text-white/15"}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${selectedId === node.id ? "text-neon" : "text-white/70"}`}>
                        {node.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {node.tags.length > 0 && (
                          <div className="flex gap-1 overflow-hidden">
                            {node.tags.slice(0, 2).map((t) => {
                              const s = getTagStyle(t, allTags);
                              return (
                                <span key={t} className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] ${s.bg} ${s.text}`}>
                                  <span className={`h-1 w-1 rounded-full ${s.dot}`} />
                                  {t}
                                </span>
                              );
                            })}
                            {node.tags.length > 2 && (
                              <span className="text-[9px] text-white/20">+{node.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                        <span className="text-[9px] text-white/15 ml-auto shrink-0">{formatRelativeTime(node.updatedAt)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right panel - Editor */}
        <div className={`flex flex-col border border-white/6 rounded-xl bg-surface overflow-hidden min-w-0 ${
          viewMode === "graph" ? "w-full md:w-[420px] md:shrink-0" : "flex-1"
        } ${selectedId ? "flex" : "hidden md:flex"}`}>
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/15">
              <FileText className="h-12 w-12" />
              <p className="text-sm">Seleccioná una página para ver su contenido</p>
            </div>
          ) : loadingContent ? (
            <div className="flex flex-col gap-4 p-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              {/* Editor toolbar */}
              <div className="flex items-center gap-2 border-b border-white/6 px-4 py-2.5 shrink-0">
                <button
                  onClick={() => { setSelectedId(null); setDirty(false); }}
                  className="md:hidden flex items-center gap-1 text-xs text-white/40 hover:text-white/70 mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Volver
                </button>
                <div className="flex-1" />
                {dirty && <span className="text-[10px] text-yellow-400/60">Sin guardar</span>}
                {selectedId && (
                  <button
                    onClick={() => toggleBookmark(selectedId)}
                    className={`rounded-md p-1.5 transition-colors ${bookmarks.has(selectedId) ? "text-amber-400" : "text-white/20 hover:text-white/50"}`}
                    title={bookmarks.has(selectedId) ? "Quitar favorito" : "Agregar a favoritos"}
                  >
                    <Bookmark className="h-4 w-4" fill={bookmarks.has(selectedId) ? "currentColor" : "none"} />
                  </button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDeleteTarget(nodes.find((n) => n.id === selectedId) ?? null)}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" loading={saving} onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" />
                  Guardar
                </Button>
              </div>

              {/* Editor content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-4 p-5 max-w-3xl">
                  {/* Title */}
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                    placeholder="Título de la página"
                    className="text-2xl sm:text-3xl font-bold text-white bg-transparent outline-none placeholder:text-white/15 border-none"
                  />

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag className="h-3 w-3 text-white/15 shrink-0" />
                    {tags.map((tag) => {
                      const s = getTagStyle(tag, allTags);
                      return (
                        <span key={tag} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.bg} ${s.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      );
                    })}
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addTag(); }
                      }}
                      placeholder="Agregar tag + Enter"
                      className="h-6 w-28 bg-transparent text-[11px] text-white/30 placeholder:text-white/15 outline-none"
                    />
                  </div>

                  <div className="h-px bg-white/6" />

                  {/* Content */}
                  <textarea
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setDirty(true); }}
                    placeholder="Escribí el contenido de la página..."
                    className="w-full min-h-[300px] sm:min-h-[400px] bg-transparent text-sm leading-relaxed text-white/70 placeholder:text-white/15 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-white/4 px-4 py-2 text-[10px] text-white/15 shrink-0">
                Ctrl+S para guardar
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

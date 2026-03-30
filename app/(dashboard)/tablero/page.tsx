"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useResponsibles } from "@/lib/hooks";
import { boardCardsService } from "@/lib/services";
import type { BoardCard, BoardColumn } from "@/lib/types";

const columns: { key: BoardColumn; label: string; color: string }[] = [
  { key: "TODO", label: "Por hacer", color: "bg-white/10" },
  { key: "IN_PROGRESS", label: "En progreso", color: "bg-blue-500/15" },
  { key: "DONE", label: "Hecho", color: "bg-neon/15" },
];

const cardColors = [
  { value: "default", label: "Sin color", class: "border-white/8" },
  { value: "red", label: "Rojo", class: "border-red-500/40 bg-red-500/5" },
  { value: "yellow", label: "Amarillo", class: "border-yellow-500/40 bg-yellow-500/5" },
  { value: "blue", label: "Azul", class: "border-blue-500/40 bg-blue-500/5" },
  { value: "green", label: "Verde", class: "border-neon/40 bg-neon/5" },
  { value: "purple", label: "Violeta", class: "border-purple-500/40 bg-purple-500/5" },
];

function getCardColorClass(color: string | null): string {
  return cardColors.find((c) => c.value === color)?.class ?? "border-white/8";
}

export default function TableroPage() {
  const { user, isAdmin } = useAuth();
  const { data: responsibles, isLoading: loadingResp } = useResponsibles({ page: 1, limit: 100 });
  const [selectedResponsible, setSelectedResponsible] = useState<string>("");
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState<Record<string, string>>({});
  const [editingCard, setEditingCard] = useState<BoardCard | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [dragCard, setDragCard] = useState<string | null>(null);

  // Auto-select: responsable sees own board, admin sees first
  useEffect(() => {
    if (!responsibles || responsibles.length === 0 || selectedResponsible) return;
    if (!isAdmin && user?.email) {
      const own = responsibles.find((r) => r.email === user.email);
      if (own) { setSelectedResponsible(own.id); return; }
    }
    setSelectedResponsible(responsibles[0].id);
  }, [responsibles, selectedResponsible, isAdmin, user]);

  // Load cards when responsible changes
  useEffect(() => {
    if (!selectedResponsible) return;
    setLoadingCards(true);
    boardCardsService.getByResponsible(selectedResponsible)
      .then((res) => {
        setCards(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setCards([]))
      .finally(() => setLoadingCards(false));
  }, [selectedResponsible]);

  async function handleAddCard(column: BoardColumn) {
    const title = newCardTitle[column]?.trim();
    if (!title || !selectedResponsible || addingToColumn) return;
    setAddingToColumn(column);
    try {
      const res = await boardCardsService.create({
        title,
        column,
        responsibleId: selectedResponsible,
      });
      setCards((prev) => [...prev, res.data]);
      setNewCardTitle((prev) => ({ ...prev, [column]: "" }));
      toast.success("Tarjeta creada");
    } catch {
      toast.error("Error al crear tarjeta");
    } finally {
      setAddingToColumn(null);
    }
  }

  async function handleDeleteCard(id: string) {
    try {
      await boardCardsService.delete(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      if (editingCard?.id === id) setEditingCard(null);
    } catch {
      toast.error("Error al eliminar tarjeta");
    }
  }

  async function handleMoveCard(cardId: string, newColumn: BoardColumn) {
    try {
      await boardCardsService.update(cardId, { column: newColumn });
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, column: newColumn } : c)),
      );
    } catch {
      toast.error("Error al mover tarjeta");
    }
  }

  async function handleUpdateCard(id: string, data: Partial<BoardCard>) {
    try {
      await boardCardsService.update(id, data);
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
      );
      if (editingCard?.id === id) {
        setEditingCard((prev) => prev ? { ...prev, ...data } : null);
      }
    } catch {
      toast.error("Error al actualizar tarjeta");
    }
  }

  function handleDragStart(cardId: string) {
    setDragCard(cardId);
  }

  function handleDrop(column: BoardColumn) {
    if (dragCard) {
      handleMoveCard(dragCard, column);
      setDragCard(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tablero"
        subtitle={isAdmin ? "Tablero de tareas por responsable" : "Mi tablero"}
        action={
          isAdmin ? (
            loadingResp ? (
              <Skeleton className="h-10 w-40" />
            ) : (
              <select
                value={selectedResponsible}
                onChange={(e) => setSelectedResponsible(e.target.value)}
                className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none [color-scheme:dark]"
              >
                {responsibles?.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#111117] text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            )
          ) : undefined
        }
      />

      {loadingCards ? (
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 min-w-[280px] md:min-w-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {columns.map((col) => {
            const colCards = cards.filter((c) => c.column === col.key);

            return (
              <div
                key={col.key}
                className="flex flex-col rounded-xl border border-white/6 bg-surface overflow-hidden min-w-[280px] md:min-w-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.key)}
              >
                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-3 ${col.color}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-medium text-white/40">
                      {colCards.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-3 min-h-[200px]">
                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => handleDragStart(card.id)}
                      onClick={() => setEditingCard(card)}
                      className={`group rounded-lg border p-3 cursor-pointer transition-all hover:border-white/15 ${getCardColorClass(card.color)}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 shrink-0 text-white/10 mt-0.5 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{card.title}</p>
                          {card.description && (
                            <p className="text-xs text-white/30 mt-1 line-clamp-2">{card.description}</p>
                          )}
                          {card.dueDate && (
                            <div className="flex items-center gap-1 mt-2 text-[11px] text-white/30">
                              <Calendar className="h-3 w-3" />
                              {new Date(card.dueDate + "T12:00:00").toLocaleDateString("es-AR")}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id);
                          }}
                          className="shrink-0 rounded-md p-1 text-white/10 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Quick add */}
                  <div className="mt-auto pt-1">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Nueva tarjeta..."
                        value={newCardTitle[col.key] ?? ""}
                        onChange={(e) =>
                          setNewCardTitle((prev) => ({ ...prev, [col.key]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddCard(col.key);
                        }}
                        className="flex-1 h-8 rounded-md border border-dashed border-white/8 bg-transparent px-2.5 text-sm text-white placeholder:text-white/15 outline-none focus:border-neon/30"
                      />
                      <button
                        onClick={() => handleAddCard(col.key)}
                        disabled={addingToColumn === col.key}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/20 hover:bg-neon/10 hover:text-neon transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card detail modal */}
      {editingCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingCard(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-xl border border-white/8 bg-[#111117] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">Editar tarjeta</h2>
              <button onClick={() => setEditingCard(null)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Título</span>
                <input
                  type="text"
                  value={editingCard.title}
                  onChange={(e) =>
                    setEditingCard((prev) => prev ? { ...prev, title: e.target.value } : null)
                  }
                  onBlur={() => handleUpdateCard(editingCard.id, { title: editingCard.title })}
                  className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-neon/30"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Descripción</span>
                <textarea
                  rows={3}
                  value={editingCard.description ?? ""}
                  onChange={(e) =>
                    setEditingCard((prev) => prev ? { ...prev, description: e.target.value } : null)
                  }
                  onBlur={() => handleUpdateCard(editingCard.id, { description: editingCard.description })}
                  className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-neon/30 resize-y"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Fecha límite</span>
                  <input
                    type="date"
                    value={editingCard.dueDate ?? ""}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      setEditingCard((prev) => prev ? { ...prev, dueDate: val } : null);
                      handleUpdateCard(editingCard.id, { dueDate: val } as any);
                    }}
                    className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none focus:border-neon/30 [color-scheme:dark]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Columna</span>
                  <select
                    value={editingCard.column}
                    onChange={(e) => {
                      const col = e.target.value as BoardColumn;
                      setEditingCard((prev) => prev ? { ...prev, column: col } : null);
                      handleMoveCard(editingCard.id, col);
                    }}
                    className="h-10 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none [color-scheme:dark]"
                  >
                    {columns.map((c) => (
                      <option key={c.key} value={c.key} className="bg-[#111117] text-white">{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Color</span>
                <div className="flex gap-2">
                  {cardColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        setEditingCard((prev) => prev ? { ...prev, color: c.value } : null);
                        handleUpdateCard(editingCard.id, { color: c.value });
                      }}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        editingCard.color === c.value ? "scale-110 ring-2 ring-white/30" : ""
                      } ${c.value === "default" ? "border-white/20 bg-white/5" : ""} ${c.value === "red" ? "border-red-500 bg-red-500/30" : ""} ${c.value === "yellow" ? "border-yellow-500 bg-yellow-500/30" : ""} ${c.value === "blue" ? "border-blue-500 bg-blue-500/30" : ""} ${c.value === "green" ? "border-neon bg-neon/30" : ""} ${c.value === "purple" ? "border-purple-500 bg-purple-500/30" : ""}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

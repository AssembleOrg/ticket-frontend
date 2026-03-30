"use client";

import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeMouseHandler,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { WikiNode } from "@/lib/types";

interface WikiGraphProps {
  nodes: WikiNode[];
  selectedId: string | null;
  onSelectNode: (id: string) => void;
}

const TAG_COLORS = [
  "#b4f636", "#60a5fa", "#f97316", "#a78bfa",
  "#f472b6", "#34d399", "#fbbf24", "#fb7185",
];

function getTagColor(tag: string, allTags: string[]): string {
  const idx = allTags.indexOf(tag);
  if (idx === -1) return TAG_COLORS[Math.abs(tag.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_COLORS.length];
  return TAG_COLORS[idx % TAG_COLORS.length];
}

function normalizeTags(tags: string[] | string | null | undefined): string[] {
  if (!tags) return [];
  if (typeof tags === "string") return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return tags.filter(Boolean);
}

// Custom node component
const handleStyle = { background: "transparent", border: "none", width: 8, height: 8 };

function WikiNodeComponent({ data }: { data: { label: string; tags: string[]; color: string; isSelected: boolean } }) {
  return (
    <div
      className={`relative rounded-xl min-w-[160px] max-w-[240px] cursor-pointer transition-all overflow-hidden ${
        data.isSelected
          ? "shadow-lg shadow-neon/20 ring-2 ring-neon/50"
          : "hover:shadow-md hover:shadow-white/5"
      }`}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />

      <div className="h-1 w-full" style={{ backgroundColor: data.color }} />
      <div className={`px-4 py-3 ${data.isSelected ? "bg-[#151520]" : "bg-[#13131a] hover:bg-[#181822]"}`}>
        <p className={`text-[13px] font-semibold leading-tight ${data.isSelected ? "text-neon" : "text-white/80"}`}>
          {data.label}
        </p>
        {data.tags.length > 0 && (
          <div className="flex gap-1.5 mt-2 overflow-hidden">
            {data.tags.slice(0, 3).map((t: string) => (
              <span
                key={t}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{ backgroundColor: `${data.color}15`, color: data.color }}
              >
                <span className="h-1 w-1 rounded-full" style={{ backgroundColor: data.color }} />
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { wikiNode: WikiNodeComponent };

export function WikiGraph({ nodes: rawNodes, selectedId, onSelectNode }: WikiGraphProps) {
  const wikiNodes = useMemo(
    () => rawNodes.map((n) => ({ ...n, tags: normalizeTags(n.tags) })),
    [rawNodes],
  );

  const allTags = useMemo(
    () => Array.from(new Set(wikiNodes.flatMap((n) => n.tags))).sort(),
    [wikiNodes],
  );

  // Build nodes
  const graphNodes = useMemo<Node[]>(() => {
    const count = wikiNodes.length;
    const cols = Math.max(3, Math.ceil(Math.sqrt(count)));
    const spacingX = 320;
    const spacingY = 140;

    return wikiNodes.map((wn, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jitterX = Math.sin(i * 7.3) * 40;
      const jitterY = Math.cos(i * 5.1) * 30;
      const mainTag = wn.tags[0];
      const color = mainTag ? getTagColor(mainTag, allTags) : "#ffffff20";

      return {
        id: wn.id,
        position: { x: col * spacingX + jitterX, y: row * spacingY + jitterY },
        data: { label: wn.title, tags: wn.tags, color, isSelected: wn.id === selectedId },
        type: "wikiNode" as const,
      };
    });
  }, [wikiNodes, allTags, selectedId]);

  // Build edges
  const graphEdges = useMemo<Edge[]>(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < wikiNodes.length; i++) {
      for (let j = i + 1; j < wikiNodes.length; j++) {
        const tagsA = wikiNodes[i].tags;
        const tagsB = wikiNodes[j].tags;
        const shared = tagsA.filter((t) => tagsB.includes(t));
        if (shared.length > 0) {
          const color = getTagColor(shared[0], allTags);
          edges.push({
            id: `e-${wikiNodes[i].id}-${wikiNodes[j].id}`,
            source: wikiNodes[i].id,
            target: wikiNodes[j].id,
            style: { stroke: color, strokeWidth: 3, opacity: 0.7 },
            type: "smoothstep",
            animated: true,
          });
        }
      }
    }
    return edges;
  }, [wikiNodes, allTags]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(graphNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(graphEdges);

  // Sync when data changes
  useEffect(() => {
    setFlowNodes(graphNodes);
  }, [graphNodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(graphEdges);
  }, [graphEdges, setFlowEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => onSelectNode(node.id),
    [onSelectNode],
  );

  return (
    <div className="flex-1 rounded-xl border border-white/6 overflow-hidden bg-[#0a0a0f]">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ffffff08" gap={32} />
        <Controls
          showInteractive={false}
          className="!bg-surface !border-white/8 !rounded-lg !shadow-xl [&>button]:!bg-white/5 [&>button]:!border-white/8 [&>button]:!text-white/40 [&>button:hover]:!bg-white/10 [&>button:hover]:!text-white/70"
        />
      </ReactFlow>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Network,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Info,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type GraphNode = {
  id: string;
  label: string;
  type: "Idea" | "Post" | "Channel" | "PlatformType" | "Tag";
  color?: string;
  status?: string;
  content?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};

type GraphLink = {
  source: string;
  target: string;
  label: string;
};

export default function GraphPage() {
  const { data, refetch } = useQuery<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>({
    queryKey: ["graph-data"],
    queryFn: async () => {
      const res = await fetch("/api/graph");
      if (!res.ok) throw new Error("Failed to fetch graph data");
      return res.json();
    },
  });

  const { data: insights } = useQuery<any>({
    queryKey: ["graph-insights"],
    queryFn: async () => {
      const res = await fetch("/api/graph/insights");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const containerRef = useRef<SVGSVGElement | null>(null);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Initialize node positions well-separated so it never looks clustered
  useEffect(() => {
    if (!data) return;

    const initialNodes = data.nodes.map((node, i) => {
      const angle = (i / Math.max(1, data.nodes.length)) * 2 * Math.PI;
      const radius = 220; // Wide spacing
      return {
        ...node,
        x: 450 + Math.cos(angle) * radius,
        y: 320 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(initialNodes);
    setLinks(data.links);
    if (initialNodes.length > 0 && !selectedNode) {
      setSelectedNode(initialNodes[0]);
    }
  }, [data]);

  // Smooth layout engine that spreads nodes out cleanly
  useEffect(() => {
    if (nodes.length === 0) return;

    let animationFrameId: number;
    const width = 900;
    const height = 640;

    const updatePhysics = () => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => ({ ...n }));
        const nodeMap = new Map(nextNodes.map((n) => [n.id, n]));

        // 1. Strong Repulsion so nodes never cluster or overlap
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n1 = nextNodes[i];
            const n2 = nextNodes[j];

            const dx = n2.x! - n1.x!;
            const dy = n2.y! - n1.y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 300) {
              const force = (300 - dist) * 0.08;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (n1.id !== draggedNodeId) {
                n1.vx! -= fx;
                n1.vy! -= fy;
              }
              if (n2.id !== draggedNodeId) {
                n2.vx! += fx;
                n2.vy! += fy;
              }
            }
          }
        }

        // 2. Comfortable link length (220px separation)
        links.forEach((link) => {
          const sNode = nodeMap.get(link.source);
          const tNode = nodeMap.get(link.target);

          if (sNode && tNode) {
            const dx = tNode.x! - sNode.x!;
            const dy = tNode.y! - sNode.y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = 220;
            const force = (dist - targetDist) * 0.03;

            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (sNode.id !== draggedNodeId) {
              sNode.vx! += fx;
              sNode.vy! += fy;
            }
            if (tNode.id !== draggedNodeId) {
              tNode.vx! -= fx;
              tNode.vy! -= fy;
            }
          }
        });

        // 3. Gentle centering & canvas boundaries
        nextNodes.forEach((n) => {
          if (n.id === draggedNodeId) return;

          const cx = width / 2;
          const cy = height / 2;
          n.vx! += (cx - n.x!) * 0.006;
          n.vy! += (cy - n.y!) * 0.006;

          n.x! += n.vx!;
          n.y! += n.vy!;
          n.vx! *= 0.8;
          n.vy! *= 0.8;

          n.x = Math.max(80, Math.min(width - 80, n.x!));
          n.y = Math.max(80, Math.min(height - 80, n.y!));
        });

        return nextNodes;
      });

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [links, draggedNodeId, nodes.length]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const nodeId = target.getAttribute("data-node-id");

    if (nodeId) {
      setIsDragging(true);
      setDraggedNodeId(nodeId);
      setSelectedNode(nodes.find((n) => n.id === nodeId) || null);
    } else {
      setIsDragging(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    if (draggedNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;

        setNodes((prev) =>
          prev.map((n) =>
            n.id === draggedNodeId
              ? {
                  ...n,
                  x: Math.max(60, Math.min(840, mouseX)),
                  y: Math.max(60, Math.min(580, mouseY)),
                  vx: 0,
                  vy: 0,
                }
              : n,
          ),
        );
      }
    } else {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  const handleZoom = (factor: number) => {
    setZoom((z) => Math.max(0.4, Math.min(2.5, z * factor)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedTagFilter(null);
    refetch();
  };

  // Clean, formatted link labels
  const formatLinkLabel = (label: string) => {
    switch (label) {
      case "BELONGS_TO":
        return "Created From Idea";
      case "PUBLISHED_TO":
        return "Published To Channel";
      case "HAS_TAG":
        return "Topic Cluster";
      default:
        return label.replace(/_/g, " ");
    }
  };

  // Solid, vibrant colors (NO fading opacity!)
  const getNodeTheme = (node: GraphNode) => {
    switch (node.type) {
      case "Idea":
        return {
          bg: "#f59e0b", // Solid Amber
          border: "#b45309",
          label: "Core Idea",
          icon: "💡",
        };
      case "Post":
        const isPub = node.status === "published";
        return {
          bg: isPub ? "#10b981" : "#3b82f6", // Solid Green or Blue
          border: isPub ? "#047857" : "#1d4ed8",
          label: isPub ? "Published Post" : "Scheduled Post",
          icon: "📝",
        };
      case "PlatformType":
      case "Channel":
        return {
          bg: "#8b5cf6", // Solid Purple
          border: "#6d28d9",
          label: "Publishing Channel",
          icon: "🌐",
        };
      case "Tag":
        return {
          bg: "#ec4899", // Solid Pink
          border: "#be185d",
          label: "Topic Cluster",
          icon: "🏷️",
        };
      default:
        return {
          bg: "#64748b",
          border: "#334155",
          label: "Node",
          icon: "\u{1F4CC}",
        };
    }
  };

  const getNodeRadius = (node: GraphNode) => {
    switch (node.type) {
      case "Idea":
        return 34;
      case "Post":
        return 32;
      case "Channel":
      case "PlatformType":
        return 30;
      case "Tag":
        return 28;
      default:
        return 32;
    }
  };

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-80px)] p-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card px-6 py-4 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Neo4j AuraDB Content Relationship Graph
            <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 text-xs font-bold px-2.5 py-0.5">
              Topic Clusters Live
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Interactive multi-hop visualization mapping ideas, posts, channels,
            and hashtag clusters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(1.15)}
            className="h-9 px-3 gap-1.5 cursor-pointer font-medium"
          >
            <ZoomIn className="size-4" /> Zoom In
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(0.85)}
            className="h-9 px-3 gap-1.5 cursor-pointer font-medium"
          >
            <ZoomOut className="size-4" /> Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 px-3 gap-1.5 cursor-pointer font-medium"
          >
            <RefreshCw className="size-4" /> Reset View
          </Button>
        </div>
      </div>

      {/* Canvas & Sidebar */}
      <div className="flex flex-1 gap-5 overflow-hidden min-h-0">
        {/* SVG Canvas */}
        <div className="flex-1 bg-card/40 dark:bg-zinc-950 rounded-2xl border border-border shadow-inner relative overflow-hidden flex items-center justify-center">
          {/* Legend */}
          <div className="absolute top-4 left-4 z-10 bg-background/70 backdrop-blur-xl p-4 rounded-xl border border-border/50 shadow-lg flex flex-col gap-2 max-w-xs pointer-events-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
              <Layers className="size-3.5 text-primary" /> Color Key
            </span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="size-3.5 rounded-full bg-[#f59e0b] shrink-0 shadow-xs" />
                <span className="font-semibold text-foreground">Core Idea</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="size-3.5 rounded-full bg-[#3b82f6] shrink-0 shadow-xs" />
                <span className="font-semibold text-foreground">
                  Scheduled Post
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="size-3.5 rounded-full bg-[#10b981] shrink-0 shadow-xs" />
                <span className="font-semibold text-foreground">
                  Published Post
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="size-3.5 rounded-full bg-[#8b5cf6] shrink-0 shadow-xs" />
                <span className="font-semibold text-foreground">
                  Platform / Channel
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="size-3.5 rounded-full bg-[#ec4899] shrink-0 shadow-xs" />
                <span className="font-semibold text-foreground">
                  Topic Cluster (#Tag)
                </span>
              </div>
            </div>
          </div>

          <svg
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            viewBox="0 0 900 640"
          >
            {/* Clean subtle dot background */}
            <defs>
              <pattern
                id="dotGrid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="2"
                  cy="2"
                  r="1.2"
                  fill="currentColor"
                  className="text-muted-foreground/20"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotGrid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Connecting Links */}
              {links.map((link, idx) => {
                const s = nodes.find((n) => n.id === link.source);
                const t = nodes.find((n) => n.id === link.target);

                if (!s || !t) return null;

                const isFilteredOut =
                  selectedTagFilter &&
                  s.id !== selectedTagFilter &&
                  t.id !== selectedTagFilter;

                const isHighlighted =
                  hoveredNode === s.id ||
                  hoveredNode === t.id ||
                  selectedNode?.id === s.id ||
                  selectedNode?.id === t.id ||
                  selectedTagFilter === s.id ||
                  selectedTagFilter === t.id;

                const midX = (s.x! + t.x!) / 2;
                const midY = (s.y! + t.y!) / 2;
                const formattedLabel = formatLinkLabel(link.label);
                const labelWidth = formattedLabel.length * 7 + 16;

                return (
                  <g
                    key={`link-${idx}`}
                    className={
                      isFilteredOut
                        ? "opacity-15"
                        : "opacity-100 transition-opacity"
                    }
                  >
                    <line
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={isHighlighted ? "var(--primary)" : "currentColor"}
                      strokeOpacity={isHighlighted ? 0.9 : 0.35}
                      strokeWidth={isHighlighted ? 3 : 2}
                      strokeDasharray={
                        link.label === "BELONGS_TO" ? "6,6" : undefined
                      }
                      className="transition-all duration-300"
                    />

                    {/* Clear Label Box behind link text */}
                    <rect
                      x={midX - labelWidth / 2}
                      y={midY - 11}
                      width={labelWidth}
                      height={22}
                      rx={11}
                      fill="var(--card)"
                      fillOpacity="0.92"
                      stroke={
                        isHighlighted ? "var(--primary)" : "var(--border)"
                      }
                      strokeWidth={1.5}
                      className="shadow-sm transition-all duration-300"
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      fill="currentColor"
                      className={`text-[11px] font-bold tracking-wide pointer-events-none select-none transition-colors duration-300 ${
                        isHighlighted ? "text-primary" : "text-foreground"
                      }`}
                      textAnchor="middle"
                    >
                      {formattedLabel}
                    </text>
                  </g>
                );
              })}

              {/* Solid, Vibrant Node Circles */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode === node.id;
                const isTagSelected = selectedTagFilter === node.id;
                const isFilteredOut =
                  selectedTagFilter &&
                  node.id !== selectedTagFilter &&
                  !links.some(
                    (l) =>
                      (l.source === selectedTagFilter &&
                        l.target === node.id) ||
                      (l.target === selectedTagFilter && l.source === node.id),
                  );
                const theme = getNodeTheme(node);
                const radius = getNodeRadius(node);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className={`cursor-pointer group ${isFilteredOut ? "opacity-20" : "opacity-100 transition-opacity duration-300"}`}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Outer selection ring */}
                    <circle
                      r={radius + 6}
                      fill="transparent"
                      stroke={theme.bg}
                      strokeWidth={
                        isSelected || isHovered || isTagSelected ? 3 : 0
                      }
                      className="transition-all duration-200"
                    />

                    {/* Main SOLID filled node circle */}
                    <circle
                      r={radius}
                      fill={theme.bg}
                      stroke={theme.border}
                      strokeWidth={3}
                      data-node-id={node.id}
                      className="shadow-lg transition-transform duration-200 group-hover:scale-105"
                    />

                    {/* Inner white circle for contrast */}
                    <circle
                      r={radius - 8}
                      fill="#ffffff"
                      className="pointer-events-none shadow-inner"
                    />

                    {/* Emoji / Icon inside circle */}
                    <text
                      y={6}
                      fill={theme.bg}
                      fontSize="18"
                      textAnchor="middle"
                      className="pointer-events-none select-none"
                    >
                      {theme.icon}
                    </text>

                    {/* High-contrast node label directly underneath */}
                    <g transform={`translate(0, ${radius + 20})`}>
                      {(() => {
                        const categoryStr =
                          node.type === "Idea"
                            ? "IDEA"
                            : node.type === "Post"
                              ? "POST"
                              : node.type === "Tag"
                                ? "TOPIC"
                                : "CHANNEL";
                        const labelW =
                          Math.max(node.label.length, categoryStr.length) * 8 +
                          32;
                        return (
                          <>
                            <rect
                              x={-(labelW / 2)}
                              y={-18}
                              width={labelW}
                              height={40}
                              rx={6}
                              fill="var(--card)"
                              stroke={
                                isSelected || isTagSelected
                                  ? theme.bg
                                  : "var(--border)"
                              }
                              strokeWidth={1.5}
                              className="shadow-md transition-all duration-200"
                            />
                            <text
                              y={-2}
                              fill="currentColor"
                              className="text-[13px] font-extrabold text-foreground pointer-events-none select-none"
                              textAnchor="middle"
                            >
                              {node.label.length > 22
                                ? node.label.substring(0, 20) + "..."
                                : node.label}
                            </text>
                            <text
                              y={14}
                              fill="currentColor"
                              className="text-[9px] font-bold text-muted-foreground pointer-events-none select-none uppercase tracking-widest"
                              textAnchor="middle"
                            >
                              {categoryStr}
                            </text>
                          </>
                        );
                      })()}
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right Details & Neo4j Insights Panel */}
        <aside className="w-96 shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Neo4j Insights Card */}
          {insights && (
            <Card className="bg-gradient-to-br from-card to-pink-500/5 p-5 border border-pink-500/20 shadow-md rounded-2xl flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-pink-500 animate-pulse" />
                  Neo4j Topic Intelligence
                </h3>
                <Badge className="bg-pink-500/10 text-pink-600 border-pink-500/20 text-[10px]">
                  {insights.metrics?.totalRelationships || 0} Relationships
                </Badge>
              </div>

              {insights.topTags && insights.topTags.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Top Topic Clusters (Click to Filter Graph)
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {insights.topTags.map((item: any) => (
                      <button
                        key={item.tag}
                        onClick={() =>
                          setSelectedTagFilter(
                            selectedTagFilter === item.tag ? null : item.tag,
                          )
                        }
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedTagFilter === item.tag
                            ? "bg-pink-600 text-white border-pink-600 shadow-sm scale-105"
                            : "bg-background text-foreground border-border hover:border-pink-400"
                        }`}
                      >
                        {item.tag}
                        <span className="text-[10px] opacity-80 bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded-full">
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {insights.recommendations?.[0] && (
                <div className="mt-1 bg-background/80 p-3 rounded-xl border border-border/80 text-xs">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    💡 {insights.recommendations[0].title}
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed">
                    {insights.recommendations[0].description}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Selected Node Card */}
          <Card className="flex-1 bg-card p-6 border border-border shadow-md flex flex-col gap-5 overflow-hidden rounded-2xl shrink-0 min-h-[300px]">
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <h2 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                <Info className="size-4 text-primary" />
                Node Details
              </h2>
              {selectedNode && (
                <Badge
                  className="text-xs uppercase font-extrabold px-3 py-1 text-white shadow-xs"
                  style={{ backgroundColor: getNodeTheme(selectedNode).bg }}
                >
                  {selectedNode.type}
                </Badge>
              )}
            </div>

            {selectedNode ? (
              <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Title / Name
                  </span>
                  <h3 className="font-extrabold text-lg text-foreground leading-snug">
                    {selectedNode.label}
                  </h3>
                </div>

                {selectedNode.status && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Status
                    </span>
                    <div>
                      <Badge className="text-xs font-bold px-3 py-1 capitalize shadow-xs">
                        {selectedNode.status}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 flex-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Description & Content
                  </span>
                  <div className="bg-muted/50 p-4 rounded-xl border border-border text-xs text-foreground font-medium leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
                    {selectedNode.content || (
                      <span className="text-muted-foreground italic">
                        No descriptive content provided for this node.
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground mt-auto bg-muted/30 p-3 rounded-xl border border-border">
                  <span className="font-bold text-foreground block mb-1">
                    Node ID Reference:
                  </span>
                  <code className="block select-all bg-background p-1.5 rounded-md border border-border text-[10px] font-mono break-all text-foreground">
                    {selectedNode.id}
                  </code>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-3 flex-1 text-muted-foreground p-6">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <Network className="size-8" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  No Node Selected
                </h4>
                <p className="text-xs font-medium leading-relaxed">
                  Click on any idea, post, channel, or topic cluster inside the
                  interactive graph to view its details.
                </p>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

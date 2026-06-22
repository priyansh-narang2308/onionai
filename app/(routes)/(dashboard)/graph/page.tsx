"use client"

import React, { useEffect, useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Network, Lightbulb, Send, MessageSquare, RefreshCw, ZoomIn, ZoomOut, Maximize } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type GraphNode = {
  id: string
  label: string
  type: "Idea" | "Post" | "Channel" | "PlatformType"
  color?: string
  status?: string
  content?: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

type GraphLink = {
  source: string
  target: string
  label: string
}

export default function GraphPage() {
  const { data, isPending, refetch } = useQuery<{ nodes: GraphNode[]; links: GraphLink[] }>({
    queryKey: ["graph-data"],
    queryFn: async () => {
      const res = await fetch("/api/graph")
      if (!res.ok) throw new Error("Failed to fetch graph data")
      return res.json()
    },
  })

  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  
  const containerRef = useRef<SVGSVGElement | null>(null)
  const panStartRef = useRef({ x: 0, y: 0 })

  // Initialize node positions
  useEffect(() => {
    if (!data) return

    const initialNodes = data.nodes.map((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI
      const radius = 120 + Math.random() * 50
      return {
        ...node,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      }
    })

    setNodes(initialNodes)
    setLinks(data.links)
  }, [data])

  // Simple Force-Directed Layout Physics Engine
  useEffect(() => {
    if (nodes.length === 0) return

    let animationFrameId: number
    const width = 800
    const height = 600

    const updatePhysics = () => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => ({ ...n }))
        const nodeMap = new Map(nextNodes.map((n) => [n.id, n]))

        // 1. Repel forces between all nodes
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n1 = nextNodes[i]
            const n2 = nextNodes[j]

            const dx = n2.x! - n1.x!
            const dy = n2.y! - n1.y!
            const dist = Math.sqrt(dx * dx + dy * dy) || 1

            if (dist < 220) {
              const force = (220 - dist) * 0.08
              const fx = (dx / dist) * force
              const fy = (dy / dist) * force

              if (n1.id !== draggedNodeId) {
                n1.vx! -= fx
                n1.vy! -= fy
              }
              if (n2.id !== draggedNodeId) {
                n2.vx! += fx
                n2.vy! += fy
              }
            }
          }
        }

        // 2. Attract forces along links
        links.forEach((link) => {
          const sNode = nodeMap.get(link.source)
          const tNode = nodeMap.get(link.target)

          if (sNode && tNode) {
            const dx = tNode.x! - sNode.x!
            const dy = tNode.y! - sNode.y!
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const targetDist = 130
            const force = (dist - targetDist) * 0.02

            const fx = (dx / dist) * force
            const fy = (dy / dist) * force

            if (sNode.id !== draggedNodeId) {
              sNode.vx! += fx
              sNode.vy! += fy
            }
            if (tNode.id !== draggedNodeId) {
              tNode.vx! -= fx
              tNode.vy! -= fy
            }
          }
        })

        // 3. Gravity center force & boundary updates
        nextNodes.forEach((n) => {
          if (n.id === draggedNodeId) return

          // Pull to center
          const cx = width / 2
          const cy = height / 2
          n.vx! += (cx - n.x!) * 0.005
          n.vy! += (cy - n.y!) * 0.005

          // Apply velocity & friction
          n.x! += n.vx!
          n.y! += n.vy!
          n.vx! *= 0.8
          n.vy! *= 0.8

          // Constraints
          n.x = Math.max(50, Math.min(width - 50, n.x!))
          n.y = Math.max(50, Math.min(height - 50, n.y!))
        })

        return nextNodes
      })

      animationFrameId = requestAnimationFrame(updatePhysics)
    }

    animationFrameId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animationFrameId)
  }, [links, draggedNodeId, nodes.length])

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement
    const nodeId = target.getAttribute("data-node-id")

    if (nodeId) {
      setIsDragging(true)
      setDraggedNodeId(nodeId)
      setSelectedNode(nodes.find((n) => n.id === nodeId) || null)
    } else {
      setIsDragging(true)
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return

    if (draggedNodeId) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        // Map mouse coordinates to SVG view space taking zoom and pan into account
        const mouseX = (e.clientX - rect.left - pan.x) / zoom
        const mouseY = (e.clientY - rect.top - pan.y) / zoom

        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === draggedNodeId
              ? { ...n, x: mouseX, y: mouseY, vx: 0, vy: 0 }
              : n
          )
        )
      }
    } else {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDraggedNodeId(null)
  }

  const handleZoom = (factor: number) => {
    setZoom((z) => Math.max(0.5, Math.min(2.5, z * factor)))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    refetch()
  }

  // Node styles
  const getNodeColor = (type: string, color?: string) => {
    if (color) return color
    switch (type) {
      case "Idea":
        return "#f59e0b" // Amber/Yellow
      case "Post":
        return "#3b82f6" // Blue
      case "PlatformType":
        return "#10b981" // Emerald
      default:
        return "#71717a" // Gray
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "Idea":
        return <Lightbulb className="size-4 text-amber-500" />
      case "Post":
        return <Send className="size-4 text-blue-500" />
      default:
        return <MessageSquare className="size-4 text-zinc-500" />
    }
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-xs border-border/50">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="size-5 text-lime-500" /> Content Relationship Graph
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualize connection threads between your core ideas, scheduled posts, and publishing channels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleZoom(1.1)} title="Zoom In">
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleZoom(0.9)} title="Zoom Out">
            <ZoomOut className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset} title="Reset & Reload">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        {/* SVG Graph Visualizer */}
        <div className="flex-1 bg-zinc-950/40 dark:bg-black/40 rounded-2xl border border-border/50 shadow-inner relative overflow-hidden flex items-center justify-center">
          <svg
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            viewBox="0 0 800 600"
          >
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Relationship Lines */}
              {links.map((link, idx) => {
                const s = nodes.find((n) => n.id === link.source)
                const t = nodes.find((n) => n.id === link.target)

                if (!s || !t) return null

                const isHighlighted =
                  hoveredNode === s.id ||
                  hoveredNode === t.id ||
                  selectedNode?.id === s.id ||
                  selectedNode?.id === t.id

                return (
                  <g key={`link-${idx}`}>
                    <line
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={isHighlighted ? "#84cc16" : "#27272a"}
                      strokeWidth={isHighlighted ? 2 : 1.2}
                      strokeDasharray={link.label === "BELONGS_TO" ? "4" : undefined}
                      className="transition-all duration-300"
                    />
                    <text
                      x={(s.x! + t.x!) / 2}
                      y={(s.y! + t.y!) / 2 - 4}
                      fill={isHighlighted ? "#84cc16" : "#52525b"}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none select-none transition-colors duration-300"
                    >
                      {link.label}
                    </text>
                  </g>
                )
              })}

              {/* Node Circles */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id
                const isHovered = hoveredNode === node.id
                const isNeighbor =
                  hoveredNode &&
                  links.some(
                    (l) =>
                      (l.source === node.id && l.target === hoveredNode) ||
                      (l.target === node.id && l.source === hoveredNode)
                  )

                const borderCol = isSelected
                  ? "#84cc16"
                  : isHovered || isNeighbor
                  ? "#a3e635"
                  : "#27272a"
                const rad = node.type === "PlatformType" ? 18 : 24
                const col = getNodeColor(node.type, node.color)

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle
                      r={rad + 4}
                      fill="transparent"
                      stroke={borderCol}
                      strokeWidth={isSelected || isHovered ? 2 : 0}
                      className="transition-all duration-300"
                    />
                    <circle
                      r={rad}
                      fill={col}
                      fillOpacity={0.15}
                      stroke={col}
                      strokeWidth={2}
                      data-node-id={node.id}
                      className="transition-all duration-300 group-hover:scale-105"
                    />
                    {/* Inner Node Graphic */}
                    {node.type === "Idea" && (
                      <circle r={6} fill="#f59e0b" className="pointer-events-none" />
                    )}
                    {node.type === "Post" && (
                      <rect
                        x={-5}
                        y={-5}
                        width={10}
                        height={10}
                        rx={2}
                        fill={node.status === "published" ? "#22c55e" : "#3b82f6"}
                        className="pointer-events-none"
                      />
                    )}
                    {node.type === "Channel" && (
                      <circle r={6} fill="#ffffff" className="pointer-events-none" />
                    )}

                    <text
                      y={rad + 14}
                      fill="#e4e4e7"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                      className="pointer-events-none select-none drop-shadow-sm group-hover:fill-white transition-colors"
                    >
                      {node.label.length > 15 ? node.label.substring(0, 12) + "..." : node.label}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>

          {/* Quick Info Hover */}
          {hoveredNode && (
            <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-3 py-2 rounded-lg border border-border/60 shadow-lg text-xs pointer-events-none">
              <span className="font-semibold text-foreground">
                {nodes.find((n) => n.id === hoveredNode)?.label}
              </span>
              <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider mt-0.5">
                {nodes.find((n) => n.id === hoveredNode)?.type}
              </span>
            </div>
          )}
        </div>

        {/* Details Side Panel */}
        <aside className="w-80 shrink-0 flex flex-col gap-4">
          <Card className="flex-1 bg-card/60 backdrop-blur-md p-5 border-border/50 shadow-md flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
              Node Details
            </h2>

            {selectedNode ? (
              <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-1.5 border-b border-border/60 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide font-bold">
                      {selectedNode.type}
                    </Badge>
                    {selectedNode.status && (
                      <Badge
                        variant="secondary"
                        className={`text-[10px] uppercase font-bold ${
                          selectedNode.status === "published"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}
                      >
                        {selectedNode.status}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-foreground mt-1">{selectedNode.label}</h3>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs text-muted-foreground font-semibold">Content / Description</span>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/40 text-xs text-foreground/90 font-medium leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                    {selectedNode.content || "No details provided."}
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground mt-auto bg-muted/20 p-2.5 rounded-lg border border-border/20">
                  <p className="font-semibold text-foreground/80">ID Mapping:</p>
                  <code className="block select-all bg-background/50 p-1 rounded border mt-1 border-border/30 overflow-x-auto">
                    {selectedNode.id}
                  </code>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-2 flex-1 text-muted-foreground p-4">
                <div className="p-3 bg-muted/50 rounded-full">
                  <Network className="size-6 text-zinc-500" />
                </div>
                <p className="text-xs font-medium">Click on any node in the relationship graph to inspect details.</p>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  PanResponder,
} from "react-native";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";
import {
  Network,
  BarChart3,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRAPH_SIZE = Math.min(SCREEN_WIDTH - 32, 360);
const NODE_RADIUS = 24;

interface GraphNode {
  id: string;
  label: string;
  type: string;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

interface Position {
  x: number;
  y: number;
}

const NODE_COLORS: Record<string, string> = {
  idea: "#f59e0b",
  post: "#3b82f6",
  channel: "#10b981",
  platform: "#8b5cf6",
  tag: "#ec4899",
};
const COLOR_LEGEND = [
  { type: "Idea", color: "#f59e0b" },
  { type: "Post (Scheduled)", color: "#3b82f6" },
  { type: "Post (Published)", color: "#10b981" },
  { type: "Channel/Platform", color: "#8b5cf6" },
  { type: "Topic Cluster", color: "#ec4899" },
];

function layoutNodes(
  nodes: GraphNode[],
  _links: GraphLink[],
): Map<string, Position> {
  const positions = new Map<string, Position>();
  const cx = GRAPH_SIZE / 2;
  const cy = GRAPH_SIZE / 2;
  const radius = GRAPH_SIZE * 0.35;

  if (nodes.length === 0) return positions;

  const typeGroups: Record<string, GraphNode[]> = {};
  nodes.forEach((n) => {
    if (!typeGroups[n.type]) typeGroups[n.type] = [];
    typeGroups[n.type].push(n);
  });

  const types = Object.keys(typeGroups);
  const typeAngles: Record<string, number> = {};
  types.forEach((t, i) => {
    typeAngles[t] = (2 * Math.PI * i) / types.length;
  });

  let idx = 0;
  nodes.forEach((node) => {
    const angle = typeAngles[node.type] + idx * 0.3;
    positions.set(node.id, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
    idx++;
  });

  return positions;
}

export function GraphVisualization() {
  const { getToken } = useAuth();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastOffset = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastOffset.current = { ...offset };
      },
      onPanResponderMove: (_, gesture) => {
        setOffset({
          x: lastOffset.current.x + gesture.dx,
          y: lastOffset.current.y + gesture.dy,
        });
      },
    }),
  ).current;

  const {
    data: graphData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["graph-data"],
    queryFn: () => fetchWithAuth("/api/graph", { method: "GET" }, getToken),
  });

  const { data: insights } = useQuery<any>({
    queryKey: ["graph-insights"],
    queryFn: () =>
      fetchWithAuth("/api/graph/insights", { method: "GET" }, getToken),
  });

  const nodePositions = useMemo(() => {
    if (!graphData?.nodes) return new Map();
    return layoutNodes(graphData.nodes, graphData.links || []);
  }, [graphData]);

  const stats = useMemo(() => {
    if (!graphData?.nodes) return {};
    const typeCount: Record<string, number> = {};
    graphData.nodes.forEach((node: GraphNode) => {
      typeCount[node.type] = (typeCount[node.type] || 0) + 1;
    });
    return typeCount;
  }, [graphData]);

  const getNodeColor = (type: string) => NODE_COLORS[type] || "#6b7280";
  const getNodeLabel = (type: string) =>
    type.charAt(0).toUpperCase() + type.slice(1);

  const handleNodePress = useCallback((node: GraphNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#84cc16" />
        <Text style={styles.loadingText}>Loading graph...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Network color="#84cc16" size={24} />
          <View>
            <Text style={styles.headerTitle}>Neo4j AuraDB Content Graph</Text>
            <Text style={styles.headerSubtitle}>
              Interactive multi-hop topic relationships
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
            refetch();
          }}
        >
          <RefreshCw color="#71717a" size={20} />
        </TouchableOpacity>
      </View>

      {/* Color Legend */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.legendBar}
        contentContainerStyle={styles.legendContent}
      >
        {COLOR_LEGEND.map((item) => (
          <View key={item.type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.type}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Interactive Graph Canvas */}
      <View style={styles.graphContainer}>
        <View
          style={[
            styles.graphCanvas,
            { width: GRAPH_SIZE, height: GRAPH_SIZE },
          ]}
          {...panResponder.panHandlers}
        >
          <Svg width={GRAPH_SIZE} height={GRAPH_SIZE}>
            <G transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
              {/* Links */}
              {(graphData?.links || []).map((link: GraphLink, i: number) => {
                const sourcePos = nodePositions.get(
                  typeof link.source === "object"
                    ? (link.source as any).id
                    : link.source,
                );
                const targetPos = nodePositions.get(
                  typeof link.target === "object"
                    ? (link.target as any).id
                    : link.target,
                );
                if (!sourcePos || !targetPos) return null;
                return (
                  <G key={`link-${i}`}>
                    <Line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke="#d4d4d8"
                      strokeWidth={1.5}
                      strokeDasharray={link.label ? "4,3" : undefined}
                    />
                    {link.label && (
                      <SvgText
                        x={(sourcePos.x + targetPos.x) / 2}
                        y={(sourcePos.y + targetPos.y) / 2 - 6}
                        fill="#a1a1aa"
                        fontSize={8}
                        fontWeight="500"
                        textAnchor="middle"
                      >
                        {link.label}
                      </SvgText>
                    )}
                  </G>
                );
              })}

              {/* Nodes */}
              {(graphData?.nodes || []).map((node: GraphNode) => {
                const pos = nodePositions.get(node.id);
                if (!pos) return null;
                const isSelected = selectedNode?.id === node.id;
                return (
                  <G key={node.id} onPress={() => handleNodePress(node)}>
                    {/* Selection ring */}
                    {isSelected && (
                      <Circle
                        cx={pos.x}
                        cy={pos.y}
                        r={NODE_RADIUS + 4}
                        fill="none"
                        stroke={getNodeColor(node.type)}
                        strokeWidth={2}
                        opacity={0.5}
                      />
                    )}
                    <Circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NODE_RADIUS}
                      fill={getNodeColor(node.type)}
                      opacity={0.9}
                    />
                    <SvgText
                      x={pos.x}
                      y={pos.y + 4}
                      fill="#ffffff"
                      fontSize={10}
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {node.label?.substring(0, 3).toUpperCase() || "?"}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>
        </View>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            onPress={() => setScale((s) => Math.min(s + 0.2, 2.5))}
            style={styles.zoomBtn}
          >
            <ZoomIn color="#09090b" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setScale((s) => Math.max(s - 0.2, 0.5))}
            style={styles.zoomBtn}
          >
            <ZoomOut color="#09090b" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }}
            style={styles.zoomBtn}
          >
            <Move color="#09090b" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Node Details */}
      {selectedNode && (
        <View style={styles.detailPanel}>
          <View style={styles.detailDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailTitle}>{selectedNode.label}</Text>
            <Text style={styles.detailType}>
              {getNodeLabel(selectedNode.type)}
            </Text>
            {selectedNode.id && (
              <Text style={styles.detailId}>ID: {selectedNode.id}</Text>
            )}
          </View>
        </View>
      )}

      {/* Neo4j Topic Clusters Card */}
      {insights && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Neo4j Topic Clusters</Text>
          <View
            style={{
              backgroundColor: "#fdf2f8",
              borderColor: "#fbcfe8",
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#be185d",
                marginBottom: 8,
              }}
            >
              Active Hashtag Nodes
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {(insights.topTags || []).map((t: any) => (
                <View
                  key={t.tag}
                  style={{
                    backgroundColor: "#ec4899",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {t.tag} ({t.count})
                  </Text>
                </View>
              ))}
            </View>
            {insights.recommendations?.[0] && (
              <Text
                style={{
                  fontSize: 11,
                  color: "#831843",
                  marginTop: 10,
                  fontStyle: "italic",
                }}
              >
                💡 {insights.recommendations[0].description}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Statistics Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {Object.entries(stats).map(([type, count]) => (
            <View key={type} style={styles.statCard}>
              <View
                style={[
                  styles.statCircle,
                  { backgroundColor: getNodeColor(type) },
                ]}
              >
                <Text style={styles.statCount}>{count}</Text>
              </View>
              <Text style={styles.statLabel}>{getNodeLabel(type)}s</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Network Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        <View style={styles.networkCard}>
          <View style={styles.networkInfo}>
            <Text style={styles.networkLabel}>Total Nodes</Text>
            <Text style={styles.networkValue}>
              {graphData?.nodes?.length || 0}
            </Text>
          </View>
          <View style={styles.networkDivider} />
          <View style={styles.networkInfo}>
            <Text style={styles.networkLabel}>Connections</Text>
            <Text style={styles.networkValue}>
              {graphData?.links?.length || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Node List */}
      {graphData?.nodes && graphData.nodes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Items</Text>
          {graphData.nodes.slice(0, 15).map((node: GraphNode) => (
            <TouchableOpacity
              key={node.id}
              style={[
                styles.nodeItem,
                selectedNode?.id === node.id && styles.nodeItemSelected,
              ]}
              onPress={() => handleNodePress(node)}
            >
              <View
                style={[
                  styles.nodeColor,
                  { backgroundColor: getNodeColor(node.type) },
                ]}
              />
              <View style={styles.nodeContent}>
                <Text style={styles.nodeLabel} numberOfLines={1}>
                  {node.label}
                </Text>
                <Text style={styles.nodeType}>{getNodeLabel(node.type)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {graphData.nodes.length > 15 && (
            <Text style={styles.moreItems}>
              +{graphData.nodes.length - 15} more items
            </Text>
          )}
        </View>
      )}

      {/* Empty State */}
      {(!graphData?.nodes || graphData.nodes.length === 0) && (
        <View style={styles.emptyContainer}>
          <BarChart3 color="#d1d5db" size={40} />
          <Text style={styles.emptyText}>No graph data yet</Text>
          <Text style={styles.emptySubtext}>
            Create ideas and posts to build your content graph
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  loadingText: { marginTop: 12, color: "#71717a", fontSize: 14 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  headerSubtitle: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  legendBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  legendContent: { paddingHorizontal: 16, gap: 16, flexDirection: "row" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: "#71717a", fontWeight: "500" },
  graphContainer: {
    alignItems: "center",
    paddingVertical: 16,
    position: "relative",
  },
  graphCanvas: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f4f4f5",
    overflow: "hidden",
  },
  zoomControls: {
    position: "absolute",
    bottom: 24,
    right: 16,
    gap: 4,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailPanel: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: "#fafafa",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 16,
    gap: 12,
  },
  detailDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#84cc16",
  },
  detailTitle: { fontSize: 14, fontWeight: "700", color: "#09090b" },
  detailType: { fontSize: 11, color: "#71717a", marginTop: 2 },
  detailId: { fontSize: 10, color: "#a1a1aa", marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  statCard: { alignItems: "center", flex: 1 },
  statCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statCount: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  statLabel: { fontSize: 12, color: "#6b7280", textAlign: "center" },
  networkCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
  networkInfo: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  networkLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  networkValue: { fontSize: 20, fontWeight: "700", color: "#84cc16" },
  networkDivider: { width: 1, backgroundColor: "#e5e5e5" },
  nodeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
  },
  nodeItemSelected: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  nodeColor: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  nodeContent: { flex: 1 },
  nodeLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  nodeType: { fontSize: 11, color: "#9ca3af", textTransform: "capitalize" },
  moreItems: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#d1d5db",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

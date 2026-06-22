import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";
import { Network, BarChart3, RefreshCw } from "lucide-react-native";

interface GraphNode {
  id: string;
  label: string;
  type: string; // 'idea', 'post', 'channel', 'platform'
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function GraphVisualization() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});

  const {
    data: graphData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["graph-data"],
    queryFn: () => fetchWithAuth("/api/graph", { method: "GET" }, getToken),
  });

  useEffect(() => {
    if (graphData?.nodes) {
      // Calculate statistics
      const typeCount: Record<string, number> = {};
      graphData.nodes.forEach((node: GraphNode) => {
        typeCount[node.type] = (typeCount[node.type] || 0) + 1;
      });
      setStats(typeCount);
    }
  }, [graphData]);

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      idea: "#3b82f6",
      post: "#10b981",
      channel: "#f59e0b",
      platform: "#8b5cf6",
    };
    return colors[type] || "#6b7280";
  };

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
            <Text style={styles.headerTitle}>Content Graph</Text>
            <Text style={styles.headerSubtitle}>
              See your content relationships
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => refetch()}>
          <RefreshCw color="#71717a" size={20} />
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
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
            <Text style={styles.statLabel}>
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </Text>
          </View>
        ))}
      </View>

      {/* Network Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Overview</Text>
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
          {graphData.nodes.slice(0, 10).map((node: GraphNode) => (
            <View key={node.id} style={styles.nodeItem}>
              <View
                style={[
                  styles.nodeColor,
                  { backgroundColor: getNodeColor(node.type) },
                ]}
              />
              <View style={styles.nodeContent}>
                <Text style={styles.nodeLabel}>{node.label}</Text>
                <Text style={styles.nodeType}>{node.type}</Text>
              </View>
            </View>
          ))}
          {graphData.nodes.length > 10 && (
            <Text style={styles.moreItems}>
              +{graphData.nodes.length - 10} more items
            </Text>
          )}
        </View>
      )}

      {/* Empty State */}
      {!graphData?.nodes ||
        (graphData.nodes.length === 0 && (
          <View style={styles.emptyContainer}>
            <BarChart3 color="#d1d5db" size={40} />
            <Text style={styles.emptyText}>No graph data yet</Text>
            <Text style={styles.emptySubtext}>
              Create ideas and posts to build your content graph
            </Text>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#71717a",
    fontSize: 14,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 8,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statCount: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  networkCard: {
    flexDirection: "row",
    borderRadius: 8,
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
  networkLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  networkValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#84cc16",
  },
  networkDivider: {
    width: 1,
    backgroundColor: "#e5e5e5",
  },
  nodeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
  },
  nodeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  nodeContent: {
    flex: 1,
  },
  nodeLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  nodeType: {
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "capitalize",
  },
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

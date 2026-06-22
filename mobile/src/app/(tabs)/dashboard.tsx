import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react-native";
import { GraphVisualization } from "../../components/graph/graph-visualization";

interface Stats {
  draft: number;
  queue: number;
  published: number;
  failed: number;
}

export default function DashboardTab() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "graph">("overview");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["post-totals"],
    queryFn: () =>
      fetchWithAuth("/api/post/totals", { method: "GET" }, getToken),
  });

  const totalPosts = stats
    ? Object.values(stats).reduce(
        (sum: number, val: any) => sum + (typeof val === "number" ? val : 0),
        0,
      )
    : 0;

  const renderStats = () => {
    if (statsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#84cc16" />
        </View>
      );
    }

    return (
      <>
        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: "#3b82f6" }]}>
            <View style={styles.statHeader}>
              <Calendar color="#3b82f6" size={20} />
              <Text style={styles.statValue}>{stats?.queue || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: "#10b981" }]}>
            <View style={styles.statHeader}>
              <CheckCircle color="#10b981" size={20} />
              <Text style={styles.statValue}>{stats?.published || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Published</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: "#f59e0b" }]}>
            <View style={styles.statHeader}>
              <AlertCircle color="#f59e0b" size={20} />
              <Text style={styles.statValue}>{stats?.failed || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Failed</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: "#8b5cf6" }]}>
            <View style={styles.statHeader}>
              <Zap color="#8b5cf6" size={20} />
              <Text style={styles.statValue}>{stats?.draft || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Drafts</Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Posts</Text>
            <Text style={styles.summaryValue}>{totalPosts}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Success Rate</Text>
            <Text style={styles.summaryValue}>
              {totalPosts > 0
                ? Math.round(((stats?.published || 0) / totalPosts) * 100)
                : 0}
              %
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View
                style={[styles.activityDot, { backgroundColor: "#10b981" }]}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  {stats?.published || 0} posts successfully published
                </Text>
                <Text style={styles.activityTime}>Latest performance</Text>
              </View>
            </View>

            {(stats?.failed || 0) > 0 && (
              <View style={styles.activityItem}>
                <View
                  style={[styles.activityDot, { backgroundColor: "#f59e0b" }]}
                />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {stats?.failed || 0} posts need attention
                  </Text>
                  <Text style={styles.activityTime}>Check failed posts</Text>
                </View>
              </View>
            )}

            <View style={styles.activityItem}>
              <View
                style={[styles.activityDot, { backgroundColor: "#3b82f6" }]}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  {stats?.queue || 0} posts scheduled
                </Text>
                <Text style={styles.activityTime}>Waiting to publish</Text>
              </View>
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Your content analytics</Text>
        </View>
        <View style={styles.headerIcon}>
          <TrendingUp color="#84cc16" size={24} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "overview" && styles.tabActive]}
          onPress={() => setActiveTab("overview")}
        >
          <BarChart3
            color={activeTab === "overview" ? "#84cc16" : "#9ca3af"}
            size={18}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "overview" && styles.tabTextActive,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "graph" && styles.tabActive]}
          onPress={() => setActiveTab("graph")}
        >
          <BarChart3
            color={activeTab === "graph" ? "#84cc16" : "#9ca3af"}
            size={18}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "graph" && styles.tabTextActive,
            ]}
          >
            Graph
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === "overview" ? renderStats() : <GraphVisualization />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  tabNav: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#f0fdf4",
  },
  tabText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#84cc16",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#84cc16",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#f5f5f5",
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
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#f9f9f9",
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 3,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: "#9ca3af",
  },
});

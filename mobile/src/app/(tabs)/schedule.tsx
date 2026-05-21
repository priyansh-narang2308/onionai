import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  X,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText,
  CheckCircle,
} from "lucide-react-native";

interface ScheduledPost {
  id: string;
  content: string;
  scheduled_at: string;
  status: string;
  images: any[];
  user_channels: {
    id: string;
    channel_type_id: string;
    handle: string;
    channel_types: {
      id: string;
      type: string;
      name: string;
      color: string;
    };
  };
}

interface GroupPost {
  key: string;
  label: string;
  posts: ScheduledPost[];
}

export default function ScheduleTab() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  // Mode: "list" or "calendar"
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);

  // Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [selectedChannelTypeId, setSelectedChannelTypeId] = useState<string>("");
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<"twitter" | "linkedin" | "instagram">("twitter");
  const [activeTone, setActiveTone] = useState<"original" | "indie" | "pro" | "chaos">("original");

  // Load posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
    error: postsError,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetchWithAuth("/api/post?group_by_date=true", { method: "GET" }, getToken),
  });

  // Load channels for composer
  const { data: channelsData } = useQuery({
    queryKey: ["channels"],
    queryFn: () => fetchWithAuth("/api/channel", { method: "GET" }, getToken),
  });

  const groupPosts: GroupPost[] = postsData?.groupPosts || [];
  const channels = channelsData?.channels || [];
  const activeChannels = channels.filter((c: any) => c.connected);

  // Save Post Mutation
  const savePostMutation = useMutation({
    mutationFn: (payload: { posts: { channelTypeId: string; content: string }[]; scheduledAt: string }) =>
      fetchWithAuth(
        "/api/post",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        getToken
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setIsComposerOpen(false);
      setComposerText("");
      alert("Post successfully scheduled to your feed!");
    },
    onError: (err: any) => {
      console.error(err);
      alert(err.message || "Failed to schedule post. Make sure you have connected active channels.");
    },
  });

  const handleOpenComposer = () => {
    if (activeChannels.length === 0) {
      alert("Please connect at least one social channel in Settings before scheduling posts!");
      return;
    }
    setSelectedChannelTypeId(activeChannels[0].id);
    setIsComposerOpen(true);
  };

  const handleSchedulePost = () => {
    if (!composerText.trim()) {
      alert("Post content cannot be empty.");
      return;
    }
    if (!selectedChannelTypeId) {
      alert("Please select a target social channel.");
      return;
    }

    // Set scheduled time: 24h from now as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // 6 PM optimal hour

    savePostMutation.mutate({
      posts: [
        {
          channelTypeId: selectedChannelTypeId,
          content: composerText.trim(),
        },
      ],
      scheduledAt: tomorrow.toISOString(),
    });
  };

  // Tone adapter content multiplier
  const getAdaptedPreviewContent = () => {
    if (!composerText.trim()) return "Adapted live preview will render here...";
    const text = composerText.trim();
    if (activeTone === "indie") {
      return text.toLowerCase() + "\n\n#buildinpublic #indiehackers";
    }
    if (activeTone === "pro") {
      return `Proud to announce:\n\n${text}\n\nScale unified voice natively. #automation`;
    }
    if (activeTone === "chaos") {
      return `breaking news: standard schedulers are literally crying because we did this: ${text}`;
    }
    return text;
  };

  // Render Calendar Grid Days (Compact Mock calendar for current month)
  const renderCalendarGrid = () => {
    const daysInMonth = 30;
    const days = [];

    // Simple check if a day has any scheduled posts
    const getPostsForDay = (day: number) => {
      // Find matches in groupPosts
      return groupPosts.flatMap((gp) => {
        const date = new Date(gp.key);
        if (date.getDate() === day) {
          return gp.posts;
        }
        return [];
      });
    };

    for (let i = 1; i <= daysInMonth; i++) {
      const postsOnDay = getPostsForDay(i);
      const isSelected = selectedCalendarDay === i;
      days.push(
        <TouchableOpacity
          key={i}
          onPress={() => setSelectedCalendarDay(i)}
          style={[
            styles.calendarDayCell,
            isSelected ? styles.calendarDayCellSelected : null,
            postsOnDay.length > 0 ? styles.calendarDayCellHasPosts : null,
          ]}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected ? styles.calendarDayTextSelected : null,
              postsOnDay.length > 0 ? styles.calendarDayTextHasPosts : null,
            ]}
          >
            {i}
          </Text>
          {postsOnDay.length > 0 && <View style={styles.calendarPostDot} />}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarCard}>
        <Text style={styles.calendarMonthHeading}>May 2026</Text>
        <View style={styles.calendarDayNamesRow}>
          {["S", "M", "T", "W", "T", "F", "S"].map((n, i) => (
            <Text key={i} style={styles.calendarDayNameText}>
              {n}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>{days}</View>

        {selectedCalendarDay !== null && (
          <View style={styles.calendarDetailsSection}>
            <Text style={styles.calendarDetailsHeading}>
              Drafts Scheduled on May {selectedCalendarDay}:
            </Text>
            {(() => {
              const postsOnDay = getPostsForDay(selectedCalendarDay);
              if (postsOnDay.length === 0) {
                return (
                  <Text style={styles.noPostsOnDayText}>No scheduled items for this date.</Text>
                );
              }
              return postsOnDay.map((post) => (
                <View key={post.id} style={styles.timelinePostCardCompact}>
                  <View style={styles.timelineHeaderRow}>
                    <Text style={styles.timelineChannelName}>
                      {post.user_channels?.channel_types?.name}
                    </Text>
                    <View style={styles.statusPillActive}>
                      <Text style={styles.statusPillActiveText}>{post.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.timelineBodyText} numberOfLines={2}>
                    {post.content}
                  </Text>
                </View>
              ));
            })()}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <CalendarIcon color="#84cc16" size={24} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.title}>All Channels</Text>
          <Text style={styles.subtitle}>Manage and schedule your multi-channel posts</Text>
        </View>
        <View style={styles.viewModeRow}>
          <TouchableOpacity
            onPress={() => setViewMode("list")}
            style={[styles.viewModeBtn, viewMode === "list" ? styles.viewModeBtnActive : null]}
          >
            <List color={viewMode === "list" ? "#84cc16" : "#71717a"} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("calendar")}
            style={[styles.viewModeBtn, viewMode === "calendar" ? styles.viewModeBtnActive : null]}
          >
            <CalendarIcon color={viewMode === "calendar" ? "#84cc16" : "#71717a"} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {viewMode === "calendar" ? (
        <ScrollView contentContainerStyle={styles.scroll}>{renderCalendarGrid()}</ScrollView>
      ) : isLoadingPosts ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator color="#84cc16" size="large" />
          <Text style={styles.loaderText}>Syncing post dispatches...</Text>
        </View>
      ) : postsError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorHeading}>API connection lost</Text>
          <Text style={styles.errorText}>{postsError.message}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {groupPosts.length === 0 ? (
            <View style={styles.emptyFeedCard}>
              <FileText color="#cbd5e1" size={48} />
              <Text style={styles.emptyFeedHeading}>No active queued posts</Text>
              <Text style={styles.emptyFeedDesc}>
                All channels are synchronized. Tap the Floating Action Button below to adapt a new draft in the composer!
              </Text>
            </View>
          ) : (
            groupPosts.map((group) => (
              <View key={group.key} style={styles.groupSection}>
                <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
                {group.posts.map((post) => (
                  <View key={post.id} style={styles.timelinePostCard}>
                    <View style={styles.timelineHeaderRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={[
                            styles.channelTypeBadge,
                            { backgroundColor: post.user_channels?.channel_types?.color || "#09090b" },
                          ]}
                        >
                          <Text style={styles.channelLetter}>
                            {post.user_channels?.channel_types?.name.substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.timelineChannelName}>
                            {post.user_channels?.channel_types?.name}
                          </Text>
                          <Text style={styles.timelineHandle}>{post.user_channels?.handle}</Text>
                        </View>
                      </View>

                      <View style={styles.statusPillActive}>
                        <Text style={styles.statusPillActiveText}>{post.status.toUpperCase()}</Text>
                      </View>
                    </View>

                    <Text style={styles.timelineBodyText}>{post.content}</Text>

                    <View style={styles.timelineFooter}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Clock color="#71717a" size={14} />
                        <Text style={styles.timelineTimeText}>
                          {new Date(post.scheduled_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Text style={styles.optimalBadge}>Optimal dispatch timing</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity onPress={handleOpenComposer} style={styles.fabBtn}>
        <Plus color="#ffffff" size={24} strokeWidth={3} />
      </TouchableOpacity>

      {/* MULTI-CHANNEL NATIVE COMPOSER MODAL */}
      <Modal visible={isComposerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <TrendingUp color="#84cc16" size={18} strokeWidth={2.5} />
                <Text style={styles.modalTitle}>Multi-Channel Composer</Text>
              </View>
              <TouchableOpacity onPress={() => setIsComposerOpen(false)}>
                <X color="#71717a" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {/* Select Channel */}
              <Text style={styles.label}>Select target channel profile:</Text>
              <View style={styles.channelRowSelector}>
                {activeChannels.map((chan: any) => (
                  <TouchableOpacity
                    key={chan.id}
                    onPress={() => setSelectedChannelTypeId(chan.id)}
                    style={[
                      styles.channelSelectBadge,
                      selectedChannelTypeId === chan.id ? styles.channelSelectBadgeActive : null,
                    ]}
                  >
                    <View style={[styles.avatarDot, { backgroundColor: chan.color || "#84cc16" }]} />
                    <Text style={styles.channelSelectText}>{chan.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Text Input */}
              <Text style={styles.label}>Post Message Content</Text>
              <View style={styles.inputAreaCard}>
                <TextInput
                  style={styles.composerInput}
                  placeholder="Draft your social thoughts here..."
                  placeholderTextColor="#cbd5e1"
                  value={composerText}
                  onChangeText={setComposerText}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.inputMeta}>
                  <Text style={styles.charCountText}>{composerText.length} characters</Text>
                </View>
              </View>

              {/* Tone Adapter Presets */}
              <Text style={styles.label}>Tone Preset Strategy:</Text>
              <View style={styles.toneAdapterChipsRow}>
                {(["original", "indie", "pro", "chaos"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => {
                      setActiveTone(t);
                      if (t === "indie") setActivePreviewPlatform("twitter");
                      else if (t === "pro") setActivePreviewPlatform("linkedin");
                    }}
                    style={[
                      styles.toneChip,
                      activeTone === t ? styles.toneChipActive : null,
                    ]}
                  >
                    <Text style={[styles.toneChipText, activeTone === t ? styles.toneChipTextActive : null]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Platform Preview Selector */}
              <Text style={styles.label}>Preview Native Platform Rendering:</Text>
              <View style={styles.previewPlatformTabRow}>
                {(["twitter", "linkedin", "instagram"] as const).map((plat) => (
                  <TouchableOpacity
                    key={plat}
                    onPress={() => setActivePreviewPlatform(plat)}
                    style={[
                      styles.previewPlatBtn,
                      activePreviewPlatform === plat ? styles.previewPlatBtnActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.previewPlatText,
                        activePreviewPlatform === plat ? styles.previewPlatTextActive : null,
                      ]}
                    >
                      {plat.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Live Preview Container */}
              <View style={styles.previewBorderWrapper}>
                {activePreviewPlatform === "twitter" && (
                  <View style={styles.mockTwitterCard}>
                    <View style={styles.mockTwitterHeader}>
                      <View style={styles.mockAvatar} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.mockTwitterUser}>onion.ai</Text>
                        <Text style={styles.mockTwitterHandle}>@onion_ai</Text>
                      </View>
                    </View>
                    <Text style={styles.mockTwitterText}>{getAdaptedPreviewContent()}</Text>
                    <Text style={styles.mockTwitterTime}>9:41 AM · May 21, 2026 · Onion Mobile</Text>
                  </View>
                )}

                {activePreviewPlatform === "linkedin" && (
                  <View style={styles.mockLinkedinCard}>
                    <View style={styles.mockTwitterHeader}>
                      <View style={styles.mockAvatarLinkedin} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.mockLinkedinUser}>onion.ai • 1st</Text>
                        <Text style={styles.mockLinkedinHeadline}>Multi-channel publishing engine</Text>
                      </View>
                    </View>
                    <Text style={styles.mockLinkedinText}>{getAdaptedPreviewContent()}</Text>
                  </View>
                )}

                {activePreviewPlatform === "instagram" && (
                  <View style={styles.mockInstagramCard}>
                    <View style={styles.mockInstaHeader}>
                      <View style={styles.mockAvatarInsta} />
                      <Text style={styles.mockInstaUser}>onion.ai</Text>
                    </View>
                    <View style={styles.mockInstaPhotoBox}>
                      <Text style={styles.mockInstaPhotoLabel}>POST PHOTO SLOT ACTIVE</Text>
                    </View>
                    <Text style={styles.mockInstaCaption}>
                      <Text style={{ fontWeight: "bold" }}>onion.ai </Text>
                      {getAdaptedPreviewContent()}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleSchedulePost}
                style={styles.scheduleActionBtn}
                disabled={savePostMutation.isPending}
              >
                {savePostMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CheckCircle color="#ffffff" size={16} />
                    <Text style={styles.scheduleActionBtnText}>Schedule to Dispatch Feed</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f4f5f0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#09090b",
  },
  subtitle: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  viewModeRow: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderRadius: 10,
    padding: 2,
    borderWidth: 0.5,
    borderColor: "#e4e4e7",
  },
  viewModeBtn: {
    padding: 8,
    borderRadius: 8,
  },
  viewModeBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 120,
  },
  loaderBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loaderText: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 10,
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#71717a",
  },
  emptyFeedCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    textAlign: "center",
    marginTop: 20,
  },
  emptyFeedHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#09090b",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyFeedDesc: {
    fontSize: 12,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 18,
  },
  groupSection: {
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#a1a1aa",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  timelinePostCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  timelineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  channelTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  channelLetter: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 11,
  },
  timelineChannelName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  timelineHandle: {
    fontSize: 10,
    color: "#71717a",
    marginTop: 1,
  },
  statusPillActive: {
    backgroundColor: "#f4f5f0",
    borderWidth: 0.5,
    borderColor: "#e4e6d9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillActiveText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#4d7c0f",
  },
  timelineBodyText: {
    fontSize: 13,
    color: "#3f3f46",
    lineHeight: 19,
  },
  timelineFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
  },
  timelineTimeText: {
    fontSize: 11,
    color: "#71717a",
    fontWeight: "600",
  },
  optimalBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "#84cc16",
  },
  fabBtn: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 112 : 96,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#84cc16",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#84cc16",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 9, 11, 0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
  },
  modalFormScroll: {
    maxHeight: 400,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 8,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  channelRowSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  channelSelectBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    gap: 6,
  },
  channelSelectBadgeActive: {
    backgroundColor: "#f4f5f0",
    borderColor: "#84cc16",
  },
  avatarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  channelSelectText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  inputAreaCard: {
    backgroundColor: "#f4f4f5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 12,
    marginBottom: 10,
  },
  composerInput: {
    height: 100,
    fontSize: 14,
    color: "#09090b",
    textAlignVertical: "top",
    lineHeight: 20,
  },
  inputMeta: {
    borderTopWidth: 0.5,
    borderTopColor: "#e4e4e7",
    paddingTop: 8,
    marginTop: 8,
    alignItems: "flex-end",
  },
  charCountText: {
    fontSize: 10,
    color: "#71717a",
  },
  toneAdapterChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  toneChip: {
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  toneChipActive: {
    backgroundColor: "#f4f5f0",
    borderColor: "#84cc16",
  },
  toneChipText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#71717a",
  },
  toneChipTextActive: {
    color: "#84cc16",
  },
  previewPlatformTabRow: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    padding: 2,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewPlatBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  previewPlatBtnActive: {
    backgroundColor: "#ffffff",
  },
  previewPlatText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#71717a",
  },
  previewPlatTextActive: {
    color: "#09090b",
  },
  previewBorderWrapper: {
    marginBottom: 20,
  },
  mockTwitterCard: {
    backgroundColor: "#09090b",
    borderRadius: 16,
    padding: 16,
  },
  mockTwitterHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  mockAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#84cc16",
  },
  mockTwitterUser: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  mockTwitterHandle: {
    color: "#71717a",
    fontSize: 10,
  },
  mockTwitterText: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  mockTwitterTime: {
    color: "#71717a",
    fontSize: 9,
    marginTop: 12,
  },
  mockLinkedinCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 16,
  },
  mockAvatarLinkedin: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#84cc16",
  },
  mockLinkedinUser: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
  },
  mockLinkedinHeadline: {
    fontSize: 10,
    color: "#71717a",
  },
  mockLinkedinText: {
    fontSize: 13,
    color: "#3f3f46",
    marginTop: 12,
    lineHeight: 18,
  },
  mockInstagramCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 12,
  },
  mockInstaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mockAvatarInsta: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#84cc16",
  },
  mockInstaUser: {
    fontSize: 12,
    fontWeight: "700",
    color: "#09090b",
    marginLeft: 8,
  },
  mockInstaPhotoBox: {
    height: 120,
    backgroundColor: "#f4f4f5",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mockInstaPhotoLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#cbd5e1",
  },
  mockInstaCaption: {
    fontSize: 12,
    color: "#3f3f46",
    lineHeight: 16,
  },
  modalFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 16,
  },
  scheduleActionBtn: {
    backgroundColor: "#84cc16",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  scheduleActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  calendarCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 24,
    padding: 20,
  },
  calendarMonthHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#09090b",
    textAlign: "center",
    marginBottom: 16,
  },
  calendarDayNamesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calendarDayNameText: {
    width: "13%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#a1a1aa",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  calendarDayCell: {
    width: "13%",
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
    position: "relative",
  },
  calendarDayCellSelected: {
    backgroundColor: "#84cc16",
  },
  calendarDayCellHasPosts: {
    backgroundColor: "#f4f5f0",
    borderWidth: 1,
    borderColor: "#e4e6d9",
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  calendarDayTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  calendarDayTextHasPosts: {
    color: "#4d7c0f",
    fontWeight: "700",
  },
  calendarPostDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#84cc16",
  },
  calendarDetailsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 16,
  },
  calendarDetailsHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 12,
  },
  noPostsOnDayText: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
    paddingVertical: 10,
  },
  timelinePostCardCompact: {
    backgroundColor: "#f4f4f5",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
});

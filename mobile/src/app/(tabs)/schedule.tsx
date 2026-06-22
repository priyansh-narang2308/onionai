/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parse, set, addDays } from "date-fns";
import { fetchWithAuth } from "../../lib/api";
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  X,
  Clock,
  Sparkles,
  ChevronRight,
  FileText,
  CheckCircle,
  Send,
  Edit3,
} from "lucide-react-native";
import { useToast } from "../../components/ui/toast";
import { POST_STATUS } from "../../constants/post";
import { DatePicker } from "../../components/schedule/date-picker";

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
    channel_types: { id: string; type: string; name: string; color: string };
  };
}

interface GroupPost {
  key: string;
  label: string;
  posts: ScheduledPost[];
}

type ViewMode = "list" | "calendar";
type StatusTab = "all" | "draft" | "queue" | "published" | "failed";

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "queue", label: "Queue" },
  { key: "published", label: "Published" },
  { key: "failed", label: "Failed" },
];

export default function ScheduleTab() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [composerText, setComposerText] = useState("");
  const [selectedChannelTypeId, setSelectedChannelTypeId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(
    null,
  );
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const { data: ideasData } = useQuery({
    queryKey: ["ideas"],
    queryFn: () => fetchWithAuth("/api/idea", { method: "GET" }, getToken),
  });
  const ideas = (ideasData?.groups || []).flatMap((g: any) => g.ideas || []);

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) =>
      fetchWithAuth(`/api/post/${postId}`, { method: "DELETE" }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-totals"] });
      setIsEditOpen(false);
      setEditingPost(null);
      toast("Post deleted successfully");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to delete post", "error");
    },
  });

  const handleDeletePost = (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePostMutation.mutate(postId),
      },
    ]);
  };

  const handleTranslate = async (langCode: string, langName: string) => {
    const text = isComposerOpen ? composerText : editingPost?.content;
    if (!text?.trim()) {
      toast("Please enter text to translate", "error");
      return;
    }

    setTranslating(true);
    try {
      const res = await fetchWithAuth(
        "/api/sarvam/translate",
        {
          method: "POST",
          body: JSON.stringify({ text, targetLanguage: langCode }),
        },
        getToken,
      );
      if (res && res.translatedText) {
        if (isComposerOpen) {
          setComposerText(res.translatedText);
        } else if (editingPost) {
          setEditingPost((prev) =>
            prev ? { ...prev, content: res.translatedText } : null,
          );
        }
        toast(`Translated to ${langName}`);
      }
    } catch (err: any) {
      toast(err.message || "Translation failed", "error");
    } finally {
      setTranslating(false);
    }
  };

  const {
    data: postsData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["posts", statusTab],
    queryFn: () =>
      fetchWithAuth(
        `/api/post?group_by_date=true${statusTab !== "all" ? `&status=${statusTab}` : ""}`,
        { method: "GET" },
        getToken,
      ),
  });

  const { data: channelsData } = useQuery({
    queryKey: ["channels"],
    queryFn: () => fetchWithAuth("/api/channel", { method: "GET" }, getToken),
  });

  const { data: totalsData } = useQuery({
    queryKey: ["post-totals"],
    queryFn: () =>
      fetchWithAuth("/api/post/totals", { method: "GET" }, getToken),
  });

  const groupPosts: GroupPost[] = postsData?.groupPosts || [];
  const channels = channelsData?.channels || [];
  const activeChannels = channels.filter((c: any) => c.connected);
  const totals: Record<string, number> = totalsData || {};

  const createPostMutation = useMutation({
    mutationFn: (payload: {
      posts: { channelTypeId: string; content: string }[];
      scheduledAt: string;
      ideaId?: string | null;
    }) =>
      fetchWithAuth(
        "/api/post",
        { method: "POST", body: JSON.stringify(payload) },
        getToken,
      ),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-totals"] });
      setIsComposerOpen(false);
      setComposerText("");
      toast(`${data.posts?.length || 1} post(s) scheduled`);
    },
    onError: (err: any) => {
      toast(err.message || "Failed to schedule post", "error");
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      content: string;
      scheduledAt?: string;
      status?: string;
    }) =>
      fetchWithAuth(
        `/api/post/${payload.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            content: payload.content,
            scheduledAt: payload.scheduledAt,
            status: payload.status,
          }),
        },
        getToken,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-totals"] });
      setIsEditOpen(false);
      setEditingPost(null);
      toast("Post updated");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update post", "error");
    },
  });

  const publishNowMutation = useMutation({
    mutationFn: (postId: string) =>
      fetchWithAuth(
        `/api/post/${postId}/publish`,
        { method: "POST" },
        getToken,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-totals"] });
      toast("Post published!");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to publish", "error");
    },
  });

  const handleOpenComposer = () => {
    if (activeChannels.length === 0) {
      toast("Connect a channel in Settings first", "error");
      return;
    }
    setSelectedChannelTypeId(activeChannels[0].id);
    setSelectedDate(new Date());
    setSelectedTime("");
    setSelectedIdeaId(null);
    setIsComposerOpen(true);
  };

  const handleSchedulePost = () => {
    if (!composerText.trim()) {
      toast("Content is required", "error");
      return;
    }
    if (!selectedChannelTypeId) {
      toast("Select a channel", "error");
      return;
    }
    if (!selectedTime) {
      toast("Select a time", "error");
      return;
    }

    const parsedTime = parse(selectedTime, "h:mm a", new Date());
    const scheduleAt = set(selectedDate, {
      hours: parsedTime.getHours(),
      minutes: parsedTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    createPostMutation.mutate({
      posts: [
        { channelTypeId: selectedChannelTypeId, content: composerText.trim() },
      ],
      scheduledAt: scheduleAt.toISOString(),
      ideaId: selectedIdeaId,
    });
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setIsEditOpen(true);
  };

  const handleUpdatePost = () => {
    if (!editingPost) return;
    updatePostMutation.mutate({
      id: editingPost.id,
      content: editingPost.content,
    });
  };

  const handlePublishNow = (postId: string) => {
    publishNowMutation.mutate(postId);
  };

  const getPostsForDay = (day: number) => {
    return groupPosts.flatMap((gp) => {
      const date = new Date(gp.key);
      return date.getDate() === day ? gp.posts : [];
    });
  };

  const renderCalendarGrid = () => {
    const daysInMonth = new Date().getDate();
    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const postsOnDay = getPostsForDay(i);
      const isSelected = selectedCalendarDay === i;
      days.push(
        <TouchableOpacity
          key={i}
          onPress={() => setSelectedCalendarDay(i)}
          style={[
            styles.calendarDayCell,
            isSelected && styles.calendarDayCellSelected,
            postsOnDay.length > 0 && styles.calendarDayCellHasPosts,
          ]}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              postsOnDay.length > 0 && styles.calendarDayTextHasPosts,
            ]}
          >
            {i}
          </Text>
          {postsOnDay.length > 0 && <View style={styles.calendarPostDot} />}
        </TouchableOpacity>,
      );
    }

    return (
      <View style={styles.calendarCard}>
        <Text style={styles.calendarMonthHeading}>
          {format(new Date(), "MMMM yyyy")}
        </Text>
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
              Posts on{" "}
              {format(
                new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  selectedCalendarDay,
                ),
                "MMM d",
              )}
              :
            </Text>
            {(() => {
              const postsOnDay = getPostsForDay(selectedCalendarDay);
              if (postsOnDay.length === 0)
                return (
                  <Text style={styles.noPostsOnDayText}>
                    No posts for this date
                  </Text>
                );
              return postsOnDay.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => handleEditPost(post)}
                  style={styles.timelinePostCardCompact}
                >
                  <View style={styles.timelineHeaderRow}>
                    <Text style={styles.timelineChannelName}>
                      {post.user_channels?.channel_types?.name}
                    </Text>
                    <View style={styles.statusPillActive}>
                      <Text style={styles.statusPillActiveText}>
                        {post.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.timelineBodyText} numberOfLines={2}>
                    {post.content}
                  </Text>
                </TouchableOpacity>
              ));
            })()}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <CalendarIcon color="#84cc16" size={24} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>Manage your posts</Text>
        </View>
        <View style={styles.viewModeRow}>
          <TouchableOpacity
            onPress={() => setViewMode("list")}
            style={[
              styles.viewModeBtn,
              viewMode === "list" && styles.viewModeBtnActive,
            ]}
          >
            <List
              color={viewMode === "list" ? "#84cc16" : "#71717a"}
              size={16}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("calendar")}
            style={[
              styles.viewModeBtn,
              viewMode === "calendar" && styles.viewModeBtnActive,
            ]}
          >
            <CalendarIcon
              color={viewMode === "calendar" ? "#84cc16" : "#71717a"}
              size={16}
            />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "list" && (
        <View style={styles.statusTabBar}>
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? (totals.draft || 0) +
                  (totals.queue || 0) +
                  (totals.published || 0) +
                  (totals.failed || 0)
                : totals[tab.key] || 0;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setStatusTab(tab.key)}
                style={[
                  styles.statusTab,
                  statusTab === tab.key && styles.statusTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    statusTab === tab.key && styles.statusTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <Text
                  style={[
                    styles.statusTabCount,
                    statusTab === tab.key && styles.statusTabCountActive,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {viewMode === "calendar" ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {renderCalendarGrid()}
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator color="#84cc16" size="large" />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorHeading}>Error</Text>
          <Text style={styles.errorText}>{(error as any).message}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {groupPosts.length === 0 ? (
            <View style={styles.emptyFeedCard}>
              <FileText color="#cbd5e1" size={48} />
              <Text style={styles.emptyFeedHeading}>No posts yet</Text>
              <Text style={styles.emptyFeedDesc}>
                Tap + to create your first post
              </Text>
            </View>
          ) : (
            groupPosts.map((group) => (
              <View key={group.key} style={styles.groupSection}>
                <Text style={styles.groupLabel}>
                  {group.label.toUpperCase()}
                </Text>
                {group.posts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    onPress={() => handleEditPost(post)}
                    style={styles.timelinePostCard}
                  >
                    <View style={styles.timelineHeaderRow}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <View
                          style={[
                            styles.channelTypeBadge,
                            {
                              backgroundColor:
                                post.user_channels?.channel_types?.color ||
                                "#09090b",
                            },
                          ]}
                        >
                          <Text style={styles.channelLetter}>
                            {post.user_channels?.channel_types?.name
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.timelineChannelName}>
                            {post.user_channels?.channel_types?.name}
                          </Text>
                          <Text style={styles.timelineHandle}>
                            {post.user_channels?.handle}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          post.status === "draft" && styles.statusPillDraft,
                          post.status === "queue" && styles.statusPillQueue,
                          post.status === "published" &&
                            styles.statusPillPublished,
                          post.status === "failed" && styles.statusPillFailed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            post.status === "draft" &&
                              styles.statusPillTextDraft,
                            post.status === "queue" &&
                              styles.statusPillTextQueue,
                            post.status === "published" &&
                              styles.statusPillTextPublished,
                            post.status === "failed" &&
                              styles.statusPillTextFailed,
                          ]}
                        >
                          {post.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.timelineBodyText} numberOfLines={3}>
                      {post.content}
                    </Text>
                    <View style={styles.timelineFooter}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Clock color="#71717a" size={14} />
                        <Text style={styles.timelineTimeText}>
                          {format(new Date(post.scheduled_at), "MMM d, h:mm a")}
                        </Text>
                      </View>
                      {post.status === "queue" && (
                        <TouchableOpacity
                          onPress={() => handlePublishNow(post.id)}
                          style={styles.publishNowBtn}
                        >
                          <Send color="#ffffff" size={12} />
                          <Text style={styles.publishNowBtnText}>Publish</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity onPress={handleOpenComposer} style={styles.fabBtn}>
        <Plus color="#ffffff" size={24} strokeWidth={3} />
      </TouchableOpacity>

      <Modal visible={isComposerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Post</Text>
              <TouchableOpacity onPress={() => setIsComposerOpen(false)}>
                <X color="#71717a" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalFormScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Channel</Text>
              <View style={styles.channelRowSelector}>
                {activeChannels.map((chan: any) => (
                  <TouchableOpacity
                    key={chan.id}
                    onPress={() => setSelectedChannelTypeId(chan.id)}
                    style={[
                      styles.channelSelectBadge,
                      selectedChannelTypeId === chan.id &&
                        styles.channelSelectBadgeActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.avatarDot,
                        { backgroundColor: chan.color || "#84cc16" },
                      ]}
                    />
                    <Text style={styles.channelSelectText}>{chan.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {ideas.length > 0 && (
                <>
                  <Text style={styles.label}>Link to Idea</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}
                  >
                    {ideas.map((idea: any) => (
                      <TouchableOpacity
                        key={idea.id}
                        onPress={() => {
                          setSelectedIdeaId(idea.id);
                          setComposerText(
                            (
                              idea.title +
                              "\n\n" +
                              (idea.description || "")
                            ).trim(),
                          );
                          toast("Idea loaded!");
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor:
                            selectedIdeaId === idea.id ? "#84cc16" : "#f4f4f5",
                          borderWidth: 1,
                          borderColor:
                            selectedIdeaId === idea.id ? "#84cc16" : "#e4e4e7",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color:
                              selectedIdeaId === idea.id
                                ? "#ffffff"
                                : "#3f3f46",
                          }}
                        >
                          {idea.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.label}>Content</Text>
              <View style={styles.inputAreaCard}>
                <TextInput
                  style={styles.composerInput}
                  placeholder="Write your post..."
                  placeholderTextColor="#cbd5e1"
                  value={composerText}
                  onChangeText={setComposerText}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.inputMeta}>
                  <Text style={styles.charCountText}>
                    {composerText.length} chars
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 8,
                  marginBottom: 12,
                }}
              >
                {translating ? (
                  <ActivityIndicator
                    size="small"
                    color="#84cc16"
                    style={{ marginHorizontal: 10 }}
                  />
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#71717a",
                        alignSelf: "center",
                        marginRight: 6,
                      }}
                    >
                      Translate:
                    </Text>
                    {[
                      { code: "hi-IN", name: "Hindi" },
                      { code: "ta-IN", name: "Tamil" },
                      { code: "te-IN", name: "Telugu" },
                      { code: "kn-IN", name: "Kannada" },
                      { code: "ml-IN", name: "Malayalam" },
                      { code: "bn-IN", name: "Bengali" },
                    ].map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        onPress={() => handleTranslate(lang.code, lang.name)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 12,
                          backgroundColor: "#f4f4f5",
                          borderWidth: 1,
                          borderColor: "#e4e4e7",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: "#3f3f46",
                          }}
                        >
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>
              <Text style={styles.label}>Schedule</Text>
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
                time={selectedTime}
                onTimeChange={setSelectedTime}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleSchedulePost}
                style={styles.scheduleActionBtn}
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CheckCircle color="#ffffff" size={16} />
                    <Text style={styles.scheduleActionBtnText}>Schedule</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Post</Text>
              <TouchableOpacity onPress={() => setIsEditOpen(false)}>
                <X color="#71717a" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalFormScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Content</Text>
              <View style={styles.inputAreaCard}>
                <TextInput
                  style={styles.composerInput}
                  placeholder="Edit your post..."
                  placeholderTextColor="#cbd5e1"
                  value={editingPost?.content || ""}
                  onChangeText={(text) =>
                    setEditingPost((prev) =>
                      prev ? { ...prev, content: text } : null,
                    )
                  }
                  multiline
                  numberOfLines={4}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 8,
                  marginBottom: 12,
                }}
              >
                {translating ? (
                  <ActivityIndicator
                    size="small"
                    color="#84cc16"
                    style={{ marginHorizontal: 10 }}
                  />
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#71717a",
                        alignSelf: "center",
                        marginRight: 6,
                      }}
                    >
                      Translate:
                    </Text>
                    {[
                      { code: "hi-IN", name: "Hindi" },
                      { code: "ta-IN", name: "Tamil" },
                      { code: "te-IN", name: "Telugu" },
                      { code: "kn-IN", name: "Kannada" },
                      { code: "ml-IN", name: "Malayalam" },
                      { code: "bn-IN", name: "Bengali" },
                    ].map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        onPress={() => handleTranslate(lang.code, lang.name)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 12,
                          backgroundColor: "#f4f4f5",
                          borderWidth: 1,
                          borderColor: "#e4e4e7",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: "#3f3f46",
                          }}
                        >
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>

              {editingPost?.status === "queue" && (
                <TouchableOpacity
                  onPress={() => handlePublishNow(editingPost.id)}
                  style={styles.publishNowLargeBtn}
                >
                  <Send color="#ffffff" size={16} />
                  <Text style={styles.publishNowLargeBtnText}>Publish Now</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <View
              style={[
                styles.modalFooter,
                { flexDirection: "row", justifyContent: "space-between" },
              ]}
            >
              <TouchableOpacity
                onPress={() => editingPost && handleDeletePost(editingPost.id)}
                disabled={deletePostMutation.isPending}
                style={[
                  styles.scheduleActionBtn,
                  {
                    backgroundColor: "#fef2f2",
                    borderColor: "#fca5a5",
                    marginRight: 8,
                    flex: 0.35,
                  },
                ]}
              >
                {deletePostMutation.isPending ? (
                  <ActivityIndicator color="#ef4444" size="small" />
                ) : (
                  <Text
                    style={[styles.scheduleActionBtnText, { color: "#ef4444" }]}
                  >
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdatePost}
                style={[styles.scheduleActionBtn, { flex: 0.65 }]}
                disabled={updatePostMutation.isPending}
              >
                {updatePostMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CheckCircle color="#ffffff" size={16} />
                    <Text style={styles.scheduleActionBtnText}>
                      Save Changes
                    </Text>
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
  container: { flex: 1, backgroundColor: "#ffffff" },
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
  title: { fontSize: 20, fontWeight: "800", color: "#09090b" },
  subtitle: { fontSize: 12, color: "#71717a", marginTop: 2 },
  viewModeRow: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderRadius: 10,
    padding: 2,
    borderWidth: 0.5,
    borderColor: "#e4e4e7",
  },
  viewModeBtn: { padding: 8, borderRadius: 8 },
  viewModeBtnActive: { backgroundColor: "#ffffff" },
  statusTabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    gap: 6,
  },
  statusTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#f4f4f5",
    gap: 4,
  },
  statusTabActive: {
    backgroundColor: "#f4f5f0",
    borderWidth: 1,
    borderColor: "#e4e6d9",
  },
  statusTabText: { fontSize: 11, fontWeight: "600", color: "#71717a" },
  statusTabTextActive: { color: "#84cc16", fontWeight: "700" },
  statusTabCount: { fontSize: 10, fontWeight: "700", color: "#a1a1aa" },
  statusTabCountActive: { color: "#4d7c0f" },
  scroll: { padding: 20, paddingBottom: 120 },
  loaderBox: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: { color: "#ffffff", fontWeight: "600", fontSize: 12 },
  emptyFeedCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginTop: 20,
  },
  emptyFeedHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#09090b",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyFeedDesc: { fontSize: 12, color: "#71717a", textAlign: "center" },
  groupSection: { marginBottom: 24 },
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
  channelLetter: { color: "#ffffff", fontWeight: "800", fontSize: 11 },
  timelineChannelName: { fontSize: 13, fontWeight: "700", color: "#09090b" },
  timelineHandle: { fontSize: 10, color: "#71717a", marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillDraft: { backgroundColor: "#f4f4f5" },
  statusPillQueue: { backgroundColor: "#f4f5f0" },
  statusPillPublished: { backgroundColor: "#f0fdf4" },
  statusPillFailed: { backgroundColor: "#fef2f2" },
  statusPillActive: {
    backgroundColor: "#f4f5f0",
    borderWidth: 0.5,
    borderColor: "#e4e6d9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: { fontSize: 8, fontWeight: "800" },
  statusPillTextDraft: { color: "#71717a" },
  statusPillTextQueue: { color: "#4d7c0f" },
  statusPillTextPublished: { color: "#166534" },
  statusPillTextFailed: { color: "#ef4444" },
  statusPillActiveText: { fontSize: 8, fontWeight: "800", color: "#4d7c0f" },
  timelineBodyText: { fontSize: 13, color: "#3f3f46", lineHeight: 19 },
  timelineFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
  },
  timelineTimeText: { fontSize: 11, color: "#71717a", fontWeight: "600" },
  publishNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#84cc16",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  publishNowBtnText: { fontSize: 10, fontWeight: "700", color: "#ffffff" },
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
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#09090b" },
  modalFormScroll: { maxHeight: 500 },
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
  avatarDot: { width: 8, height: 8, borderRadius: 4 },
  channelSelectText: { fontSize: 12, fontWeight: "600", color: "#71717a" },
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
  charCountText: { fontSize: 10, color: "#71717a" },
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
  scheduleActionBtnText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  publishNowLargeBtn: {
    backgroundColor: "#84cc16",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 12,
  },
  publishNowLargeBtnText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
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
  calendarDayCellSelected: { backgroundColor: "#84cc16" },
  calendarDayCellHasPosts: {
    backgroundColor: "#f4f5f0",
    borderWidth: 1,
    borderColor: "#e4e6d9",
  },
  calendarDayText: { fontSize: 12, fontWeight: "600", color: "#71717a" },
  calendarDayTextSelected: { color: "#ffffff", fontWeight: "700" },
  calendarDayTextHasPosts: { color: "#4d7c0f", fontWeight: "700" },
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

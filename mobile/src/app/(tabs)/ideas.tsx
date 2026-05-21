import React, { useState, useEffect } from "react";
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
  Lightbulb,
  Plus,
  Trash2,
  Sparkles,
  Edit3,
  CheckCircle,
  HelpCircle,
  X,
  ChevronRight,
  FolderOpen,
} from "lucide-react-native";

interface Idea {
  id: string;
  title: string;
  description: string;
  images: any[];
  columnId: string;
  sortOrder: number;
}

interface Column {
  id: string;
  title: string;
  ideas: Idea[];
}

export default function IdeasTab() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  // Selected tab column
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Form states for creating/editing
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColumnId, setFormColumnId] = useState("");

  // Form states for AI generator
  const [businessType, setBusinessType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Query database for groups and ideas
  const {
    data: ideasData,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["ideas"],
    queryFn: () => fetchWithAuth("/api/idea", { method: "GET" }, getToken),
  });

  const columns: Column[] = ideasData?.groups || [];
  const activeColumn = columns[activeColumnIndex];

  // In case columns load, default the form column ID
  useEffect(() => {
    if (columns.length > 0 && !formColumnId) {
      setFormColumnId(columns[0].id);
    }
  }, [columns]);

  // Mutation to Save (Insert or Update)
  const saveIdeaMutation = useMutation({
    mutationFn: (ideaPayload: {
      id?: string;
      title: string;
      description: string;
      groupId: string;
      images: any[];
      sortOrder: number;
    }) =>
      fetchWithAuth(
        "/api/idea",
        {
          method: "POST",
          body: JSON.stringify(ideaPayload),
        },
        getToken
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      alert(err.message || "Failed to save content idea.");
    },
  });

  // Mutation to Delete
  const deleteIdeaMutation = useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/idea/${id}`, { method: "DELETE" }, getToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      alert(err.message || "Failed to remove idea.");
    },
  });

  // Mutation to Generate AI Ideas
  const aiGenerateMutation = useMutation({
    mutationFn: (payload: { businessType: string; targetAudience: string }) =>
      fetchWithAuth(
        "/api/idea/generate-ideas",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        getToken
      ),
    onSuccess: (data: { ideas: { title: string; description: string }[] }) => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      setIsAiModalOpen(false);
      setBusinessType("");
      setTargetAudience("");
      
      const count = data.ideas?.length || 0;
      alert(`AI Spark: Successfully injected ${count} premium adapted drafts into your Kanban board!`);
    },
    onError: (err: any) => {
      console.error(err);
      alert(err.message || "Failed to run AI generator. Make sure you are on a Pro/Premium membership.");
    },
  });

  const resetForm = () => {
    setSelectedIdea(null);
    setFormTitle("");
    setFormDesc("");
    if (columns.length > 0) {
      setFormColumnId(columns[0].id);
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    if (activeColumn) {
      setFormColumnId(activeColumn.id);
    }
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (idea: Idea) => {
    setSelectedIdea(idea);
    setFormTitle(idea.title);
    setFormDesc(idea.description || "");
    setFormColumnId(idea.columnId);
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      alert("Please specify an idea title.");
      return;
    }

    saveIdeaMutation.mutate({
      id: selectedIdea?.id,
      title: formTitle.trim(),
      description: formDesc.trim(),
      groupId: formColumnId,
      images: selectedIdea?.images || [],
      sortOrder: selectedIdea?.sortOrder || 0,
    });
  };

  const handleDelete = () => {
    if (!selectedIdea?.id) return;
    deleteIdeaMutation.mutate(selectedIdea.id);
  };

  const handleTriggerAiGenerate = () => {
    if (!businessType.trim() || !targetAudience.trim()) {
      alert("Please fill in both business type and target audience.");
      return;
    }
    aiGenerateMutation.mutate({
      businessType: businessType.trim(),
      targetAudience: targetAudience.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Lightbulb color="#84cc16" size={24} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.title}>Ideas Kanban</Text>
          <Text style={styles.subtitle}>Capture and organize your content ideas</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsAiModalOpen(true)}
          style={styles.aiSparkTriggerBtn}
        >
          <Sparkles color="#84cc16" size={16} strokeWidth={2.5} />
          <Text style={styles.aiSparkTriggerText}>AI Spark</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Kanban Columns Tab bar */}
      <View style={styles.columnTabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.columnTabBar}>
          {columns.map((col, index) => {
            const isActive = activeColumnIndex === index;
            return (
              <TouchableOpacity
                key={col.id}
                onPress={() => setActiveColumnIndex(index)}
                style={[styles.columnTabButton, isActive ? styles.columnTabButtonActive : null]}
              >
                <Text style={[styles.columnTabText, isActive ? styles.columnTabTextActive : null]}>
                  {col.title}
                </Text>
                <View style={[styles.columnCountBadge, isActive ? styles.columnCountBadgeActive : null]}>
                  <Text style={[styles.columnCountText, isActive ? styles.columnCountTextActive : null]}>
                    {col.ideas?.length || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ideas list feed */}
      {isLoading && !isRefetching ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator color="#84cc16" size="large" />
          <Text style={styles.loaderText}>Synching Kanban boards...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorHeading}>Connection Error</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {activeColumn && activeColumn.ideas?.length === 0 ? (
            <View style={styles.emptyFeedCard}>
              <FolderOpen color="#cbd5e1" size={48} />
              <Text style={styles.emptyFeedHeading}>No drafts in {activeColumn.title}</Text>
              <Text style={styles.emptyFeedDesc}>
                Tap the floating action button below to add a custom content idea or generate new posts with our AI Assistant!
              </Text>
            </View>
          ) : (
            activeColumn?.ideas?.map((idea) => (
              <TouchableOpacity
                key={idea.id}
                activeOpacity={0.8}
                onPress={() => handleOpenEdit(idea)}
                style={styles.ideaCard}
              >
                <View style={styles.ideaHeader}>
                  <Text style={styles.ideaTitle} numberOfLines={2}>
                    {idea.title}
                  </Text>
                  <ChevronRight color="#a1a1aa" size={16} />
                </View>
                {idea.description ? (
                  <Text style={styles.ideaDesc} numberOfLines={3}>
                    {idea.description}
                  </Text>
                ) : null}
                <View style={styles.ideaFooter}>
                  <Text style={styles.ideaOrderLabel}>Sort Weight: {idea.sortOrder}</Text>
                  <View style={styles.ideaStatusPill}>
                    <Text style={styles.ideaStatusText}>{activeColumn.title.toUpperCase()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity onPress={handleOpenAdd} style={styles.fabBtn}>
        <Plus color="#ffffff" size={24} strokeWidth={3} />
      </TouchableOpacity>

      {/* ADD / EDIT IDEA MODAL */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedIdea ? "Edit Kanban Draft" : "New Content Idea"}
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X color="#71717a" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Idea Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Catchy title or thread summary"
                  placeholderTextColor="#a1a1aa"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description & Raw Draft</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Elaborate on your raw draft ideas..."
                  placeholderTextColor="#a1a1aa"
                  value={formDesc}
                  onChangeText={setFormDesc}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Kanban Board Stage</Text>
                <View style={styles.columnSelectorRow}>
                  {columns.map((col) => {
                    const isSelected = formColumnId === col.id;
                    return (
                      <TouchableOpacity
                        key={col.id}
                        onPress={() => setFormColumnId(col.id)}
                        style={[
                          styles.columnSelectChip,
                          isSelected ? styles.columnSelectChipActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.columnSelectText,
                            isSelected ? styles.columnSelectTextActive : null,
                          ]}
                        >
                          {col.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {selectedIdea && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.actionBtn, styles.deleteBtn]}
                  disabled={deleteIdeaMutation.isPending}
                >
                  {deleteIdeaMutation.isPending ? (
                    <ActivityIndicator color="#ef4444" size="small" />
                  ) : (
                    <>
                      <Trash2 color="#ef4444" size={16} />
                      <Text style={styles.deleteBtnText}>Remove</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSave}
                style={[styles.actionBtn, styles.saveBtn, !selectedIdea ? { flex: 1 } : null]}
                disabled={saveIdeaMutation.isPending}
              >
                {saveIdeaMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CheckCircle color="#ffffff" size={16} />
                    <Text style={styles.saveBtnText}>Save Draft</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI IDEAS GENERATOR MODAL */}
      <Modal visible={isAiModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Sparkles color="#84cc16" size={18} strokeWidth={2.5} />
                <Text style={styles.modalTitle}>AI Ideas Generator</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAiModalOpen(false)}>
                <X color="#71717a" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll}>
              <View style={styles.infoBox}>
                <Sparkles color="#84cc16" size={18} />
                <Text style={styles.infoBoxText}>
                  Provide details about your project, and Onion's custom AI model will instantly inject 3 premium, highly engaging adapted thread concepts directly into your drafts backlog.
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Business or Project Niche</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Design-first scheduling SaaS, local bakery"
                  placeholderTextColor="#a1a1aa"
                  value={businessType}
                  onChangeText={setBusinessType}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Target Audience</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. B2B creators, local foodies, SaaS developers"
                  placeholderTextColor="#a1a1aa"
                  value={targetAudience}
                  onChangeText={setTargetAudience}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleTriggerAiGenerate}
                style={styles.aiGenerateBtn}
                disabled={aiGenerateMutation.isPending}
              >
                {aiGenerateMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Sparkles color="#ffffff" size={16} strokeWidth={2.5} />
                    <Text style={styles.aiGenerateBtnText}>Generate Adapted Concepts</Text>
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
  aiSparkTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f5f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e6d9",
    gap: 6,
  },
  aiSparkTriggerText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4d7c0f",
  },
  columnTabBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  columnTabBar: {
    flexDirection: "row",
  },
  columnTabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f4f4f5",
    gap: 8,
  },
  columnTabButtonActive: {
    backgroundColor: "#f4f5f0",
    borderWidth: 1,
    borderColor: "#e4e6d9",
  },
  columnTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  columnTabTextActive: {
    color: "#84cc16",
    fontWeight: "700",
  },
  columnCountBadge: {
    backgroundColor: "#e4e4e7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  columnCountBadgeActive: {
    backgroundColor: "#d9f99d",
  },
  columnCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717a",
  },
  columnCountTextActive: {
    color: "#3f6212",
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
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
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
  ideaCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 2,
  },
  ideaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ideaTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
    flex: 1,
    marginRight: 10,
  },
  ideaDesc: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 8,
    lineHeight: 18,
  },
  ideaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 10,
  },
  ideaOrderLabel: {
    fontSize: 11,
    color: "#a1a1aa",
    fontWeight: "500",
  },
  ideaStatusPill: {
    backgroundColor: "#f4f5f0",
    borderWidth: 0.5,
    borderColor: "#e4e6d9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ideaStatusText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#4d7c0f",
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
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#09090b",
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
  },
  columnSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  columnSelectChip: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  columnSelectChipActive: {
    backgroundColor: "#f4f5f0",
    borderColor: "#84cc16",
  },
  columnSelectText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  columnSelectTextActive: {
    color: "#84cc16",
    fontWeight: "700",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
  },
  saveBtn: {
    flex: 2,
    backgroundColor: "#84cc16",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f4f5f0",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: "#4d7c0f",
    lineHeight: 16,
  },
  aiGenerateBtn: {
    width: "100%",
    backgroundColor: "#84cc16",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  aiGenerateBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});

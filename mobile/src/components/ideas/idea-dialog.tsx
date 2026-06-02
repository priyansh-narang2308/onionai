import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from "react-native"
import { X, Sparkles, Trash2, Check } from "lucide-react-native"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-expo"
import { Idea } from "../../types/idea.type"
import { fetchWithAuth } from "../../lib/api"
import { useToast } from "../../components/ui/toast"

const GROUPS = ["campaigns", "promos", "events", "content", "others"]

type Props = {
  visible: boolean
  onClose: () => void
  idea: Idea | null
}

export function IdeaDialog({ visible, onClose, idea }: Props) {
  const [content, setContent] = useState(idea?.content || "")
  const [group, setGroup] = useState<string>(idea?.group || "others")
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getToken } = useAuth()

  React.useEffect(() => {
    if (idea) {
      setContent(idea.content)
      setGroup(idea.group || "others")
    }
  }, [idea])

  const handleSave = async () => {
    if (!idea || !content.trim()) return
    setSaving(true)
    try {
      await fetchWithAuth(`/api/idea?id=${idea.id}`, {
        method: "PUT",
        body: JSON.stringify({ content, group }),
      }, getToken)
      queryClient.invalidateQueries({ queryKey: ["ideas"] })
      toast("Idea updated", "success")
      onClose()
    } catch (err: any) {
      toast(err?.message || "Failed to update", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleAIImprove = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const resp = await fetchWithAuth("/api/idea/generate-ideas", {
        method: "POST",
        body: JSON.stringify({ prompt: `Improve this idea: ${content}` }),
      }, getToken)
      const data = await resp.json()
      if (data.ideas?.[0]) setContent(data.ideas[0])
    } catch (err) {
      console.error("AI improve error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!idea) return
    setSaving(true)
    try {
      await fetchWithAuth(`/api/idea?id=${idea.id}`, { method: "DELETE" }, getToken)
      queryClient.invalidateQueries({ queryKey: ["ideas"] })
      toast("Idea deleted", "success")
      onClose()
    } catch (err: any) {
      toast(err?.message || "Failed to delete", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(9,9,11,0.4)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "80%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#09090b" }}>Edit Idea</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center" }}>
              <X color="#09090b" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
            {/* Group selector */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGroup(g)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: group === g ? "#09090b" : "#f4f4f5",
                  }}
                >
                  <Text style={{
                    fontSize: 13, fontWeight: "600", textTransform: "capitalize",
                    color: group === g ? "#ffffff" : "#71717a",
                  }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={{ fontSize: 15, color: "#09090b", lineHeight: 22, padding: 0, minHeight: 120 }}
              value={content}
              onChangeText={setContent}
              placeholder="Idea content..."
              placeholderTextColor="#a1a1aa"
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleAIImprove}
              disabled={saving || !content.trim()}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                paddingVertical: 12, borderRadius: 12,
                backgroundColor: "#f4f5f0",
              }}
            >
              <Sparkles color="#84cc16" size={18} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#4d7c0f" }}>Improve with AI</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f4f4f5", flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={handleDelete} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" }}>
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !content.trim()}
              style={{
                flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                paddingVertical: 14, borderRadius: 14,
                backgroundColor: content.trim() ? "#84cc16" : "#e4e4e7",
              }}
            >
              {saving ? <ActivityIndicator color="#ffffff" /> : <Check color={content.trim() ? "#ffffff" : "#a1a1aa"} size={18} />}
              <Text style={{ fontSize: 14, fontWeight: "700", color: content.trim() ? "#ffffff" : "#a1a1aa" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

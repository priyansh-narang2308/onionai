import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from "react-native"
import { X, Send, Trash2, Calendar, Check } from "lucide-react-native"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-expo"
import { Post } from "../../types/post.type"
import { ContentTextarea } from "../content-textarea"
import { PreviewPanel } from "../preview/preview-panel"
import { AIAssistant } from "./ai-assistant"
import { getChannelInfo, CHANNEL_PLATFORMS } from "../../constants/channels"
import { useToast } from "../../components/ui/toast"
import { fetchWithAuth } from "../../lib/api"

type Props = {
  visible: boolean
  onClose: () => void
  post: Post | null
}

export function EditPostDialog({ visible, onClose, post }: Props) {
  const [content, setContent] = useState(post?.content || "")
  const [selectedChannels, setSelectedChannels] = useState<string[]>(post?.channels || [])
  const [scheduleDate, setScheduleDate] = useState(post?.scheduled_at ? post.scheduled_at.substring(0, 10) : "")
  const [scheduleTime, setScheduleTime] = useState(post?.scheduled_at ? post.scheduled_at.substring(11, 16) : "")
  const [saving, setSaving] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getToken } = useAuth()

  React.useEffect(() => {
    if (post) {
      setContent(post.content)
      setSelectedChannels(post.channels || [])
      setScheduleDate(post.scheduled_at ? post.scheduled_at.substring(0, 10) : "")
      setScheduleTime(post.scheduled_at ? post.scheduled_at.substring(11, 16) : "")
    }
  }, [post])

  const handleSave = async () => {
    if (!post || !content.trim()) return
    setSaving(true)
    try {
      const body: any = { content, channels: selectedChannels }
      if (scheduleDate) body.scheduled_at = `${scheduleDate}T${scheduleTime || "09:00"}:00`

      const resp = await fetchWithAuth(`/api/post?id=${post.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }, getToken)
      const data = await resp.json()
      if (data.post) {
        toast("Post updated", "success")
        queryClient.invalidateQueries({ queryKey: ["posts"] })
        onClose()
      }
    } catch (err: any) {
      toast(err?.message || "Failed to update", "error")
    } finally {
      setSaving(false)
    }
  }

  const handlePublishNow = async () => {
    if (!post) return
    setSaving(true)
    try {
      const resp = await fetchWithAuth(`/api/post?id=${post.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "published", published_at: new Date().toISOString() }),
      }, getToken)
      const data = await resp.json()
      if (data.post) {
        toast("Published!", "success")
        queryClient.invalidateQueries({ queryKey: ["posts"] })
        onClose()
      }
    } catch (err: any) {
      toast(err?.message || "Failed to publish", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!post) return
    setSaving(true)
    try {
      await fetchWithAuth(`/api/post?id=${post.id}`, { method: "DELETE" }, getToken)
      toast("Post deleted", "success")
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      onClose()
    } catch (err: any) {
      toast(err?.message || "Failed to delete", "error")
    } finally {
      setSaving(false)
    }
  }

  if (!post) return null

  const channels = CHANNEL_PLATFORMS
  const charLimit = selectedChannels.length > 0
    ? Math.min(...selectedChannels.map(ch => getChannelInfo(ch)?.character_limit || Infinity))
    : null

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(9,9,11,0.4)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#09090b" }}>Edit Post</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center" }}>
              <X color="#09090b" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
            {/* Status badge */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                backgroundColor: post.status === "published" ? "#f0fdf4" : post.status === "failed" ? "#fef2f2" : "#f4f4f5",
              }}>
                <Text style={{
                  fontSize: 11, fontWeight: "600", textTransform: "capitalize",
                  color: post.status === "published" ? "#16a34a" : post.status === "failed" ? "#ef4444" : "#71717a",
                }}>{post.status}</Text>
              </View>
              {post.channels?.map(ch => (
                <View key={ch} style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: getChannelInfo(ch)?.color + "20" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: getChannelInfo(ch)?.color }}>{getChannelInfo(ch)?.name}</Text>
                </View>
              ))}
            </View>

            {/* Channel selector */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {channels.map((p) => (
                <TouchableOpacity
                  key={p.type}
                  onPress={() => setSelectedChannels(prev =>
                    prev.includes(p.type) ? prev.filter(c => c !== p.type) : [...prev, p.type]
                  )}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                    backgroundColor: selectedChannels.includes(p.type) ? p.color + "20" : "#f4f4f5",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: selectedChannels.includes(p.type) ? p.color : "#71717a" }}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ContentTextarea
              value={content}
              onChange={setContent}
              minHeight={200}
              placeholder="Edit your content..."
              showAIAssistant
              onAIAssistantClick={() => setShowAI(!showAI)}
            />
            {charLimit && (
              <Text style={{
                fontSize: 11, fontWeight: "600", alignSelf: "flex-end",
                color: content.length > charLimit ? "#ef4444" : "#a1a1aa",
              }}>
                {content.length}/{charLimit}
              </Text>
            )}

            {showAI && (
              <AIAssistant content={content} onContentChange={setContent} onClose={() => setShowAI(false)} />
            )}

            <PreviewPanel content={content} selectedChannels={selectedChannels} />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>Schedule Date</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 10, padding: 10, fontSize: 14, color: "#09090b" }}
                  value={scheduleDate}
                  onChangeText={setScheduleDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#a1a1aa"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", marginBottom: 4 }}>Time</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 10, padding: 10, fontSize: 14, color: "#09090b" }}
                  value={scheduleTime}
                  onChangeText={setScheduleTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#a1a1aa"
                />
              </View>
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f4f4f5", flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={handleDelete} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" }}>
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
            {post.status !== "published" && (
              <TouchableOpacity onPress={handlePublishNow} disabled={saving} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: "#84cc16" }}>
                {saving ? <ActivityIndicator color="#ffffff" /> : <Send color="#ffffff" size={18} />}
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>Publish Now</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} disabled={saving} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: "#09090b" }}>
              {saving ? <ActivityIndicator color="#ffffff" /> : <Check color="#ffffff" size={18} />}
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

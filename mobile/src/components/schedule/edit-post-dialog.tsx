import React, { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from "react-native"
import { X, Send, Trash2, Check, ChevronDown } from "lucide-react-native"
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
  const [globalContent, setGlobalContent] = useState("")
  const [perChannelContent, setPerChannelContent] = useState<Record<string, string>>({})
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [saving, setSaving] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getToken } = useAuth()

  useEffect(() => {
    if (post) {
      setGlobalContent(post.content)
      setSelectedChannels(post.channels || [])
      setScheduleDate(post.scheduled_at ? post.scheduled_at.substring(0, 10) : "")
      setScheduleTime(post.scheduled_at ? post.scheduled_at.substring(11, 16) : "")
      if (post.channelContents) {
        const flat: Record<string, string> = {}
        Object.entries(post.channelContents).forEach(([key, val]) => {
          flat[key] = val.text
        })
        setPerChannelContent(flat)
      }
    }
  }, [post])

  const getChannelContent = (channelType: string): string => {
    return perChannelContent[channelType] ?? globalContent
  }

  const setChannelContent = (channelType: string, text: string) => {
    if (text === globalContent) {
      const newContent = { ...perChannelContent }
      delete newContent[channelType]
      setPerChannelContent(newContent)
    } else {
      setPerChannelContent((prev) => ({ ...prev, [channelType]: text }))
    }
  }

  const handleSave = async () => {
    if (!post || !globalContent.trim()) return
    setSaving(true)
    try {
      const channelContents: Record<string, { text: string }> = {}
      selectedChannels.forEach((ch) => {
        channelContents[ch] = { text: getChannelContent(ch) }
      })

      const body: Record<string, unknown> = {
        content: globalContent,
        channels: selectedChannels,
        channelContents,
      }
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update"
      toast(message, "error")
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to publish"
      toast(message, "error")
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete"
      toast(message, "error")
    } finally {
      setSaving(false)
    }
  }

  if (!post) return null

  const channels = CHANNEL_PLATFORMS

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

          <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ gap: 16, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
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

            {/* Global Content */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#52525b", marginBottom: 6 }}>
                Content (shared across channels)
              </Text>
              <ContentTextarea
                value={globalContent}
                onChange={setGlobalContent}
                minHeight={140}
                placeholder="Edit your content..."
                showAIAssistant
                onAIAssistantClick={() => setShowAI(!showAI)}
              />
            </View>

            {/* Per-channel editors */}
            {selectedChannels.length > 1 &&
              selectedChannels.map((ch) => {
                const info = getChannelInfo(ch)
                const chContent = getChannelContent(ch)
                const isCustom = perChannelContent[ch] !== undefined
                const overLimit = chContent.length > (info?.character_limit || Infinity)

                return (
                  <View
                    key={ch}
                    style={{
                      borderWidth: 1,
                      borderColor: expandedChannel === ch ? info?.color + "40" : "#f4f4f5",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setExpandedChannel(expandedChannel === ch ? null : ch)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        backgroundColor: isCustom ? "#fafafa" : "#ffffff",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: info?.color }} />
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#09090b" }}>{info?.name}</Text>
                        {isCustom && (
                          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#f4f5f0" }}>
                            <Text style={{ fontSize: 8, fontWeight: "800", color: "#4d7c0f" }}>CUSTOM</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: overLimit ? "#ef4444" : "#a1a1aa" }}>
                          {chContent.length}
                          {info?.character_limit ? `/${info.character_limit}` : ""}
                        </Text>
                        <ChevronDown color="#a1a1aa" size={14} style={{ transform: [{ rotate: expandedChannel === ch ? "180deg" : "0deg" }] }} />
                      </View>
                    </TouchableOpacity>
                    {expandedChannel === ch && (
                      <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                        <TextInput
                          style={{
                            backgroundColor: "#fafafa",
                            borderWidth: 1,
                            borderColor: "#e4e4e7",
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 13,
                            color: "#09090b",
                            minHeight: 80,
                            textAlignVertical: "top",
                          }}
                          value={chContent}
                          onChangeText={(text) => setChannelContent(ch, text)}
                          placeholder={`Customize for ${info?.name}...`}
                          placeholderTextColor="#a1a1aa"
                          multiline
                        />
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 4 }}>
                          <TouchableOpacity onPress={() => {
                            const newContent = { ...perChannelContent }
                            delete newContent[ch]
                            setPerChannelContent(newContent)
                          }}>
                            <Text style={{ fontSize: 10, color: "#71717a", fontWeight: "600" }}>Reset to global</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )
              })}

            {showAI && (
              <AIAssistant content={globalContent} onContentChange={setGlobalContent} onClose={() => setShowAI(false)} />
            )}

            <PreviewPanel content={globalContent} selectedChannels={selectedChannels} perChannelContent={perChannelContent} />

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

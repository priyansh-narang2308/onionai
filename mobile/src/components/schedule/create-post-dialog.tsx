import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from "react-native"
import { X, Check, Send, Sparkles, Lightbulb, Eye, ChevronDown, Calendar } from "lucide-react-native"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-expo"
import { ContentTextarea } from "../content-textarea"
import { PreviewPanel } from "../preview/preview-panel"
import { AIAssistant } from "./ai-assistant"
import { IdeasList } from "./ideas-list"
import { getChannelInfo, CHANNEL_PLATFORMS } from "../../constants/channels"
import { useToast } from "../../components/ui/toast"
import { fetchWithAuth } from "../../lib/api"

const platforms = CHANNEL_PLATFORMS

type Props = {
  visible: boolean
  onClose: () => void
  initialContent?: string
  initialChannels?: string[]
}

type Tab = "compose" | "ideas" | "ai" | "preview"

export function CreatePostDialog({ visible, onClose, initialContent, initialChannels }: Props) {
  const [tab, setTab] = useState<Tab>("compose")
  const [content, setContent] = useState(initialContent || "")
  const [selectedChannels, setSelectedChannels] = useState<string[]>(initialChannels || [])
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [showChannels, setShowChannels] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getToken } = useAuth()

  const toggleChannel = (type: string) => {
    setSelectedChannels(prev =>
      prev.includes(type) ? prev.filter(c => c !== type) : [...prev, type]
    )
  }

  const handlePublish = async (status: "published" | "queue") => {
    if (!content.trim()) {
      toast("Please add some content", "error")
      return
    }
    if (selectedChannels.length === 0) {
      toast("Select at least one channel", "error")
      return
    }

    setPublishing(true)
    try {
      const body: any = {
        content,
        channels: selectedChannels,
        status,
      }
      if (status === "queue" && scheduleDate) {
        body.scheduled_at = `${scheduleDate}T${scheduleTime || "09:00"}:00`
      }

      const resp = await fetchWithAuth("/api/post", {
        method: "POST",
        body: JSON.stringify(body),
      }, getToken)
      const data = await resp.json()
      if (data.post) {
        toast("Post created!", "success")
        queryClient.invalidateQueries({ queryKey: ["posts"] })
        onClose()
      }
    } catch (err: any) {
      toast(err?.message || "Failed to create post", "error")
    } finally {
      setPublishing(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "compose", label: "Compose", icon: Send },
    { key: "ideas", label: "Ideas", icon: Lightbulb },
    { key: "ai", label: "AI", icon: Sparkles },
    { key: "preview", label: "Preview", icon: Eye },
  ]

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(9,9,11,0.4)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%", paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#09090b" }}>Create Post</Text>
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center" }}>
              <X color="#09090b" size={20} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", marginHorizontal: 20, gap: 4, backgroundColor: "#f4f4f5", borderRadius: 12, padding: 4 }}>
            {tabs.map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setTab(key)}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 10, backgroundColor: tab === key ? "#ffffff" : "transparent" }}
              >
                <Icon color={tab === key ? "#84cc16" : "#71717a"} size={16} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: tab === key ? "#09090b" : "#71717a" }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ paddingHorizontal: 20, marginTop: 16 }} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
            {tab === "compose" && (
              <>
                {/* Channel selector */}
                <View>
                  <TouchableOpacity
                    onPress={() => setShowChannels(!showChannels)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717a" }}>Posting to</Text>
                    <View style={{ flexDirection: "row", flex: 1, gap: 4 }}>
                      {selectedChannels.length > 0 ? selectedChannels.map(ch => (
                        <View key={ch} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: getChannelInfo(ch)?.color + "20" }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: getChannelInfo(ch)?.color }}>{getChannelInfo(ch)?.name}</Text>
                        </View>
                      )) : (
                        <Text style={{ fontSize: 12, color: "#a1a1aa" }}>Select channels</Text>
                      )}
                    </View>
                    <ChevronDown color="#71717a" size={16} />
                  </TouchableOpacity>
                  {showChannels && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {platforms.map((p) => (
                        <TouchableOpacity
                          key={p.type}
                          onPress={() => toggleChannel(p.type)}
                          style={{
                            flexDirection: "row", alignItems: "center", gap: 6,
                            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                            backgroundColor: selectedChannels.includes(p.type) ? p.color + "20" : "#f4f4f5",
                          }}
                        >
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.color }} />
                          <Text style={{ fontSize: 12, fontWeight: "600", color: selectedChannels.includes(p.type) ? p.color : "#71717a" }}>{p.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <ContentTextarea
                  value={content}
                  onChange={setContent}
                  placeholder="What do you want to share?"
                  minHeight={200}
                />

                {/* Schedule */}
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
              </>
            )}

            {tab === "ideas" && (
              <IdeasList onSelectIdea={(text) => { setContent(text); setTab("compose") }} />
            )}

            {tab === "ai" && (
              <AIAssistant content={content} onContentChange={setContent} onClose={() => setTab("compose")} />
            )}

            {tab === "preview" && (
              <PreviewPanel content={content} selectedChannels={selectedChannels} />
            )}
          </ScrollView>

          {/* Actions */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f4f4f5", flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => handlePublish("queue")}
              disabled={publishing}
              style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "#e4e4e7" }}
            >
              <Calendar color="#09090b" size={18} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#09090b" }}>
                {publishing ? "Saving..." : "Schedule"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handlePublish("published")}
              disabled={publishing}
              style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: "#84cc16" }}
            >
              {publishing ? (
                <ActivityIndicator color="#ffffff" size={18} />
              ) : (
                <Send color="#ffffff" size={18} />
              )}
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>
                {publishing ? "Publishing..." : "Publish Now"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

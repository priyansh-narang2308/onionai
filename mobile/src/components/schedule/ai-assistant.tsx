import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { Sparkles, RefreshCw, Send, Shrink, Expand, Pencil } from "lucide-react-native"
import { useAuth } from "@clerk/clerk-expo"
import { fetchWithAuth } from "../../lib/api"

type Props = {
  content: string
  onContentChange: (text: string) => void
  onClose: () => void
}

const actions = [
  { id: "rephrase", label: "Rephrase", icon: RefreshCw },
  { id: "shorten", label: "Shorten", icon: Shrink },
  { id: "expand", label: "Expand", icon: Expand },
  { id: "custom", label: "Custom Prompt", icon: Pencil },
]

export function AIAssistant({ content, onContentChange, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState("")
  const [showCustom, setShowCustom] = useState(false)
  const { getToken } = useAuth()

  const handleAction = async (action: string) => {
    if (action === "custom") {
      setShowCustom(!showCustom)
      return
    }
    setLoading(action)
    try {
      const resp = await fetchWithAuth("/api/post/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, action }),
      }, getToken)
      if (resp?.content) onContentChange(resp.content)
    } catch (err) {
      console.error("AI assistant error:", err)
    } finally {
      setLoading(null)
    }
  }

  const handleCustom = async () => {
    if (!customPrompt.trim()) return
    setLoading("custom")
    try {
      const resp = await fetchWithAuth("/api/post/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Custom: ${customPrompt}. Original content: ${content}`, action: "custom" }),
      }, getToken)
      if (resp?.content) onContentChange(resp.content)
      setShowCustom(false)
      setCustomPrompt("")
    } catch (err) {
      console.error("AI custom error:", err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Sparkles color="#84cc16" size={20} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#09090b" }}>AI Assistant</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <Text style={{ fontSize: 13, color: "#71717a" }}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {actions.map(({ id, label, icon: Icon }) => (
          <TouchableOpacity
            key={id}
            onPress={() => handleAction(id)}
            disabled={loading !== null}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 16, paddingVertical: 10,
              borderRadius: 12, backgroundColor: loading === id ? "#f0fdf4" : "#ffffff",
              borderWidth: 1, borderColor: loading === id ? "#84cc16" : "#e4e4e7",
            }}
          >
            {loading === id ? (
              <ActivityIndicator color="#84cc16" size={16} />
            ) : (
              <Icon color="#09090b" size={16} />
            )}
            <Text style={{ fontSize: 13, fontWeight: "600", color: loading === id ? "#4d7c0f" : "#09090b" }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showCustom && (
        <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{
              flex: 1, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 12,
              padding: 12, fontSize: 14, color: "#09090b", backgroundColor: "#ffffff",
            }}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder="What would you like to change?"
            placeholderTextColor="#a1a1aa"
          />
          <TouchableOpacity
            onPress={handleCustom}
            disabled={loading === "custom" || !customPrompt.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: customPrompt.trim() ? "#84cc16" : "#e4e4e7",
              alignItems: "center", justifyContent: "center",
            }}
          >
            {loading === "custom" ? (
              <ActivityIndicator color="#ffffff" size={20} />
            ) : (
              <Send color={customPrompt.trim() ? "#ffffff" : "#a1a1aa"} size={20} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

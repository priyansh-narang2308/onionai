import React, { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { Lightbulb } from "lucide-react-native"
import { useAuth } from "@clerk/clerk-expo"
import { Idea } from "../../types/idea.type"
import { fetchWithAuth } from "../../lib/api"

type Props = {
  onSelectIdea: (content: string) => void
  selectedGroup?: string | null
}

const GROUP_COLORS: Record<string, string> = {
  campaigns: "#ef4444",
  promos: "#f97316",
  events: "#84cc16",
  content: "#3b82f6",
  others: "#8b5cf6",
}

export function IdeasList({ onSelectIdea, selectedGroup: externalGroup }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(externalGroup || null)
  const { getToken } = useAuth()

  React.useEffect(() => {
    loadIdeas()
  }, [])

  const loadIdeas = async () => {
    setLoading(true)
    try {
      const data = await fetchWithAuth(`/api/idea${selectedGroup ? `?group=${selectedGroup}` : ""}`, { method: "GET" }, getToken)
      setIdeas(data?.ideas || data || [])
    } catch (err) {
      console.error("Failed to load ideas:", err)
    } finally {
      setLoading(false)
    }
  }

  const groups = ["campaigns", "promos", "events", "content", "others"]

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Lightbulb color="#84cc16" size={20} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#09090b" }}>Ideas</Text>
        </View>
        <TouchableOpacity onPress={loadIdeas} style={{ padding: 4 }}>
          <Text style={{ fontSize: 12, color: "#84cc16", fontWeight: "600" }}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
        {groups.map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => { setSelectedGroup(g === selectedGroup ? null : g); loadIdeas() }}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
              backgroundColor: selectedGroup === g ? (GROUP_COLORS[g] || "#09090b") : "#f4f4f5",
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: "600",
              color: selectedGroup === g ? "#ffffff" : GROUP_COLORS[g] || "#09090b",
              textTransform: "capitalize",
            }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ alignItems: "center", padding: 24 }}>
          <ActivityIndicator color="#84cc16" />
        </View>
      ) : ideas.length === 0 ? (
        <View style={{ backgroundColor: "#fafafa", borderRadius: 12, padding: 20, alignItems: "center" }}>
          <Lightbulb color="#d4d4d8" size={28} />
          <Text style={{ fontSize: 13, color: "#a1a1aa", marginTop: 8 }}>No ideas yet. Generate some ideas first.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {ideas.slice(0, 5).map((idea: any) => (
            <TouchableOpacity
              key={idea.id}
              onPress={() => onSelectIdea(idea.content || idea.title)}
              style={{
                backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#f4f4f5",
                padding: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: "#09090b", lineHeight: 20 }} numberOfLines={3}>{idea.content || idea.title}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                {idea.group && (
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
                    backgroundColor: (GROUP_COLORS[idea.group] || "#09090b") + "20",
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: GROUP_COLORS[idea.group] || "#09090b", textTransform: "capitalize" }}>{idea.group}</Text>
                  </View>
                )}
                <Text style={{ fontSize: 11, color: "#a1a1aa" }}>
                  {new Date(idea.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

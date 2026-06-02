import React, { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native"
import { Plus, MoreHorizontal, Lightbulb, GripVertical } from "lucide-react-native"
import { useAuth } from "@clerk/clerk-expo"
import { Idea } from "../../types/idea.type"
import { useQueryClient } from "@tanstack/react-query"
import { fetchWithAuth } from "../../lib/api"
import { useToast } from "../../components/ui/toast"

const GROUP_COLORS: Record<string, string> = {
  campaigns: "#ef4444",
  promos: "#f97316",
  events: "#84cc16",
  content: "#3b82f6",
  others: "#8b5cf6",
}

const GROUP_LABELS: Record<string, string> = {
  campaigns: "Campaigns",
  promos: "Promotions",
  events: "Events",
  content: "Content",
  others: "Others",
}

type Props = {
  ideas: Idea[]
  onSelectIdea: (idea: Idea) => void
  onDeleteIdea: (id: string) => void
}

export function IdeaKanban({ ideas, onSelectIdea, onDeleteIdea }: Props) {
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newIdeaText, setNewIdeaText] = useState("")
  const [creating, setCreating] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getToken } = useAuth()

  const groups = ["campaigns", "promos", "events", "content", "others"]

  const handleCreate = async (group: string) => {
    if (!newIdeaText.trim()) return
    setCreating(true)
    try {
      await fetchWithAuth("/api/idea", {
        method: "POST",
        body: JSON.stringify({ content: newIdeaText.trim(), group }),
      }, getToken)
      queryClient.invalidateQueries({ queryKey: ["ideas"] })
      setNewIdeaText("")
      setAddingTo(null)
      toast("Idea created!", "success")
    } catch (err: any) {
      toast(err?.message || "Failed to create idea", "error")
    } finally {
      setCreating(false)
    }
  }

  const getIdeasByGroup = (group: string) => ideas.filter(idea => (idea.group || "others") === group)

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
      {groups.map((group) => {
        const groupIdeas = getIdeasByGroup(group)
        const color = GROUP_COLORS[group] || "#09090b"
        return (
          <View key={group} style={{ width: 280 }}>
            {/* Column header */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: 14, paddingVertical: 10,
              backgroundColor: color + "10", borderTopLeftRadius: 14, borderTopRightRadius: 14,
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#09090b", flex: 1 }}>{GROUP_LABELS[group]}</Text>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
                backgroundColor: color + "20",
              }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color }}>{groupIdeas.length}</Text>
              </View>
            </View>

            {/* Cards */}
            <View style={{
              backgroundColor: "#fafafa", borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
              padding: 8, minHeight: 200,
              borderWidth: 1, borderTopWidth: 0, borderColor: "#f4f4f5",
            }}>
              <View style={{ gap: 8 }}>
                {groupIdeas.map((idea) => (
                  <TouchableOpacity
                    key={idea.id}
                    onPress={() => onSelectIdea(idea)}
                    style={{
                      backgroundColor: "#ffffff", borderRadius: 12, padding: 12,
                      borderWidth: 1, borderColor: "#f4f4f5",
                      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#09090b", lineHeight: 19 }} numberOfLines={4}>{idea.content}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                      <Text style={{ fontSize: 10, color: "#a1a1aa" }}>
                        {new Date(idea.created_at).toLocaleDateString()}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <Text style={{ fontSize: 10, color: "#84cc16", fontWeight: "600" }}>Use</Text>
                        <TouchableOpacity onPress={() => onDeleteIdea(idea.id)}>
                          <Text style={{ fontSize: 10, color: "#ef4444", fontWeight: "600" }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Add idea card */}
                {addingTo === group ? (
                  <View style={{ backgroundColor: "#ffffff", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#84cc16" }}>
                    <TextInput
                      style={{ fontSize: 13, color: "#09090b", padding: 4, minHeight: 40 }}
                      value={newIdeaText}
                      onChangeText={setNewIdeaText}
                      placeholder="Type idea..."
                      placeholderTextColor="#a1a1aa"
                      multiline
                    />
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleCreate(group)}
                        disabled={creating || !newIdeaText.trim()}
                        style={{
                          flex: 1, paddingVertical: 8, borderRadius: 8,
                          backgroundColor: newIdeaText.trim() ? "#84cc16" : "#e4e4e7",
                          alignItems: "center",
                        }}
                      >
                        {creating ? (
                          <ActivityIndicator color="#ffffff" size={16} />
                        ) : (
                          <Text style={{ fontSize: 12, fontWeight: "700", color: newIdeaText.trim() ? "#ffffff" : "#a1a1aa" }}>Add</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { setAddingTo(null); setNewIdeaText("") }}
                        style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                      >
                        <Text style={{ fontSize: 12, color: "#71717a" }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setAddingTo(group)}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                      paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: "dashed",
                      borderColor: "#d4d4d8",
                    }}
                  >
                    <Plus color="#a1a1aa" size={16} />
                    <Text style={{ fontSize: 12, color: "#a1a1aa", fontWeight: "600" }}>Add Idea</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}

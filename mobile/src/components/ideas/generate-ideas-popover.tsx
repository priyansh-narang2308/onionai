import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from "react-native"
import { X, Sparkles, Wand2, MessageSquare, Target, Zap } from "lucide-react-native"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-expo"
import { fetchWithAuth } from "../../lib/api"
import { useToast } from "../../components/ui/toast"

const PROMPT_TEMPLATES = [
  {
    id: "campaign",
    label: "Campaign Ideas",
    icon: Target,
    prompt: "Generate 5 creative social media campaign ideas for brand engagement",
  },
  {
    id: "promo",
    label: "Promotional",
    icon: Zap,
    prompt: "Generate 5 promotional post ideas to drive sales and conversions",
  },
  {
    id: "content",
    label: "Content Topics",
    icon: MessageSquare,
    prompt: "Generate 5 engaging content topic ideas for social media",
  },
  {
    id: "custom",
    label: "Custom",
    icon: Wand2,
    prompt: "",
  },
]

type Props = {
  visible: boolean
  onClose: () => void
}

export function GenerateIdeasPopover({ visible, onClose }: Props) {
  const [step, setStep] = useState<"template" | "custom" | "generating" | "results">("template")
  const [customPrompt, setCustomPrompt] = useState("")
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getToken } = useAuth()

  const handleGenerate = async (prompt: string) => {
    setStep("generating")
    setLoading(true)
    try {
      const resp = await fetchWithAuth("/api/idea/generate-ideas", {
        method: "POST",
        body: JSON.stringify({ prompt, count: 5 }),
      }, getToken)
      const data = await resp.json()
      setGeneratedIdeas(data.ideas || [])
      setStep("results")
    } catch (err: any) {
      toast(err?.message || "Failed to generate", "error")
      setStep("template")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIdea = async (idea: string) => {
    try {
      await fetchWithAuth("/api/idea", {
        method: "POST",
        body: JSON.stringify({ content: idea, group: "content" }),
      }, getToken)
      queryClient.invalidateQueries({ queryKey: ["ideas"] })
      toast("Idea saved!", "success")
    } catch (err: any) {
      toast(err?.message || "Failed to save", "error")
    }
  }

  const reset = () => {
    setStep("template")
    setCustomPrompt("")
    setGeneratedIdeas([])
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(9,9,11,0.4)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "80%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Sparkles color="#84cc16" size={22} />
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#09090b" }}>Generate Ideas</Text>
            </View>
            <TouchableOpacity onPress={() => { reset(); onClose() }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f4f4f5", alignItems: "center", justifyContent: "center" }}>
              <X color="#09090b" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
            {step === "template" && (
              <>
                <Text style={{ fontSize: 14, color: "#71717a" }}>Choose a template or write a custom prompt</Text>
                <View style={{ gap: 8 }}>
                  {PROMPT_TEMPLATES.map(({ id, label, icon: Icon, prompt }) => (
                    <TouchableOpacity
                      key={id}
                      onPress={() => {
                        if (id === "custom") setStep("custom")
                        else handleGenerate(prompt)
                      }}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 14,
                        padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#f4f4f5",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#f4f5f0", alignItems: "center", justifyContent: "center" }}>
                        <Icon color="#84cc16" size={20} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: "#09090b" }}>{label}</Text>
                        <Text style={{ fontSize: 12, color: "#a1a1aa" }}>{prompt || "Write your own prompt"}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {step === "custom" && (
              <>
                <Text style={{ fontSize: 14, color: "#71717a" }}>Describe what kind of ideas you need</Text>
                <TextInput
                  style={{
                    borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 14, padding: 16,
                    fontSize: 15, color: "#09090b", minHeight: 120,
                  }}
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                  placeholder="E.g., Ideas for promoting a new AI-powered SaaS product..."
                  placeholderTextColor="#a1a1aa"
                  multiline
                  textAlignVertical="top"
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity onPress={() => setStep("template")} style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
                    <Text style={{ fontSize: 14, color: "#71717a" }}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleGenerate(customPrompt)}
                    disabled={!customPrompt.trim()}
                    style={{
                      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                      paddingVertical: 12, borderRadius: 14,
                      backgroundColor: customPrompt.trim() ? "#84cc16" : "#e4e4e7",
                    }}
                  >
                    <Sparkles color={customPrompt.trim() ? "#ffffff" : "#a1a1aa"} size={18} />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: customPrompt.trim() ? "#ffffff" : "#a1a1aa" }}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === "generating" && (
              <View style={{ alignItems: "center", padding: 40 }}>
                <ActivityIndicator color="#84cc16" size={36} />
                <Text style={{ fontSize: 15, color: "#71717a", marginTop: 16 }}>Generating ideas with AI...</Text>
              </View>
            )}

            {step === "results" && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#09090b" }}>
                    {generatedIdeas.length} ideas generated
                  </Text>
                  <TouchableOpacity onPress={() => handleGenerate(customPrompt || PROMPT_TEMPLATES[0].prompt)}>
                    <Text style={{ fontSize: 13, color: "#84cc16", fontWeight: "600" }}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 10 }}>
                  {generatedIdeas.map((idea, i) => (
                    <View key={i} style={{
                      backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#f4f4f5",
                      padding: 14,
                    }}>
                      <Text style={{ fontSize: 14, color: "#09090b", lineHeight: 20 }}>{idea}</Text>
                      <TouchableOpacity
                        onPress={() => handleSaveIdea(idea)}
                        style={{
                          alignSelf: "flex-start", marginTop: 8,
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                          backgroundColor: "#f4f5f0",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#4d7c0f" }}>Save Idea</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

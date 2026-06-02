import React, { useRef, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal, StyleSheet } from "react-native"
import { ImagePlus, Smile, Sparkles, X } from "lucide-react-native"
import { ImageObject } from "../types/post.type"

type Props = {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  minHeight?: number
  showAIAssistant?: boolean
  onAIAssistantClick?: () => void
  images?: ImageObject[]
  onImagesChange?: (images: ImageObject[]) => void
  disabled?: boolean
  renderToolbarRight?: React.ReactNode
  maxLength?: number
}

const EMOJIS = ["😀", "😂", "❤️", "🔥", "👍", "🎉", "🚀", "💡", "📝", "🎯", "✨", "🙌", "💪", "🤝", "⭐", "💥", "👏", "🔥", "💯", "🎊"]

export function ContentTextarea({
  value, onChange, placeholder = "What's on your mind?",
  minHeight = 280, showAIAssistant = false, onAIAssistantClick,
  images = [], onImagesChange, disabled = false,
  renderToolbarRight, maxLength,
}: Props) {
  const [showEmoji, setShowEmoji] = useState(false)

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji)
    setShowEmoji(false)
  }

  const removeImage = (index: number) => {
    onImagesChange?.(images.filter((_, i) => i !== index))
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.textarea, { minHeight, maxHeight: minHeight }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#a1a1aa"
        multiline
        textAlignVertical="top"
        editable={!disabled}
      />

      <View style={styles.toolbarOuter}>
        <TouchableOpacity style={styles.addMediaBtn} disabled={disabled}>
          <ImagePlus color="#71717a" size={22} />
          <Text style={styles.addMediaText}>Add Media</Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {images.map((img, i) => (
              <View key={img.key || i} style={styles.imageThumbOuter}>
                <Image source={{ uri: img.url }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(i)}>
                  <X color="#ffffff" size={12} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.toolbarBottom}>
        <View style={styles.toolbarLeft}>
          <TouchableOpacity style={styles.toolIconBtn} onPress={() => setShowEmoji(true)} disabled={disabled}>
            <Smile color="#71717a" size={20} />
          </TouchableOpacity>
          {showAIAssistant && (
            <TouchableOpacity style={styles.aiBtn} onPress={onAIAssistantClick} disabled={disabled}>
              <Sparkles color="#84cc16" size={16} />
              <Text style={styles.aiBtnText}>AI Assistant</Text>
            </TouchableOpacity>
          )}
        </View>
        {renderToolbarRight}
      </View>

      <Modal visible={showEmoji} transparent animationType="slide">
        <View style={styles.emojiOverlay}>
          <View style={styles.emojiPanel}>
            <View style={styles.emojiHeader}>
              <Text style={styles.emojiTitle}>Emoji</Text>
              <TouchableOpacity onPress={() => setShowEmoji(false)}>
                <X color="#71717a" size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((emoji, i) => (
                <TouchableOpacity key={i} style={styles.emojiItem} onPress={() => insertEmoji(emoji)}>
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  textarea: { fontSize: 15, color: "#09090b", lineHeight: 22, padding: 0 },
  toolbarOuter: { marginTop: 12 },
  addMediaBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: "#d4d4d8" },
  addMediaText: { fontSize: 12, fontWeight: "600", color: "#71717a" },
  imagesRow: { marginTop: 8 },
  imageThumbOuter: { position: "relative", marginRight: 8 },
  imageThumb: { width: 80, height: 80, borderRadius: 10 },
  imageRemoveBtn: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12, padding: 3 },
  toolbarBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f4f4f5" },
  toolbarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  toolIconBtn: { padding: 6, borderRadius: 8 },
  aiBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f4f5f0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  aiBtnText: { fontSize: 11, fontWeight: "700", color: "#4d7c0f" },
  emojiOverlay: { flex: 1, backgroundColor: "rgba(9,9,11,0.4)", justifyContent: "flex-end" },
  emojiPanel: { backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "60%" },
  emojiHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  emojiTitle: { fontSize: 16, fontWeight: "700", color: "#09090b" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  emojiItem: { padding: 8 },
})

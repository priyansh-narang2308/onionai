import React from "react"
import { View, Text, Image } from "react-native"
import { Globe, MessageCircle, Repeat2, ThumbsUp } from "lucide-react-native"
import { ImageObject } from "../../types/post.type"

type Props = { content: string; images?: ImageObject[] }

export function LinkedInPreview({ content, images = [] }: Props) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e4e4e7", backgroundColor: "#ffffff", padding: 16, maxWidth: 360 }}>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
        <View style={{ width: 48, height: 48, borderRadius: 6, backgroundColor: "#e4e4e7" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#09090b" }}>Your Name</Text>
          <Text style={{ fontSize: 12, color: "#71717a" }}>Title at Company</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Text style={{ fontSize: 11, color: "#71717a" }}>1h ago</Text>
            <Globe color="#71717a" size={12} />
          </View>
        </View>
      </View>
      <Text style={{ fontSize: 14, color: "#09090b", lineHeight: 20 }}>{content}</Text>
      {images.length > 0 && (
        <View style={{ marginTop: 12, borderRadius: 8, overflow: "hidden" }}>
          <Image source={{ uri: images[0].url }} style={{ width: "100%", height: 180 }} />
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 32, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f4f4f5" }}>
        {[ThumbsUp, MessageCircle, Repeat2].map((Icon, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon color="#0a66c2" size={18} />
            <Text style={{ fontSize: 13, color: "#71717a" }}>{["42", "7", "3"][i]}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

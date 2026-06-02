import React from "react"
import { View, Text, Image } from "react-native"
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react-native"
import { ImageObject } from "../../types/post.type"

type Props = { content: string; images?: ImageObject[] }

export function FacebookPreview({ content, images = [] }: Props) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e4e4e7", backgroundColor: "#ffffff", padding: 16, maxWidth: 360 }}>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#1877f2", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "700" }}>Y</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#09090b" }}>Your Name</Text>
          <Text style={{ fontSize: 11, color: "#71717a" }}>1h ago</Text>
        </View>
      </View>
      <Text style={{ fontSize: 15, color: "#09090b", lineHeight: 20 }}>{content}</Text>
      {images.length > 0 && (
        <View style={{ marginTop: 12, borderRadius: 8, overflow: "hidden" }}>
          <Image source={{ uri: images[0].url }} style={{ width: "100%", height: 200 }} />
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 48, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f4f4f5" }}>
        {[ThumbsUp, MessageCircle, Share2].map((Icon, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon color="#71717a" size={18} />
            <Text style={{ fontSize: 13, color: "#71717a" }}>{["42", "7", "3"][i]}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

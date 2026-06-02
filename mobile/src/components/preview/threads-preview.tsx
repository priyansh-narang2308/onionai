import React from "react"
import { View, Text, Image } from "react-native"
import { Heart, MessageCircle, Repeat2, Send } from "lucide-react-native"
import { ImageObject } from "../../types/post.type"

type Props = { content: string; images?: ImageObject[] }

export function ThreadsPreview({ content, images = [] }: Props) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e4e4e7", backgroundColor: "#ffffff", padding: 16, maxWidth: 340 }}>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#e4e4e7" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#09090b" }}>username</Text>
          <Text style={{ fontSize: 12, color: "#71717a" }}>1h ago</Text>
        </View>
      </View>
      <Text style={{ fontSize: 15, color: "#09090b", lineHeight: 21 }}>{content}</Text>
      {images.length > 0 && (
        <View style={{ marginTop: 10, borderRadius: 12, overflow: "hidden" }}>
          <Image source={{ uri: images[0].url }} style={{ width: "100%", height: 200 }} />
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 40, marginTop: 12 }}>
        {[Heart, MessageCircle, Repeat2, Send].map((Icon, i) => (
          <Icon key={i} color="#71717a" size={20} />
        ))}
      </View>
    </View>
  )
}

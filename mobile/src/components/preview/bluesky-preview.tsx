import React from "react"
import { View, Text, Image } from "react-native"
import { Heart, MessageCircle, Repeat2 } from "lucide-react-native"
import { ImageObject } from "../../types/post.type"

type Props = { content: string; images?: ImageObject[] }

export function BlueskyPreview({ content, images = [] }: Props) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e4e4e7", backgroundColor: "#ffffff", padding: 16, maxWidth: 340 }}>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#1185fe", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "700" }}>Y</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#09090b" }}>Your Name</Text>
          <Text style={{ fontSize: 12, color: "#71717a" }}>@username.bsky.social</Text>
        </View>
      </View>
      <Text style={{ fontSize: 15, color: "#09090b", lineHeight: 21 }}>{content}</Text>
      {images.length > 0 && (
        <View style={{ marginTop: 10, borderRadius: 12, overflow: "hidden" }}>
          <Image source={{ uri: images[0].url }} style={{ width: "100%", height: 200 }} />
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 40, marginTop: 12 }}>
        {[Heart, Repeat2, MessageCircle].map((Icon, i) => (
          <Icon key={i} color="#1185fe" size={20} />
        ))}
      </View>
    </View>
  )
}

import React from "react"
import { View, Text, Image } from "react-native"
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react-native"
import { ImageObject } from "../../types/post.type"

type Props = { content: string; images?: ImageObject[] }

export function InstagramPreview({ content, images = [] }: Props) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e4e4e7", backgroundColor: "#ffffff", maxWidth: 320 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#e1306c", alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#e4e4e7" }} />
          </View>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#09090b" }}>your_name</Text>
        </View>
        <MoreHorizontal color="#09090b" size={20} />
      </View>
      {images.length > 0 ? (
        <Image source={{ uri: images[0].url }} style={{ width: "100%", height: 220 }} />
      ) : (
        <View style={{ width: "100%", height: 220, backgroundColor: "#f4f4f5" }} />
      )}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: "row", gap: 16 }}>
          {[Heart, MessageCircle, Bookmark].map((Icon, i) => (
            <Icon key={i} color="#09090b" size={22} />
          ))}
        </View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#09090b", marginTop: 8 }}>128 likes</Text>
        <Text style={{ fontSize: 13, color: "#09090b" }} numberOfLines={2}>
          <Text style={{ fontWeight: "600" }}>your_name</Text> {content}
        </Text>
      </View>
    </View>
  )
}

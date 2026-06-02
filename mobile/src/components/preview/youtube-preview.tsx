import React from "react"
import { View, Text, Image } from "react-native"
import { ThumbsUp, MessageCircle, Eye, Clock } from "lucide-react-native"

type Props = { content: string }

export function YouTubePreview({ content }: Props) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#e4e4e7", backgroundColor: "#ffffff", maxWidth: 360 }}>
      <View style={{ width: "100%", height: 180, backgroundColor: "#e4e4e7", borderTopLeftRadius: 15, borderTopRightRadius: 15, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 0, height: 0, borderLeftWidth: 14, borderLeftColor: "#ffffff", borderTopWidth: 8, borderTopColor: "transparent", borderBottomWidth: 8, borderBottomColor: "transparent", marginLeft: 3 }} />
        </View>
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#09090b" }}>{content}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
          <Text style={{ fontSize: 12, color: "#71717a" }}>Your Channel</Text>
          <Text style={{ fontSize: 12, color: "#71717a" }}>·</Text>
          <Text style={{ fontSize: 12, color: "#71717a" }}>1.2K views</Text>
          <Text style={{ fontSize: 12, color: "#71717a" }}>·</Text>
          <Clock color="#71717a" size={12} />
          <Text style={{ fontSize: 12, color: "#71717a" }}>1 hour ago</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
          {[ThumbsUp, MessageCircle, Eye].map((Icon, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon color="#71717a" size={16} />
              <Text style={{ fontSize: 12, color: "#71717a" }}>{["42", "7", "1.2K"][i]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

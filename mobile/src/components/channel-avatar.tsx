import React from "react"
import { View, Text, Image } from "react-native"
import { getChannelInfo } from "../constants/channels"

type Props = {
  type: string
  color: string
  profileImage?: string | null
  name?: string | null
  size?: "sm" | "md"
}

export function ChannelAvatar({ type, color, profileImage, name, size = "md" }: Props) {
  const dim = size === "sm" ? 32 : 40
  const badgeDim = size === "sm" ? 15 : 20
  const channel = getChannelInfo(type)
  const initials = type?.substring(0, 2).toUpperCase() || "ON"

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: dim, height: dim, borderRadius: dim / 2, borderWidth: 1, borderColor: "#e4e4e7", overflow: "visible" }}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={{ width: dim, height: dim, borderRadius: dim / 2 }} />
        ) : (
          <View style={{ width: dim, height: dim, borderRadius: dim / 2, backgroundColor: color || "#09090b", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: size === "sm" ? 10 : 12 }}>{initials}</Text>
          </View>
        )}
        <View style={{
          position: "absolute", right: -3, bottom: -3,
          width: badgeDim, height: badgeDim, borderRadius: 3,
          backgroundColor: "#ffffff", padding: 1,
          alignItems: "center", justifyContent: "center",
        }}>
          <View style={{ flex: 1, width: "100%", borderRadius: 2, backgroundColor: color || "#09090b", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#ffffff", fontSize: 8, fontWeight: "800" }}>{initials}</Text>
          </View>
        </View>
      </View>
      {name ? <Text style={{ fontSize: 14, fontWeight: "500", color: "#09090b" }}>{name}</Text> : null}
    </View>
  )
}

import React from "react"
import { View, Text } from "react-native"

export function Logo({ hideName = false }: { hideName?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: "#09090b", alignItems: "center", justifyContent: "center",
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
      }}>
        <View style={{ width: 24, height: 24, borderRadius: 10, backgroundColor: "#84cc16", transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 18, height: 18, borderRadius: 8, borderWidth: 2, borderColor: "#a3e635", transform: [{ rotate: "45deg" }] }} />
        </View>
      </View>
      {!hideName && (
        <Text style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
          <Text style={{ color: "#09090b" }}>onion</Text>
          <Text style={{ color: "#84cc16" }}>.ai</Text>
        </Text>
      )}
    </View>
  )
}

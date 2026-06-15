import React, { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView } from "react-native"
import { CalendarDays, List, Filter } from "lucide-react-native"
import { CHANNEL_PLATFORMS } from "../../constants/channels"
import { PostStatus } from "../../types/post.type"

const STATUS_OPTIONS: { label: string; value: PostStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Queue", value: "queue" },
  { label: "Published", value: "published" },
  { label: "Failed", value: "failed" },
]

type Props = {
  selectedStatus: PostStatus | "all"
  onStatusChange: (status: PostStatus | "all") => void
  selectedChannels: string[]
  onChannelsChange: (channels: string[]) => void
  viewMode: "calendar" | "list"
  onViewModeChange: (mode: "calendar" | "list") => void
}

export function ScheduleToolbar({
  selectedStatus, onStatusChange,
  selectedChannels, onChannelsChange,
  viewMode, onViewModeChange,
}: Props) {
  const [showChannels, setShowChannels] = useState(false)
  const platforms = CHANNEL_PLATFORMS

  const toggleChannel = (type: string) => {
    onChannelsChange(
      selectedChannels.includes(type)
        ? selectedChannels.filter(c => c !== type)
        : [...selectedChannels, type]
    )
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {STATUS_OPTIONS.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            onPress={() => onStatusChange(value)}
            style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
              backgroundColor: selectedStatus === value ? "#09090b" : "#ffffff",
              borderWidth: 1, borderColor: "#e4e4e7",
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: "600",
              color: selectedStatus === value ? "#ffffff" : "#71717a",
            }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* View mode and channel filter */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TouchableOpacity
          onPress={() => setShowChannels(!showChannels)}
          style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
            backgroundColor: selectedChannels.length > 0 ? "#f0fdf4" : "#f4f4f5",
          }}
        >
          <Filter color={selectedChannels.length > 0 ? "#84cc16" : "#71717a"} size={16} />
          <Text style={{
            fontSize: 13, fontWeight: "600",
            color: selectedChannels.length > 0 ? "#4d7c0f" : "#71717a",
          }}>
            {selectedChannels.length > 0 ? `${selectedChannels.length} channels` : "All Channels"}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: "row", backgroundColor: "#f4f4f5", borderRadius: 10, padding: 3 }}>
          <TouchableOpacity
            onPress={() => onViewModeChange("calendar")}
            style={{
              padding: 8, borderRadius: 8,
              backgroundColor: viewMode === "calendar" ? "#ffffff" : "transparent",
            }}
          >
            <CalendarDays color={viewMode === "calendar" ? "#09090b" : "#71717a"} size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onViewModeChange("list")}
            style={{
              padding: 8, borderRadius: 8,
              backgroundColor: viewMode === "list" ? "#ffffff" : "transparent",
            }}
          >
            <List color={viewMode === "list" ? "#09090b" : "#71717a"} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Channel filter popover */}
      {showChannels && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {platforms.map((p) => (
            <TouchableOpacity
              key={p.type}
              onPress={() => toggleChannel(p.type)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                backgroundColor: selectedChannels.includes(p.type) ? p.color + "20" : "#f4f4f5",
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.color }} />
              <Text style={{
                fontSize: 11, fontWeight: "600",
                color: selectedChannels.includes(p.type) ? p.color : "#71717a",
              }}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

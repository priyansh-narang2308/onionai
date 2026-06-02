import React from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { Clock, CheckCircle2, XCircle } from "lucide-react-native"
import { Post, PostStatus } from "../../types/post.type"
import { getChannelInfo } from "../../constants/channels"

type Props = {
  posts: Post[]
  onSelectPost: (post: Post) => void
  selectedStatus: PostStatus | "all"
}

const STATUS_CONFIG: Record<PostStatus | "all", { bg: string; color: string; icon: React.ElementType }> = {
  draft: { bg: "#f4f4f5", color: "#71717a", icon: Clock },
  queue: { bg: "#fef9c3", color: "#a16207", icon: Clock },
  published: { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle2 },
  failed: { bg: "#fef2f2", color: "#ef4444", icon: XCircle },
  all: { bg: "#f4f4f5", color: "#71717a", icon: Clock },
}

export function ListView({ posts, onSelectPost, selectedStatus }: Props) {
  if (posts.length === 0) {
    return (
      <View style={{ padding: 32, alignItems: "center", backgroundColor: "#fafafa", borderRadius: 16 }}>
        <Text style={{ fontSize: 14, color: "#a1a1aa", textAlign: "center" }}>
          No {selectedStatus !== "all" ? `${selectedStatus} ` : ""}posts found
        </Text>
      </View>
    )
  }

  return (
    <View style={{ gap: 8 }}>
      {posts.map((post) => {
        const config = STATUS_CONFIG[post.status]
        const Icon = config?.icon || Clock

        return (
          <TouchableOpacity
            key={post.id}
            onPress={() => onSelectPost(post)}
            style={{
              backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1,
              borderColor: "#f4f4f5", padding: 16,
              borderLeftWidth: 3, borderLeftColor: config?.color || "#a1a1aa",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: config?.bg || "#f4f4f5", alignItems: "center", justifyContent: "center" }}>
                <Icon color={config?.color || "#71717a"} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: "#09090b", lineHeight: 20 }} numberOfLines={3}>{post.content}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: config?.color || "#71717a", textTransform: "capitalize" }}>{post.status}</Text>
                  {post.channels?.map(ch => (
                    <View key={ch} style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: getChannelInfo(ch)?.color + "20" }}>
                      <Text style={{ fontSize: 9, fontWeight: "700", color: getChannelInfo(ch)?.color }}>{getChannelInfo(ch)?.name}</Text>
                    </View>
                  ))}
                  {post.scheduled_at && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                      <Clock color="#a1a1aa" size={12} />
                      <Text style={{ fontSize: 11, color: "#a1a1aa" }}>
                        {new Date(post.scheduled_at).toLocaleDateString()} {post.scheduled_at.substring(11, 16)}
                      </Text>
                    </View>
                  )}
                  {post.published_at && (
                    <Text style={{ fontSize: 11, color: "#a1a1aa", marginLeft: "auto" }}>
                      {new Date(post.published_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

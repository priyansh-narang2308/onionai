import React from "react"
import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { TwitterPreview } from "./twitter-preview"
import { LinkedInPreview } from "./linkedin-preview"
import { InstagramPreview } from "./instagram-preview"
import { FacebookPreview } from "./facebook-preview"
import { ThreadsPreview } from "./threads-preview"
import { BlueskyPreview } from "./bluesky-preview"
import { YouTubePreview } from "./youtube-preview"
import { ImageObject } from "../../types/post.type"

const previewMap: Record<string, { label: string; Component: React.ComponentType<any> }> = {
  twitter: { label: "X / Twitter", Component: TwitterPreview },
  linkedin: { label: "LinkedIn", Component: LinkedInPreview },
  instagram: { label: "Instagram", Component: InstagramPreview },
  facebook: { label: "Facebook", Component: FacebookPreview },
  threads: { label: "Threads", Component: ThreadsPreview },
  bluesky: { label: "Bluesky", Component: BlueskyPreview },
  youtube: { label: "YouTube", Component: YouTubePreview },
}

type Props = {
  content: string
  images?: ImageObject[]
  selectedChannels: string[]
}

export function PreviewPanel({ content, images, selectedChannels }: Props) {
  const channels = selectedChannels.length > 0 ? selectedChannels : Object.keys(previewMap)

  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#09090b", marginBottom: 12 }}>
        Previews ({channels.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
        {channels.map((ch) => {
          const info = previewMap[ch]
          if (!info) return null
          const { Component } = info
          return (
            <View key={ch} style={{ minWidth: 300 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", textTransform: "uppercase", marginBottom: 8 }}>{info.label}</Text>
              <Component content={content} images={images} />
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

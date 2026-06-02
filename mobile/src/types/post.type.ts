import { ChannelType } from "./channel.type"

export type ImageObject = {
  url: string
  key: string
}

export type PostType = {
  id: string
  content: string
  images?: ImageObject[]
  scheduled_at: string
  status: string
  published_url?: string | null
  user_channel_id?: string | null
  user_channels?: {
    id: string
    handle?: string | null
    profile_image?: string | null
    profile_url?: string | null
    channel_type_id?: string
    provider_account_id?: string | null
    channel_types?: ChannelType
  }
  created_at: string
  updated_at: string
}

export type CalendarPostType = {
  id: string
  content: string
  images: ImageObject[]
  scheduledAt: Date
  status: "queue" | "draft" | "published"
  user_channel_id: string
  channel_types: ChannelType
}

import { PostStatus } from "../constants/post"

export type { PostStatus } from "../constants/post"

export type Post = {
  id: string
  content: string
  images?: ImageObject[]
  scheduled_at?: string
  published_at?: string
  status: PostStatus
  channels?: string[]
  schedule_date?: string
  schedule_time?: string
}

export enum ChannelTypeEnum {
  TWITTER = "TWITTER",
  INSTAGRAM = "INSTAGRAM",
  THREADS = "THREADS",
  FACEBOOK = "FACEBOOK",
  LINKEDIN = "LINKEDIN",
  BLUESKY = "BLUESKY",
  YOUTUBE = "YOUTUBE",
  TIKTOK = "TIKTOK"
}

export const CHANNEL_PLATFORMS = [
  { type: ChannelTypeEnum.TWITTER, name: "X / Twitter", color: "#000000", character_limit: 280 },
  { type: ChannelTypeEnum.LINKEDIN, name: "LinkedIn", color: "#0A66C2", character_limit: 3000 },
  { type: ChannelTypeEnum.INSTAGRAM, name: "Instagram", color: "#E4405F", character_limit: 2200 },
  { type: ChannelTypeEnum.THREADS, name: "Threads", color: "#000000", character_limit: 500 },
  { type: ChannelTypeEnum.FACEBOOK, name: "Facebook", color: "#1877F2", character_limit: 63206 },
  { type: ChannelTypeEnum.BLUESKY, name: "Bluesky", color: "#0085FF", character_limit: 300 },
  { type: ChannelTypeEnum.YOUTUBE, name: "YouTube", color: "#FF0000", character_limit: 100 },
  { type: ChannelTypeEnum.TIKTOK, name: "TikTok", color: "#000000", character_limit: 100 },
]

export function getChannelInfo(type: string | undefined) {
  if (!type) return CHANNEL_PLATFORMS[0]
  return CHANNEL_PLATFORMS.find(c => c.type === type) || CHANNEL_PLATFORMS[0]
}

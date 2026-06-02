export type ImageObject = {
  url: string
  key: string
}

export type IdeaType = {
  id?: string
  title: string
  description?: string
  tags?: string[]
  images?: ImageObject[]
  columnId?: string
  sortOrder?: number
}

export type Idea = {
  id: string
  content: string
  group: string
  created_at: string
  tags?: string[]
  images?: ImageObject[]
  status?: string
}

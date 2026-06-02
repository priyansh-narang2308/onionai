import React, { useState, useMemo } from "react"
import { View, Text, TouchableOpacity, ScrollView } from "react-native"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from "date-fns"
import { Post, PostStatus } from "../../types/post.type"
import { getChannelInfo } from "../../constants/channels"

type Props = {
  posts: Post[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
  onSelectPost: (post: Post) => void
}

const STATUS_BG: Record<PostStatus | "all", string> = {
  draft: "#f4f4f5",
  queue: "#fef9c3",
  published: "#f0fdf4",
  failed: "#fef2f2",
  all: "#f4f4f5",
}
const STATUS_DOT: Record<PostStatus | "all", string> = {
  draft: "#a1a1aa",
  queue: "#eab308",
  published: "#22c55e",
  failed: "#ef4444",
  all: "#a1a1aa",
}

export function CalendarView({ posts, selectedDate, onSelectDate, onSelectPost }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const startDayOfWeek = getDay(startOfMonth(currentMonth))
  const emptyStart = Array(startDayOfWeek).fill(null)

  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {}
    posts.forEach((post) => {
      const dateKey = post.scheduled_at
        ? post.scheduled_at.substring(0, 10)
        : post.published_at
          ? post.published_at.substring(0, 10)
          : ""
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = []
        map[dateKey].push(post)
      }
    })
    return map
  }, [posts])

  const getPostsForDay = (day: Date) => {
    const key = format(day, "yyyy-MM-dd")
    return postsByDate[key] || []
  }

  return (
    <View>
      {/* Month header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ padding: 8, borderRadius: 10, backgroundColor: "#f4f4f5" }}>
          <ChevronLeft color="#09090b" size={20} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#09090b" }}>
          {format(currentMonth, "MMMM yyyy")}
        </Text>
        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ padding: 8, borderRadius: 10, backgroundColor: "#f4f4f5" }}>
          <ChevronRight color="#09090b" size={20} />
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        {dayNames.map((name) => (
          <View key={name} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#a1a1aa" }}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {emptyStart.map((_, i) => (
          <View key={`empty-${i}`} style={{ width: "14.28%", aspectRatio: 1 }} />
        ))}
        {days.map((day) => {
          const dayPosts = getPostsForDay(day)
          const isSelected = selectedDate === format(day, "yyyy-MM-dd")
          const isCurrentDay = isToday(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)

          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => onSelectDate(isSelected ? null : format(day, "yyyy-MM-dd"))}
              style={{
                width: "14.28%", aspectRatio: 1, padding: 2,
                opacity: isCurrentMonth ? 1 : 0.4,
              }}
            >
              <View style={{
                flex: 1, borderRadius: 12, padding: 4,
                backgroundColor: isSelected ? "#09090b" : isCurrentDay ? "#f4f4f5" : "transparent",
                borderWidth: isCurrentDay && !isSelected ? 1 : 0,
                borderColor: "#e4e4e7",
                justifyContent: "flex-start", alignItems: "center",
              }}>
                <Text style={{
                  fontSize: 13, fontWeight: isSelected || isCurrentDay ? "700" : "500",
                  color: isSelected ? "#ffffff" : isCurrentDay ? "#09090b" : "#71717a",
                }}>
                  {format(day, "d")}
                </Text>
                {dayPosts.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginTop: 2, justifyContent: "center" }}>
                    {dayPosts.slice(0, 3).map((post, i) => (
                      <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: STATUS_DOT[post.status] || STATUS_DOT.all }} />
                    ))}
                    {dayPosts.length > 3 && (
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#a1a1aa" }} />
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Posts for selected date */}
      {selectedDate && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#09090b", marginBottom: 8 }}>
            {format(parseISO(selectedDate), "MMMM d, yyyy")}
          </Text>
          <View style={{ gap: 8 }}>
            {getPostsForDay(parseISO(selectedDate)).length === 0 ? (
              <Text style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 20 }}>
                No posts scheduled for this date
              </Text>
            ) : (
              getPostsForDay(parseISO(selectedDate)).map((post) => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => onSelectPost(post)}
                  style={{ backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#f4f4f5", padding: 14 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: STATUS_DOT[post.status] || STATUS_DOT.all,
                    }} />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717a", textTransform: "capitalize" }}>{post.status}</Text>
                    {post.channels?.slice(0, 3).map(ch => (
                      <View key={ch} style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: getChannelInfo(ch)?.color + "20" }}>
                        <Text style={{ fontSize: 9, fontWeight: "700", color: getChannelInfo(ch)?.color }}>{getChannelInfo(ch)?.name}</Text>
                      </View>
                    ))}
                    {post.scheduled_at && (
                      <Text style={{ fontSize: 11, color: "#a1a1aa", marginLeft: "auto" }}>
                        {post.scheduled_at.substring(11, 16)}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: "#09090b" }} numberOfLines={2}>{post.content}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      )}
    </View>
  )
}

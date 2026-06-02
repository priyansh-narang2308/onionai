import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addDays } from "date-fns"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react-native"

type Props = {
  date: Date
  onDateChange: (date: Date) => void
  onTimeChange: (time: string) => void
  time: string
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? "00" : "30"
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${ampm}`
})

export function DatePicker({ date, onDateChange, onTimeChange, time }: Props) {
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(date))

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDay = getDay(startOfMonth(currentMonth))

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const today = new Date()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <ChevronLeft color="#71717a" size={20} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(currentMonth, "MMMM yyyy")}</Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <ChevronRight color="#71717a" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <Text key={i} style={styles.weekdayText}>{d}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {Array.from({ length: startDay }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}
        {days.map((day) => {
          const isSelected = isSameDay(day, date)
          const isToday = isSameDay(day, today)
          const isPast = day < today && !isToday
          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => !isPast && onDateChange(day)}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && styles.dayCellToday,
                isPast && styles.dayCellPast,
              ]}
              disabled={isPast}
            >
              <Text style={[
                styles.dayText,
                isSelected && styles.dayTextSelected,
                isToday && styles.dayTextToday,
                isPast && styles.dayTextPast,
              ]}>
                {format(day, "d")}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
        <Clock color="#84cc16" size={16} />
        <Text style={styles.timeButtonText}>{time || "Select time"}</Text>
      </TouchableOpacity>

      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.timeModalOverlay}>
          <View style={styles.timeModal}>
            <View style={styles.timeModalHeader}>
              <Text style={styles.timeModalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.timeModalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.timeList}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlot, time === slot && styles.timeSlotSelected]}
                  onPress={() => { onTimeChange(slot); setShowTimePicker(false) }}
                >
                  <Text style={[styles.timeSlotText, time === slot && styles.timeSlotTextSelected]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#e4e4e7" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  monthText: { fontSize: 16, fontWeight: "700", color: "#09090b" },
  weekdayRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8 },
  weekdayText: { fontSize: 11, fontWeight: "700", color: "#a1a1aa", width: "13%", textAlign: "center" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 6 },
  dayCell: { width: "13%", height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  dayCellSelected: { backgroundColor: "#84cc16" },
  dayCellToday: { borderWidth: 1, borderColor: "#84cc16" },
  dayCellPast: { opacity: 0.3 },
  dayText: { fontSize: 13, fontWeight: "600", color: "#09090b" },
  dayTextSelected: { color: "#ffffff" },
  dayTextToday: { color: "#84cc16", fontWeight: "700" },
  dayTextPast: { color: "#cbd5e1" },
  timeButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, paddingVertical: 10, backgroundColor: "#f4f5f0", borderRadius: 12, borderWidth: 1, borderColor: "#e4e6d9" },
  timeButtonText: { fontSize: 13, fontWeight: "700", color: "#4d7c0f" },
  timeModalOverlay: { flex: 1, backgroundColor: "rgba(9,9,11,0.4)", justifyContent: "flex-end" },
  timeModal: { backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "60%", paddingBottom: 40 },
  timeModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
  timeModalTitle: { fontSize: 16, fontWeight: "700", color: "#09090b" },
  timeModalDone: { fontSize: 14, fontWeight: "700", color: "#84cc16" },
  timeList: { paddingHorizontal: 20 },
  timeSlot: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginVertical: 2 },
  timeSlotSelected: { backgroundColor: "#f4f5f0" },
  timeSlotText: { fontSize: 14, color: "#09090b", fontWeight: "500" },
  timeSlotTextSelected: { color: "#84cc16", fontWeight: "700" },
})

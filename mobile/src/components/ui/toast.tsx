import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import { Animated, Text, View, StyleSheet } from "react-native"
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react-native"

type ToastType = "success" | "error" | "info"

type ToastItem = {
  id: string
  message: string
  type: ToastType
}

type ToastContextType = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t, i) => (
          <ToastItem key={t.id} item={t} onDismiss={dismiss} index={i} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

function ToastItem({ item, onDismiss, index }: { item: ToastItem; onDismiss: (id: string) => void; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start()
  }, [])

  const icon = item.type === "success" ? CheckCircle : item.type === "error" ? XCircle : AlertCircle
  const bgColor = item.type === "success" ? "#166534" : item.type === "error" ? "#991b1b" : "#1e3a5f"

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bgColor, opacity, transform: [{ translateY }], top: 60 + index * 60 },
      ]}
    >
      {React.createElement(icon, { color: "#ffffff", size: 18, strokeWidth: 2.5 })}
      <Text style={styles.toastText} numberOfLines={2}>{item.message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    minWidth: 200,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
})

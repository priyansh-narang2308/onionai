import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo"
import * as SecureStore from "expo-secure-store"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ToastProvider } from "../components/ui/toast"

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key)
      return item
    } catch {
      await SecureStore.deleteItemAsync(key)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch {
      return
    }
  },
}

const publishableKey = "pk_test_c3VyZS1nbnUtODguY2xlcmsuYWNjb3VudHMuZGV2JA"
const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#ffffff" },
                }}
              />
            </ToastProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  )
}

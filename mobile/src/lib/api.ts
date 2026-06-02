import { Platform } from "react-native"

const DEV_API_URL = "https://magnisonant-scoreless-terrance.ngrok-free.dev"
const PROD_API_URL = "https://onionai.vercel.app"

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  getToken?: (options?: { template?: string }) => Promise<string | null>
) {
  let token: string | null = null
  if (getToken) {
    token = await getToken({ template: "insforge" })
  }

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json"
  }

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorJson: any
    try {
      errorJson = JSON.parse(errorText)
    } catch (_) {}

    const message = errorJson?.error || errorJson?.message || `API Error: ${response.status}`
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

import React from "react";

export const API_BASE_URL = "https://magnisonant-scoreless-terrance.ngrok-free.dev";

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  getToken: (options?: { template?: string }) => Promise<string | null>
) {
  try {
    const token = await getToken({ template: "insforge" });
    
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Not JSON
      }
      throw new Error(errorJson?.error || errorJson?.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`fetchWithAuth error on ${endpoint}:`, error);
    throw error;
  }
}

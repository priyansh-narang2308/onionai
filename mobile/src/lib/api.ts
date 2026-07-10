const DEV_API_URL = "http://10.12.217.196:3000";

const PROD_API_URL = "https://m93g5tk4.insforge.site";

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  getToken?: (options?: { template?: string }) => Promise<string | null>,
) {
  let token: string | null = null;
  if (getToken) {
    try {
      // For communicating with our Next.js API, we must use the standard Clerk session token
      // Next.js will use this to identify the user via `auth()`, and then it will fetch
      // its own insforge template token to talk to the database.
      token = await getToken();
    } catch (e) {
      console.error("Failed to fetch standard session token", e);
    }
  }

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      redirect: "manual", // Don't follow redirects — catch Clerk's 307
    });
  } catch {
    throw new Error(
      `Network error: Unable to reach server at ${API_BASE_URL}. Make sure the Next.js dev server is running.`,
    );
  }

  // Handle Clerk redirect (307 to sign-in page)
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location") || "";
    if (location.includes("sign-in")) {
      throw new Error("Session expired. Please sign in again.");
    }
    throw new Error(`Unexpected redirect (${response.status}) to: ${location}`);
  }

  if (response.status === 204) return null;

  // Read the body as text first, then try to parse as JSON
  const bodyText = await response.text();

  // Guard against HTML responses (Clerk error pages, Next.js error pages)
  if (
    bodyText.startsWith("<!DOCTYPE") ||
    bodyText.startsWith("<html") ||
    bodyText.startsWith("<!")
  ) {
    throw new Error(
      `Server returned HTML instead of JSON (status ${response.status}). The API may be misconfigured or the server is restarting.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    throw new Error(
      `Invalid JSON response (status ${response.status}): ${bodyText.substring(0, 120)}`,
    );
  }

  if (!response.ok) {
    const errObj = parsed as Record<string, unknown> | null;
    const message =
      (errObj?.error as string) ||
      (errObj?.message as string) ||
      `API Error: ${response.status}`;
    throw new Error(message);
  }

  return parsed;
}

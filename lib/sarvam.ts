export async function translateToIndianLanguage(text: string, targetLang: string): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SARVAM_API_KEY configuration");
  }

  const response = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      input: text,
      source_language_code: "en-IN",
      target_language_code: targetLang,
      speaker_gender: "MALE", // Default, could also be FEMALE
      mode: "formal", // formal | colloquial
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam Translate API returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.translated_text || "";
}

export async function sarvamChatCompletion(messages: any[]): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SARVAM_API_KEY configuration");
  }

  const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sarvam-2b-v0.5", // Fast, lightweight multilingual model or sarvam-30b
      messages,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam completions API returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

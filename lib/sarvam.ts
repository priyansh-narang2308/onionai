/* eslint-disable @typescript-eslint/no-explicit-any */
export async function translateToIndianLanguage(
  text: string,
  targetLang: string,
): Promise<string> {
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
      speaker_gender: "Male", // Default, could also be "Female"
      mode: "formal", // formal | colloquial
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Sarvam Translate API returned status ${response.status}: ${errorText}`,
    );
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
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sarvam-2b-v0.5", // Fast, lightweight multilingual model or sarvam-30b
      messages,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Sarvam completions API returned status ${response.status}: ${errorText}`,
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function generateSpeechFromText(
  text: string,
  targetLang: string = "en-IN",
  speaker: string = "meera",
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SARVAM_API_KEY configuration");
  }
  const cleanText = text.substring(0, 480);

  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      inputs: [cleanText],
      target_language_code: targetLang,
      speaker: speaker, // meera, pavithra, maitreyi, arvind, amartya, diya
      pitch: 0,
      pace: 1.0,
      loudness: 1.5,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: "bulbul:v1",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Sarvam TTS API returned status ${response.status}: ${errorText}`,
    );
  }

  const data = await response.json();
  if (!data.audios || data.audios.length === 0) {
    throw new Error("No audio returned from Sarvam Bulbul API");
  }
  return data.audios[0];
}

export async function transcribeSpeech(
  audioBuffer: ArrayBuffer | Buffer,
  mimeType: string = "audio/webm",
  filename: string = "recording.webm",
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SARVAM_API_KEY configuration");
  }

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append("file", blob, filename);
  formData.append("model", "saarika:v1");
  formData.append("language_code", "unknown");

  const response = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Sarvam STT API returned status ${response.status}: ${errorText}`,
    );
  }

  const data = await response.json();
  return data.transcript || "";
}

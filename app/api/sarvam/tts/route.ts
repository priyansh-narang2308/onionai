/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generateSpeechFromText } from "@/lib/sarvam";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, targetLanguage = "hi-IN", speaker = "meera" } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Missing text content for voiceover" },
        { status: 400 },
      );
    }

    if (!process.env.SARVAM_API_KEY) {
      return NextResponse.json(
        { error: "SARVAM_API_KEY is not configured in server environment" },
        { status: 503 },
      );
    }

    const base64Audio = await generateSpeechFromText(
      text.trim(),
      targetLanguage,
      speaker,
    );

    return NextResponse.json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
    });
  } catch (error: any) {
    console.error("Error in Sarvam TTS API route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI voiceover" },
      { status: 500 },
    );
  }
}

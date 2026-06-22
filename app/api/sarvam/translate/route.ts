import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { translateToIndianLanguage } from "@/lib/sarvam";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, targetLanguage } = await request.json();
    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Missing text or targetLanguage" }, { status: 400 });
    }

    // Check if key is configured, if not, return fallback warning
    if (!process.env.SARVAM_API_KEY) {
      console.warn("SARVAM_API_KEY is not defined in env. Returning simulated translation.");
      return NextResponse.json({
        translatedText: `[Translation Fallback - Configure SARVAM_API_KEY to translate to ${targetLanguage}]:\n\n${text}`,
      });
    }

    const translatedText = await translateToIndianLanguage(text, targetLanguage);
    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Error in Sarvam translation API route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to translate text" },
      { status: 500 }
    );
  }
}

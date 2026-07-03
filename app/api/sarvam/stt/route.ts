/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { transcribeSpeech } from "@/lib/sarvam";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SARVAM_API_KEY) {
      return NextResponse.json(
        { error: "SARVAM_API_KEY is not configured in server environment" },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const transcript = await transcribeSpeech(
      buffer,
      file.type || "audio/webm",
      file.name || "recording.webm",
    );

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error("Error in Sarvam STT API route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe speech" },
      { status: 500 },
    );
  }
}

"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SarvamSTTWidgetProps {
  onTranscript: (transcript: string) => void;
}

export function SarvamSTTWidget({ onTranscript }: SarvamSTTWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAudioForTranscription(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.info("Recording voice note... Speak in English, Hindi, or any Indian dialect!");
    } catch (error) {
      console.error("Microphone access failed:", error);
      toast.error("Could not access microphone. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioForTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("file", blob, "voicenote.webm");

    try {
      const response = await fetch("/api/sarvam/stt", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to transcribe speech");
      }

      if (data.transcript) {
        onTranscript(data.transcript);
        toast.success("Voice note transcribed with Sarvam Saarika!");
      } else {
        toast.warning("Could not detect clear speech in the audio.");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong transcribing speech");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      className={`h-8 gap-1.5 text-xs transition-all duration-200 ${
        isRecording
          ? "animate-pulse bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
          : "border-lime-500/30 hover:border-lime-500 hover:bg-lime-500/10 text-lime-700 dark:text-lime-400"
      }`}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isTranscribing}
      title="Dictate voice note using Sarvam Saarika AI"
    >
      {isTranscribing ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Transcribing...
        </>
      ) : isRecording ? (
        <>
          <MicOff className="size-3.5" />
          Stop Recording
        </>
      ) : (
        <>
          <Mic className="size-3.5" />
          Voice Dictate (Sarvam AI)
        </>
      )}
    </Button>
  );
}

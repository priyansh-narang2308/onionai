"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Volume2,
  Loader2,
  Download,
  Play,
  Pause,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SarvamTTSWidgetProps {
  text: string;
}

const SPEAKERS = [
  { id: "meera", name: "Meera (Female - Warm)" },
  { id: "pavithra", name: "Pavithra (Female - Clear)" },
  { id: "maitreyi", name: "Maitreyi (Female - Expressive)" },
  { id: "arvind", name: "Arvind (Male - Professional)" },
  { id: "amartya", name: "Amartya (Male - Deep)" },
];

const LANGUAGES = [
  { code: "hi-IN", name: "Hindi" },
  { code: "en-IN", name: "Indian English" },
  { code: "ta-IN", name: "Tamil" },
  { code: "te-IN", name: "Telugu" },
  { code: "bn-IN", name: "Bengali" },
  { code: "mr-IN", name: "Marathi" },
];

export function SarvamTTSWidget({ text }: SarvamTTSWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [selectedLang, setSelectedLang] = useState("hi-IN");
  const [selectedSpeaker, setSelectedSpeaker] = useState("meera");

  const handleGenerateVoiceover = async () => {
    if (!text || !text.trim()) {
      toast.error("Please enter some text before generating AI voiceover");
      return;
    }

    setLoading(true);
    setAudioSrc(null);
    if (audioRef) {
      audioRef.pause();
    }

    try {
      const response = await fetch("/api/sarvam/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim().substring(0, 480),
          targetLanguage: selectedLang,
          speaker: selectedSpeaker,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI voiceover");
      }

      if (data.audioBase64) {
        const src = `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`;
        setAudioSrc(src);
        const audio = new Audio(src);
        audio.onended = () => setIsPlaying(false);
        setAudioRef(audio);
        toast.success("AI Voiceover generated with Sarvam Bulbul!");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Something went wrong generating speech");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef) return;
    if (isPlaying) {
      audioRef.pause();
      setIsPlaying(false);
    } else {
      audioRef.play();
      setIsPlaying(true);
    }
  };

  const downloadAudio = () => {
    if (!audioSrc) return;
    const link = document.createElement("a");
    link.href = audioSrc;
    link.download = `sarvam-voiceover-${selectedLang}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-linear-to-r from-lime-500/10 via-emerald-500/10 to-teal-500/10 rounded-xl border border-lime-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-lime-600 animate-pulse" />
          <span className="text-xs font-semibold text-lime-800 dark:text-lime-300">
            AI Studio Voiceover (Sarvam Bulbul)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                {LANGUAGES.find((l) => l.code === selectedLang)?.name ||
                  "Hindi"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className="text-xs cursor-pointer"
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                {
                  SPEAKERS.find((s) => s.id === selectedSpeaker)?.name.split(
                    " ",
                  )[0]
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {SPEAKERS.map((spk) => (
                <DropdownMenuItem
                  key={spk.id}
                  onClick={() => setSelectedSpeaker(spk.id)}
                  className="text-xs cursor-pointer"
                >
                  {spk.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            size="sm"
            className="h-7 bg-lime-600 hover:bg-lime-700 text-white text-xs gap-1.5 shadow-sm"
            onClick={handleGenerateVoiceover}
            disabled={loading || !text}
          >
            {loading ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Volume2 className="size-3" />
                Generate Audio
              </>
            )}
          </Button>
        </div>
      </div>

      {audioSrc && (
        <div className="flex items-center justify-between pt-2 border-t border-lime-500/20 mt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="size-8 rounded-full bg-lime-500 text-white hover:bg-lime-600"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4 ml-0.5" />
              )}
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              {isPlaying ? "Playing preview..." : "Voiceover ready"}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-lime-700 hover:text-lime-800 hover:bg-lime-500/10"
            onClick={downloadAudio}
          >
            <Download className="size-3.5" />
            Download WAV
          </Button>
        </div>
      )}
    </div>
  );
}

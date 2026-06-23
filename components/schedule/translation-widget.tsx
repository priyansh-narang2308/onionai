import React, { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "hi-IN", name: "Hindi (हिन्दी)" },
  { code: "ta-IN", name: "Tamil (தமிழ்)" },
  { code: "te-IN", name: "Telugu (తెలుగు)" },
  { code: "kn-IN", name: "Kannada (ಕನ್ನಡ)" },
  { code: "ml-IN", name: "Malayalam (മലയാളம்)" },
  { code: "mr-IN", name: "Marathi (मराठी)" },
  { code: "gu-IN", name: "Gujarati (ગુજરાતી)" },
  { code: "bn-IN", name: "Bengali (বাংলা)" },
  { code: "pa-IN", name: "Punjabi (ਪੰਜਾਬੀ)" },
];

interface TranslationWidgetProps {
  text: string;
  onTranslate: (translatedText: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TranslationWidget({
  text,
  onTranslate,
  disabled,
  className,
}: TranslationWidgetProps) {
  const [loading, setLoading] = useState(false);

  const handleTranslate = async (langCode: string, langName: string) => {
    if (!text.trim()) {
      toast.error("Please enter some text to translate");
      return;
    }

    setLoading(true);
    const promise = async () => {
      const response = await fetch("/api/sarvam/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          targetLanguage: langCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      onTranslate(data.translatedText);
      return data;
    };

    toast.promise(promise(), {
      loading: `Translating to ${langName}...`,
      success: `Translated to ${langName} successfully!`,
      error: `Failed to translate to ${langName}`,
    });

    try {
      await promise();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || loading || !text.trim()}
          className={className}
        >
          {loading ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Languages className="mr-2 h-3.5 w-3.5" />
          )}
          Translate
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-background/95 backdrop-blur-md border border-border/60"
      >
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleTranslate(lang.code, lang.name)}
            className="cursor-pointer text-xs"
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

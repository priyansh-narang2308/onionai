import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "@tanstack/react-query";
import { fetchWithAuth } from "../../lib/api";
import { Globe, X, CheckCircle } from "lucide-react-native";
import { useToast } from "../ui/toast";

interface TranslationWidgetProps {
  visible: boolean;
  onClose: () => void;
  content: string;
  onTranslate: (translatedContent: string, language: string) => void;
}

const LANGUAGES = [
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "bn", name: "Bengali" },
];

export function TranslationWidget({
  visible,
  onClose,
  content,
  onTranslate,
}: TranslationWidgetProps) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);

  const translateMutation = useMutation({
    mutationFn: async (language: string) => {
      const response = await fetchWithAuth(
        "/api/sarvam/translate",
        {
          method: "POST",
          body: JSON.stringify({
            text: content,
            targetLanguage: language,
          }),
        },
        getToken,
      );
      return response;
    },
    onSuccess: (data: any) => {
      setTranslatedResult(data.translatedText || data.translated_text);
      toast("Translation complete!");
    },
    onError: (error: any) => {
      toast(error.message || "Translation failed", "error");
    },
  });

  const handleTranslate = (language: string) => {
    setSelectedLanguage(language);
    translateMutation.mutate(language);
  };

  const handleUseTranslation = () => {
    if (translatedResult && selectedLanguage) {
      const langName = LANGUAGES.find((l) => l.code === selectedLanguage)?.name;
      onTranslate(translatedResult, langName || selectedLanguage);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Translate to Indian Languages</Text>
          <TouchableOpacity onPress={onClose}>
            <X color="#71717a" size={24} />
          </TouchableOpacity>
        </View>

        {!translatedResult ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Select Language</Text>
            <View style={styles.languageGrid}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    selectedLanguage === lang.code &&
                      styles.languageButtonActive,
                  ]}
                  onPress={() => handleTranslate(lang.code)}
                  disabled={translateMutation.isPending}
                >
                  {translateMutation.isPending &&
                    selectedLanguage === lang.code && (
                      <ActivityIndicator size="small" color="#84cc16" />
                    )}
                  {!translateMutation.isPending &&
                    selectedLanguage === lang.code && (
                      <CheckCircle color="#84cc16" size={16} />
                    )}
                  <Text
                    style={[
                      styles.languageButtonText,
                      selectedLanguage === lang.code &&
                        styles.languageButtonTextActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Translated Text</Text>
            <View style={styles.resultBox}>
              <ScrollView>
                <Text style={styles.resultText}>{translatedResult}</Text>
              </ScrollView>
            </View>
            <TouchableOpacity
              style={styles.useButton}
              onPress={handleUseTranslation}
            >
              <CheckCircle color="#ffffff" size={20} />
              <Text style={styles.useButtonText}>Use This Translation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setTranslatedResult(null);
                setSelectedLanguage(null);
              }}
            >
              <Text style={styles.backButtonText}>Try Another Language</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: "auto",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
    color: "#71717a",
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  languageButton: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  languageButtonActive: {
    borderColor: "#84cc16",
    backgroundColor: "#f0fdf4",
  },
  languageButtonText: {
    fontSize: 13,
    color: "#71717a",
    marginTop: 4,
  },
  languageButtonTextActive: {
    color: "#84cc16",
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#71717a",
  },
  resultBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 12,
    backgroundColor: "#fafafa",
    marginVertical: 12,
  },
  resultText: {
    fontSize: 14,
    color: "#1a1a1a",
    lineHeight: 20,
  },
  useButton: {
    flexDirection: "row",
    backgroundColor: "#84cc16",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  useButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
  },
  backButtonText: {
    color: "#71717a",
    fontWeight: "500",
    fontSize: 14,
  },
});

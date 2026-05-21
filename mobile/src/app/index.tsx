import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignIn, useSignUp, useOAuth, useAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";

// Complete OAuth session if redirected back
WebBrowser.maybeCompleteAuthSession();

type ScreenState = "onboarding" | "auth";

export default function Index() {
  const router = useRouter();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [screenState, setScreenState] = useState<ScreenState>("onboarding");
  const [onboardingIndex, setOnboardingIndex] = useState(0);

  // Auth Form States
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email verification state for new sign-ups
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeFocused, setCodeFocused] = useState(false);

  // Automatically redirect if already logged in
  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      router.replace("/(tabs)/ideas");
    }
  }, [isSignedIn, isAuthLoaded]);

  // Warm up standard browser to improve UX in OAuth
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  // OAuth Google Flow trigger
  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)/ideas");
      }
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      alert(err.message || "Failed to log in with Google");
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow]);

  // Credentials sign in trigger
  const handleSignIn = async () => {
    if (!isSignInLoaded) return;
    if (!email.trim() || !password.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const attempt = await signIn.create({
        identifier: email,
        password,
      });

      if (attempt.status === "complete") {
        await setSignInActive({ session: attempt.createdSessionId });
        router.replace("/(tabs)/ideas");
      } else {
        console.warn("MFA or extra verification needed:", attempt);
        alert("Verification or extra steps required.");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      alert(err.errors?.[0]?.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Credentials sign up trigger
  const handleSignUp = async () => {
    if (!isSignUpLoaded) return;
    if (!email.trim() || !password.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerificationStep(true);
    } catch (err: any) {
      console.error("Sign-up error:", err);
      alert(err.errors?.[0]?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // Credentials email code verification trigger
  const handleVerify = async () => {
    if (!isSignUpLoaded) return;
    if (!verificationCode.trim()) {
      alert("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (attempt.status === "complete") {
        await setSignUpActive({ session: attempt.createdSessionId });
        router.replace("/(tabs)/ideas");
      } else {
        console.warn("Sign-up verification incomplete:", attempt);
        alert("Verification failed or incomplete.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      alert(err.errors?.[0]?.message || "Verification code is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  // Render Subviews
  const renderOnboarding = () => {
    const slides = [
      {
        title: "Peel the Noise",
        desc: "A clutter-free social workstation optimized for design and absolute focus. Say goodbye to messy enterprise scheduling tables.",
        illustration: (
          <View style={styles.onionContainer}>
            <View style={[styles.onionLayer, { width: 140, height: 140, borderRadius: 70, borderColor: "#e4e4e7" }]}>
              <View style={[styles.onionLayer, { width: 110, height: 110, borderRadius: 55, borderColor: "#a3e635" }]}>
                <View style={[styles.onionLayer, { width: 80, height: 80, borderRadius: 40, borderColor: "#84cc16" }]}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#84cc16", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 16 }}>ON</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )
      },
      {
        title: "Single Composer, Native Feeds",
        desc: "Type your raw thoughts once. Onion AI automatically adapts, formats paragraphs, and fits character boundaries for X, LinkedIn, and Instagram naturally.",
        illustration: (
          <View style={styles.onionContainer}>
            <View style={styles.mockChannelGrid}>
              <View style={[styles.mockChannelCard, { transform: [{ rotate: "-4deg" }] }]}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#18181b" }}>X / Twitter</Text>
                <View style={styles.mockLine} />
                <View style={[styles.mockLine, { width: "70%" }]} />
              </View>
              <View style={[styles.mockChannelCard, { zIndex: 10, borderColor: "#84cc16", shadowColor: "#84cc16", shadowOpacity: 0.1 }]}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#84cc16" }}>LinkedIn</Text>
                <View style={styles.mockLine} />
                <View style={[styles.mockLine, { width: "85%" }]} />
              </View>
              <View style={[styles.mockChannelCard, { transform: [{ rotate: "4deg" }] }]}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#71717a" }}>Instagram</Text>
                <View style={styles.mockLine} />
                <View style={[styles.mockLine, { width: "60%" }]} />
              </View>
            </View>
          </View>
        )
      },
      {
        title: "Optimal Hour Dispatches",
        desc: "Plan and enqueue your drafts. Our automated queue engine evaluates profile audiences to release content exactly during peak activity windows.",
        illustration: (
          <View style={styles.onionContainer}>
            <View style={{ width: 180, height: 100, flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              {[30, 60, 45, 90, 75, 40, 85].map((h, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: "#f4f4f5", height: 100, justifyContent: "flex-end", borderRadius: 4 }}>
                  <View style={{ height: `${h}%`, backgroundColor: i === 3 ? "#84cc16" : "#cbd5e1", borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
        )
      }
    ];

    const currentSlide = slides[onboardingIndex];

    return (
      <SafeAreaView style={styles.onboardingContainer} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.onboardingHeader}>
          <Text style={styles.logoText}>onion<Text style={{ color: "#84cc16" }}>.ai</Text></Text>
          <TouchableOpacity onPress={() => setScreenState("auth")}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.onboardingContent}>
          {currentSlide.illustration}
          <Text style={styles.onboardingTitle}>{currentSlide.title}</Text>
          <Text style={styles.onboardingDesc}>{currentSlide.desc}</Text>
        </View>

        <View style={styles.onboardingFooter}>
          {/* Slides Progress Indicator */}
          <View style={styles.dotRow}>
            {slides.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dotItem,
                  idx === onboardingIndex ? styles.dotActive : null
                ]}
              />
            ))}
          </View>

          {/* Swipe Actions */}
          <View style={styles.slideActions}>
            {onboardingIndex > 0 ? (
              <TouchableOpacity
                onPress={() => setOnboardingIndex(onboardingIndex - 1)}
                style={styles.prevButton}
              >
                <Text style={styles.prevButtonText}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 80 }} />
            )}

            <TouchableOpacity
              onPress={() => {
                if (onboardingIndex < slides.length - 1) {
                  setOnboardingIndex(onboardingIndex + 1);
                } else {
                  setScreenState("auth");
                }
              }}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>
                {onboardingIndex === slides.length - 1 ? "Get Started" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const renderAuth = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.authContainer} edges={["top", "bottom", "left", "right"]}>
          <ScrollView contentContainerStyle={styles.authScroll}>
            {/* Branding */}
            <View style={styles.authBranding}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>ON</Text>
              </View>
              <Text style={styles.logoMainText}>onion<Text style={{ color: "#84cc16" }}>.ai</Text></Text>
              <Text style={styles.authSubText}>Write once. Schedule platform-native.</Text>
            </View>

            {/* Light Themed Auth Card */}
            <View style={styles.authCard}>
              {verificationStep ? (
                // Email Verification Code Panel
                <View>
                  <Text style={styles.authCardTitle}>Verify Email</Text>
                  <Text style={styles.verificationPrompt}>
                    We've sent a validation code to your email. Please enter it below to activate your account.
                  </Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Verification Code</Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        codeFocused ? styles.inputFocused : null
                      ]}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="#a1a1aa"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      onFocus={() => setCodeFocused(true)}
                      onBlur={() => setCodeFocused(false)}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleVerify}
                    style={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Verify & Continue</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setVerificationStep(false)}
                    style={styles.toggleTextButton}
                  >
                    <Text style={styles.toggleText}>Back to Sign Up</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Sign In / Sign Up Form Panel
                <View>
                  <Text style={styles.authCardTitle}>
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </Text>

                  {/* Standard Continue with Google OAuth Button */}
                  <TouchableOpacity
                    onPress={handleGoogleLogin}
                    style={styles.googleOAuthButton}
                    disabled={loading}
                  >
                    <View style={styles.googleIconPlaceholder}>
                      <Text style={styles.googleLetter}>G</Text>
                    </View>
                    <Text style={styles.googleOAuthButtonText}>
                      Continue with Google
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.orSeparatorContainer}>
                    <View style={styles.separatorLine} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.separatorLine} />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        emailFocused ? styles.inputFocused : null
                      ]}
                      placeholder="Enter email"
                      placeholderTextColor="#a1a1aa"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        passwordFocused ? styles.inputFocused : null
                      ]}
                      placeholder="Enter password"
                      placeholderTextColor="#a1a1aa"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    onPress={isLogin ? handleSignIn : handleSignUp}
                    style={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {isLogin ? "Authenticate" : "Register Now"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsLogin(!isLogin)}
                    style={styles.toggleTextButton}
                  >
                    <Text style={styles.toggleText}>
                      {isLogin 
                        ? "New to Onion AI? Register here" 
                        : "Already have an account? Sign in"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  };

  // State Gate router logic
  switch (screenState) {
    case "onboarding":
      return renderOnboarding();
    case "auth":
      return renderAuth();
    default:
      return renderOnboarding();
  }
}

const styles = StyleSheet.create({
  // Global & Onboarding Styles
  onboardingContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  onboardingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: -0.5,
    color: "#09090b",
  },
  skipButtonText: {
    fontSize: 14,
    color: "#71717a",
    fontWeight: "600",
  },
  onboardingContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  onionContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  onionLayer: {
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  mockChannelGrid: {
    flexDirection: "row",
    gap: -15,
    alignItems: "center",
  },
  mockChannelCard: {
    width: 100,
    height: 90,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    padding: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  mockLine: {
    height: 4,
    backgroundColor: "#e4e4e7",
    borderRadius: 2,
    marginTop: 8,
    width: "100%",
  },
  onboardingTitle: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: "#09090b",
    marginBottom: 12,
    lineHeight: 32,
  },
  onboardingDesc: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 15,
  },
  onboardingFooter: {
    paddingBottom: 30,
    gap: 25,
  },
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dotItem: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e4e4e7",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#84cc16",
  },
  slideActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prevButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  prevButtonText: {
    color: "#71717a",
    fontSize: 14,
    fontWeight: "600",
  },
  nextButton: {
    backgroundColor: "#84cc16",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Auth Styles
  authContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  authScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "center",
    flexGrow: 1,
  },
  authBranding: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  logoBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 12,
  },
  logoBadgeText: {
    color: "#84cc16",
    fontWeight: "900",
    fontSize: 18,
  },
  logoMainText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.5,
  },
  authSubText: {
    fontSize: 13,
    color: "#71717a",
    marginTop: 6,
    fontWeight: "500",
  },
  authCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f4f4f5",
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  authCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 20,
    textAlign: "center",
  },
  googleOAuthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 15,
  },
  googleIconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  googleLetter: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4285f4",
  },
  googleOAuthButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18181b",
  },
  orSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    justifyContent: "center",
  },
  separatorLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: "#e4e4e7",
  },
  orText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#a1a1aa",
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#09090b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputField: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#09090b",
  },
  inputFocused: {
    borderColor: "#84cc16",
    backgroundColor: "#ffffff",
  },
  submitButton: {
    backgroundColor: "#84cc16",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#84cc16",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  toggleTextButton: {
    marginTop: 16,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "600",
  },
  verificationPrompt: {
    fontSize: 12,
    color: "#71717a",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 20,
  },
});

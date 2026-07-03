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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignIn, useSignUp, useOAuth, useAuth } from "@clerk/clerk-expo";
import Svg, { Path } from "react-native-svg";
import * as WebBrowser from "expo-web-browser";

// Complete OAuth session if redirected back
WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GoogleLogo = () => (
  <Svg width="20" height="20" viewBox="0 0 48 48">
    <Path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <Path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <Path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <Path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </Svg>
);

type ScreenState = "onboarding" | "auth";

export default function Index() {
  const router = useRouter();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: isSignUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();

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
  }, [isSignedIn, isAuthLoaded, router]);

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
    } catch (err: unknown) {
      console.error("Google OAuth error:", err);
      alert(
        err instanceof Error ? err.message : "Failed to log in with Google",
      );
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow, router]);

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
    } catch (err: unknown) {
      console.error("Sign-in error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Authentication failed. Check your credentials.";
      alert(message);
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
    } catch (err: unknown) {
      console.error("Sign-up error:", err);
      const message =
        err instanceof Error ? err.message : "Registration failed.";
      alert(message);
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
    } catch (err: unknown) {
      console.error("Verification error:", err);
      const message =
        err instanceof Error ? err.message : "Verification code is incorrect.";
      alert(message);
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
            <View
              style={[
                styles.onionLayer,
                {
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  borderColor: "#e4e4e7",
                },
              ]}
            >
              <View
                style={[
                  styles.onionLayer,
                  {
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    borderColor: "#a3e635",
                  },
                ]}
              >
                <View
                  style={[
                    styles.onionLayer,
                    {
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderColor: "#84cc16",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#84cc16",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      ON
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ),
      },
      {
        title: "Single Composer, Native Feeds",
        desc: "Type your raw thoughts once. Onion AI automatically adapts, formats paragraphs, and fits character boundaries for X, LinkedIn, and Instagram naturally.",
        illustration: (
          <View style={styles.onionContainer}>
            <View style={styles.mockChannelGrid}>
              <View
                style={[
                  styles.mockChannelCard,
                  { transform: [{ rotate: "-4deg" }] },
                ]}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: "bold", color: "#18181b" }}
                >
                  X / Twitter
                </Text>
                <View style={styles.mockLine} />
                <View style={[styles.mockLine, { width: "70%" }]} />
              </View>
              <View
                style={[
                  styles.mockChannelCard,
                  {
                    zIndex: 10,
                    borderColor: "#84cc16",
                    shadowColor: "#84cc16",
                    shadowOpacity: 0.1,
                  },
                ]}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: "bold", color: "#84cc16" }}
                >
                  LinkedIn
                </Text>
                <View style={styles.mockLine} />
                <View style={[styles.mockLine, { width: "85%" }]} />
              </View>
              <View
                style={[
                  styles.mockChannelCard,
                  { transform: [{ rotate: "4deg" }] },
                ]}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: "bold", color: "#71717a" }}
                >
                  Instagram
                </Text>
                <View style={styles.mockLine} />
                <View style={[styles.mockLine, { width: "60%" }]} />
              </View>
            </View>
          </View>
        ),
      },
      {
        title: "Optimal Hour Dispatches",
        desc: "Plan and enqueue your drafts. Our automated queue engine evaluates profile audiences to release content exactly during peak activity windows.",
        illustration: (
          <View style={styles.onionContainer}>
            <View
              style={{
                width: 180,
                height: 100,
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              {[30, 60, 45, 90, 75, 40, 85].map((h, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: "#f4f4f5",
                    height: 100,
                    justifyContent: "flex-end",
                    borderRadius: 4,
                  }}
                >
                  <View
                    style={{
                      height: `${h}%`,
                      backgroundColor: i === 3 ? "#84cc16" : "#cbd5e1",
                      borderRadius: 4,
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        ),
      },
    ];

    const currentSlide = slides[onboardingIndex];

    return (
      <SafeAreaView
        style={styles.onboardingContainer}
        edges={["top", "bottom", "left", "right"]}
      >
        <View style={styles.onboardingHeader}>
          <Text style={styles.logoText}>
            onion<Text style={{ color: "#84cc16" }}>.ai</Text>
          </Text>
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
                  idx === onboardingIndex ? styles.dotActive : null,
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
        <SafeAreaView
          style={styles.authContainer}
          edges={["top", "bottom", "left", "right"]}
        >
          <ScrollView
            contentContainerStyle={styles.authScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.authBranding}>
              <Text style={styles.logoMainText}>
                onion<Text style={{ color: "#84cc16" }}>.ai</Text>
              </Text>
              <Text style={styles.authSubText}>
                Write once. Schedule platform-native.
              </Text>
            </View>

            {verificationStep ? (
              <View style={styles.authCard}>
                <View style={styles.verificationIconContainer}>
                  <View style={styles.verificationIconInner}>
                    <Text style={styles.verificationIconText}>✉</Text>
                  </View>
                </View>
                <Text style={styles.authCardTitle}>Check your email</Text>
                <Text style={styles.verificationPrompt}>
                  We sent a verification code to{"\n"}
                  <Text style={{ fontWeight: "600", color: "#09090b" }}>
                    {email}
                  </Text>
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      styles.codeInput,
                      codeFocused ? styles.inputFocused : null,
                    ]}
                    placeholder="000000"
                    placeholderTextColor="#d4d4d8"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => setCodeFocused(false)}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleVerify}
                  style={[
                    styles.submitButton,
                    verificationCode.length < 6 && styles.submitButtonDisabled,
                  ]}
                  disabled={loading || verificationCode.length < 6}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Verify & Continue
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setVerificationStep(false)}
                  style={styles.toggleTextButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleText}>← Back to sign up</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Sign In / Sign Up Form Panel
              <View style={styles.authCard}>
                <Text style={styles.authCardTitle}>
                  {isLogin ? "Welcome back" : "Create your account"}
                </Text>

                {/* Google OAuth Button */}
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  style={styles.googleOAuthButton}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <GoogleLogo />
                  <Text style={styles.googleOAuthButtonText}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.orSeparatorContainer}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Email */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      emailFocused ? styles.inputFocused : null,
                    ]}
                    placeholder="name@example.com"
                    placeholderTextColor="#a1a1aa"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                {/* Password */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      passwordFocused ? styles.inputFocused : null,
                    ]}
                    placeholder={
                      isLogin ? "Enter your password" : "Create a password"
                    }
                    placeholderTextColor="#a1a1aa"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry
                    autoComplete={isLogin ? "password" : "new-password"}
                  />
                </View>

                {/* Submit */}
                <TouchableOpacity
                  onPress={isLogin ? handleSignIn : handleSignUp}
                  style={[
                    styles.submitButton,
                    (!email.trim() || !password.trim()) &&
                      styles.submitButtonDisabled,
                  ]}
                  disabled={loading || !email.trim() || !password.trim()}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isLogin ? "Sign in" : "Create account"}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Toggle */}
                <View style={styles.toggleContainer}>
                  <Text style={styles.togglePrefix}>
                    {isLogin
                      ? "Don't have an account?"
                      : "Already have an account?"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsLogin(!isLogin)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toggleLink}>
                      {isLogin ? "Sign up" : "Sign in"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Footer links */}
            <View style={styles.authFooter}>
              <Text style={styles.authFooterText}>
                By continuing, you agree to our{" "}
                <Text style={styles.authFooterLink} onPress={() => {}}>
                  Terms
                </Text>{" "}
                and{" "}
                <Text style={styles.authFooterLink} onPress={() => {}}>
                  Privacy Policy
                </Text>
              </Text>
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
    paddingHorizontal: 28,
    paddingBottom: 40,
    justifyContent: "center",
    flexGrow: 1,
  },
  authBranding: {
    alignItems: "center",
    marginBottom: 36,
    marginTop: SCREEN_WIDTH > 400 ? 40 : 20,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  logoBadgeText: {
    color: "#84cc16",
    fontWeight: "900",
    fontSize: 18,
  },
  logoMainText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#09090b",
    letterSpacing: -0.5,
  },
  authSubText: {
    fontSize: 13,
    color: "#a1a1aa",
    marginTop: 6,
    fontWeight: "500",
  },
  authCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f4f4f5",
    borderRadius: 20,
    padding: 24,
  },
  authCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#09090b",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  googleOAuthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 20,
    gap: 10,
  },
  googleOAuthButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#18181b",
  },
  orSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#f4f4f5",
  },
  orText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d4d4d8",
    marginHorizontal: 12,
    textTransform: "lowercase",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#52525b",
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#09090b",
  },
  inputFocused: {
    borderColor: "#09090b",
    backgroundColor: "#ffffff",
  },
  codeInput: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 8,
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: "#09090b",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 4,
  },
  togglePrefix: {
    fontSize: 13,
    color: "#a1a1aa",
    fontWeight: "500",
  },
  toggleLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#09090b",
  },
  toggleTextButton: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 13,
    color: "#71717a",
    fontWeight: "500",
  },
  verificationIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  verificationIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  verificationIconText: {
    fontSize: 22,
  },
  verificationPrompt: {
    fontSize: 13,
    color: "#71717a",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  authFooter: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  authFooterText: {
    fontSize: 11,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 18,
  },
  authFooterLink: {
    color: "#71717a",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

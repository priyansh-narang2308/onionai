import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type ToneType = "original" | "indie" | "pro" | "chaos";
type PlatformType = "twitter" | "linkedin" | "instagram";

const TONE_PRESETS: Record<ToneType, {
  label: string;
  desc: string;
  rawText: string;
  twitter: string;
  linkedin: string;
  instagram: string;
}> = {
  original: {
    label: "Original Thought",
    desc: "Your raw draft or idea before platform optimization.",
    rawText: "We built Onion AI to peel back the noise of social media scheduling. Standard tools are cluttered and enterprise-focused. We wanted a fast, beautiful multi-channel composer that adapts to each network naturally.",
    twitter: "Standard social schedulers are too cluttered. We built Onion AI to peel back the noise.\n\nOne sleek, unified composer that adapts your thoughts to X, LinkedIn, and Instagram naturally. No spreadsheets, just raw focus.",
    linkedin: "Proud to introduce Onion AI — a modern content command center built to peel back the noise of traditional social media scheduling.\n\nLegacy tools focus on enterprise feature bloat. We focused on composer speed and multi-channel optimization. Write once, adapt natively, schedule in seconds. \n\n#socialmedia #automation #indiehackers",
    instagram: "Social scheduling should feel organic. We built Onion AI to peel back the clutter and help you publish beautiful, native drafts across every channel with zero friction. \n\nCheck out the link in bio to start composing today. #aesthetic #SaaS #codinglife"
  },
  indie: {
    label: "Indie Hacker",
    desc: "Punchy, builder-focused, and transparent.",
    rawText: "Building Onion AI in public. Tired of bloated enterprise social media platforms that cost a fortune. Making something simple and design-first.",
    twitter: "building onion.ai in public because legacy tools are bloated, slow, and expensive.\n\nwe went back to first principles: one beautiful workspace, native adaptations, and zero friction. simple as that. #buildinpublic",
    linkedin: "I'm officially building Onion AI in public.\n\nWhy? Because legacy social scheduling platforms are bogged down by enterprise bloat. Content creators deserve a fast, design-first workspace that respects their time.\n\nHere is our roadmap for the next 30 days... \n\n#buildinpublic #solopreneur #software",
    instagram: "Building from scratch. Onion AI is a design-first workspace made to peel back the noise of bloated social media management tools. Real, organic, fast. #indiehacker #buildinpublic #workspace"
  },
  pro: {
    label: "Enterprise Pro",
    desc: "Polished, authoritative, and marketing-optimized.",
    rawText: "Onion AI offers an advanced multi-channel publishing engine. We help corporate teams and digital brands automate scheduling across X, LinkedIn, and Instagram.",
    twitter: "Introducing Onion AI, the unified social publishing workspace designed for modern brand communication. \n\nStreamline your multi-channel deployment and maintain brand coherence across X, LinkedIn, and Instagram. ",
    linkedin: "We are excited to unveil Onion AI, a next-generation multi-channel scheduling platform built for brands who value speed and efficiency. \n\nBy leveraging our adaptive unified composer, companies can publish highly tailored, platform-native content that maximizes audience engagement while cutting preparation time in half.\n\n#ContentStrategy #DigitalMarketing #Enterprise",
    instagram: "Scale your voice with precision. Onion AI provides modern teams with a sleek, unified hub to format and publish beautiful visual content across channels automatically. #DigitalBranding #MarketingTech #Scale"
  },
  chaos: {
    label: "Internet Chaos",
    desc: "Highly informal, sarcastic, and virally charged.",
    rawText: "Enterprise marketing tools are literally so bad and expensive that I had to code my own with a green onion theme to save my sanity.",
    twitter: "legacy social media scheduling tools are currently crying in the corner because a green onion is doing their job 10x faster and actually looks clean",
    linkedin: "thrilled to announce that we are actively disrupting the legacy marketing technology paradigm by building a scheduling tool themed after a common root vegetable. \n\nplease subscribe to my newsletter to learn how weeding onions is related to B2B sales cycles.\n\n#disruption #visionary",
    instagram: "Enterprise software UI: boring\nOnion AI organic developer workspace: refined\n\nPeeling back the layers of bad design. Link in bio to join the green onion cult. #SaaS #design #developerhumor"
  }
};

interface QueuedPost {
  id: string;
  text: string;
  platform: PlatformType;
  tone: ToneType;
  scheduledTime: string;
}

export default function Explore() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"composer" | "queue" | "connections">("composer");
  const [composerText, setComposerText] = useState(TONE_PRESETS.original.rawText);
  const [activeTone, setActiveTone] = useState<ToneType>("original");
  const [activePlatform, setActivePlatform] = useState<PlatformType>("twitter");
  const [scheduledPosts, setScheduledPosts] = useState<QueuedPost[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [toastAnim] = useState(new Animated.Value(0));

  // Connection switches state
  const [connections, setConnections] = useState({
    twitter: true,
    linkedin: true,
    instagram: false,
    youtube: false,
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleToneChange = (tone: ToneType) => {
    setActiveTone(tone);
    setComposerText(TONE_PRESETS[tone].rawText);
    showToast(`Tone adapted: ${TONE_PRESETS[tone].label}`);
  };

  const handleSchedulePost = () => {
    if (!composerText.trim()) return;

    const preset = TONE_PRESETS[activeTone];
    const textToSchedule = composerText.trim() === preset.rawText.trim() 
      ? preset[activePlatform] 
      : composerText + (activePlatform === "twitter" ? "" : activePlatform === "linkedin" ? "\n\n#social" : "\n\n#visual");

    const newPost: QueuedPost = {
      id: Date.now().toString(),
      text: textToSchedule,
      platform: activePlatform,
      tone: activeTone,
      scheduledTime: "Today at 6:00 PM (Optimal Hour)",
    };

    setScheduledPosts([newPost, ...scheduledPosts]);
    showToast("Post scheduled successfully!");
    
    // Switch to queue tab automatically to show the user their enqueued item
    setTimeout(() => {
      setActiveTab("queue");
    }, 400);
  };

  const handleDeletePost = (id: string) => {
    setScheduledPosts(scheduledPosts.filter(p => p.id !== id));
    showToast("Post removed from queue");
  };

  const toggleConnection = (platform: keyof typeof connections) => {
    setConnections({
      ...connections,
      [platform]: !connections[platform],
    });
    showToast(`${platform.toUpperCase()} connection updated`);
  };

  // Get dynamic adapted platform content preview
  const getAdaptedOutput = () => {
    const preset = TONE_PRESETS[activeTone];
    if (composerText.trim() === preset.rawText.trim()) {
      return preset[activePlatform];
    }
    const suffix = activePlatform === "twitter" ? "" : activePlatform === "linkedin" ? "\n\n#onionai #automation" : "\n\n[Link in Bio]";
    return composerText + suffix;
  };

  return (
    <SafeAreaView style={styles.dashboardContainer} edges={["top", "left", "right"]}>
      {/* Dashboard Header */}
      <View style={styles.dashHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={styles.logoBadgeSmall}>
            <Text style={styles.logoBadgeTextSmall}>ON</Text>
          </View>
          <Text style={styles.logoTextSmall}>onion<Text style={{ color: "#84cc16" }}>.ai</Text></Text>
        </View>
        
        {/* Actions Row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={styles.pulseContainer}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseText}>Live</Text>
          </View>
          <TouchableOpacity onPress={() => router.replace("/")} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Selector Tabs Bar */}
      <View style={styles.tabSelectorBar}>
        <TouchableOpacity
          onPress={() => setActiveTab("composer")}
          style={[styles.tabButton, activeTab === "composer" ? styles.tabButtonActive : null]}
        >
          <Text style={[styles.tabButtonText, activeTab === "composer" ? styles.tabButtonTextActive : null]}>
            Composer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("queue")}
          style={[styles.tabButton, activeTab === "queue" ? styles.tabButtonActive : null]}
        >
          <Text style={[styles.tabButtonText, activeTab === "queue" ? styles.tabButtonTextActive : null]}>
            Queue ({scheduledPosts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("connections")}
          style={[styles.tabButton, activeTab === "connections" ? styles.tabButtonActive : null]}
        >
          <Text style={[styles.tabButtonText, activeTab === "connections" ? styles.tabButtonTextActive : null]}>
            Channels
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Subviews Content */}
      {activeTab === "composer" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Input Composer Editor Area */}
          <View style={styles.composerCard}>
            <Text style={styles.fieldSectionLabel}>Describe your raw thought:</Text>
            <TextInput
              style={styles.composerTextInput}
              multiline
              numberOfLines={6}
              value={composerText}
              onChangeText={setComposerText}
              placeholder="What is your core idea..."
              placeholderTextColor="#cbd5e1"
            />
            <View style={styles.composerMetaRow}>
              <Text style={styles.composerCharCount}>{composerText.length} characters</Text>
              <Text style={styles.composerLabel}>RAW DRAFT MODE</Text>
            </View>
          </View>

          {/* Tone Selector Chips (Horizontal Scroll) */}
          <Text style={styles.chipsSectionTitle}>Choose Adaptation Tone Strategy:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {(Object.keys(TONE_PRESETS) as ToneType[]).map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleToneChange(key)}
                style={[
                  styles.chipItem,
                  activeTone === key ? styles.chipActive : null
                ]}
              >
                <Text style={[
                  styles.chipText,
                  activeTone === key ? styles.chipTextActive : null
                ]}>
                  {TONE_PRESETS[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Adapted Platform Segment Toggles */}
          <Text style={styles.chipsSectionTitle}>Select Platform Native Preview:</Text>
          <View style={styles.segmentBar}>
            {(["twitter", "linkedin", "instagram"] as const).map((platform) => {
              const label = platform === "twitter" ? "X / Twitter" : platform.charAt(0).toUpperCase() + platform.slice(1);
              return (
                <TouchableOpacity
                  key={platform}
                  onPress={() => setActivePlatform(platform)}
                  style={[
                    styles.segmentButton,
                    activePlatform === platform ? styles.segmentButtonActive : null
                  ]}
                >
                  <Text style={[
                    styles.segmentText,
                    activePlatform === platform ? styles.segmentTextActive : null
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Authentic Platform Preview Mockup Box */}
          <View style={styles.previewContainerShadow}>
            {/* Platform rendering conditions */}
            {activePlatform === "twitter" && (
              <View style={styles.mockTwitterCard}>
                {/* Header */}
                <View style={styles.mockTwitterHeader}>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={styles.mockTwitterUser}>onion.ai</Text>
                      <View style={styles.mockTwitterVerified}>
                        <Text style={{ color: "#000000", fontWeight: "bold", fontSize: 8 }}>✓</Text>
                      </View>
                    </View>
                    <Text style={styles.mockTwitterHandle}>@onion_ai</Text>
                  </View>
                  <View style={styles.nativeLimitBadge}>
                    <Text style={{ fontSize: 9, color: "#71717a", fontWeight: "bold" }}>280 LIMIT</Text>
                  </View>
                </View>
                
                {/* Text */}
                <Text style={styles.mockTwitterText}>{getAdaptedOutput()}</Text>
                
                {/* Footer Meta details */}
                <Text style={styles.mockTwitterMeta}>9:41 AM · May 21, 2026 · Onion Mobile</Text>
                
                {/* Simulated Action bars */}
                <View style={styles.mockTwitterActionRow}>
                  <Text style={styles.mockActionText}>💬 12</Text>
                  <Text style={styles.mockActionText}>🔁 34</Text>
                  <Text style={styles.mockActionText}>❤️ 125</Text>
                  <Text style={styles.mockActionText}>📊 8.9K</Text>
                </View>
              </View>
            )}

            {activePlatform === "linkedin" && (
              <View style={styles.mockLinkedinCard}>
                {/* Header */}
                <View style={styles.mockTwitterHeader}>
                  <View style={styles.mockAvatarContainerLinkedin}>
                    <Text style={styles.mockAvatarText}>ON</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.mockLinkedinUser}>onion.ai • 1st</Text>
                    <Text style={styles.mockLinkedinHeadline}>Multi-channel publishing engine</Text>
                    <Text style={styles.mockLinkedinTime}>1h • Edited</Text>
                  </View>
                  <View style={styles.nativeLimitBadge}>
                    <Text style={{ fontSize: 9, color: "#71717a", fontWeight: "bold" }}>PROFESSIONAL</Text>
                  </View>
                </View>

                {/* Text */}
                <Text style={styles.mockLinkedinText}>{getAdaptedOutput()}</Text>

                {/* Simulated LinkedIn Feedback metrics */}
                <View style={styles.linkedinFeedbackRow}>
                  <Text style={{ fontSize: 10, color: "#71717a" }}>👍 189 Reactions</Text>
                  <Text style={{ fontSize: 10, color: "#71717a" }}>12 Comments</Text>
                </View>

                {/* Simulated Actions */}
                <View style={styles.linkedinActionsRow}>
                  <Text style={styles.mockActionText}>Like</Text>
                  <Text style={styles.mockActionText}>Comment</Text>
                  <Text style={styles.mockActionText}>Share</Text>
                  <Text style={styles.mockActionText}>Send</Text>
                </View>
              </View>
            )}

            {activePlatform === "instagram" && (
              <View style={styles.mockInstagramCard}>
                {/* Header */}
                <View style={[styles.mockTwitterHeader, { borderBottomWidth: 1, borderBottomColor: "#f4f4f5", paddingBottom: 10 }]}>
                  <View style={styles.mockAvatarContainerInsta}>
                    <Text style={styles.mockAvatarText}>ON</Text>
                  </View>
                  <Text style={[styles.mockLinkedinUser, { marginLeft: 10, flex: 1 }]}>onion.ai</Text>
                  <View style={styles.nativeLimitBadge}>
                    <Text style={{ fontSize: 9, color: "#71717a", fontWeight: "bold" }}>VISUAL FEED</Text>
                  </View>
                </View>

                {/* Visual block mock */}
                <View style={styles.instagramVisualBox}>
                  <View style={styles.logoBadge}>
                    <Text style={styles.logoBadgeText}>ON</Text>
                  </View>
                  <Text style={styles.instaPostLabel}>POST COMPOSER ACTIVE</Text>
                  <Text style={{ fontSize: 9, color: "#71717a" }}>Aspect Ratio 1.91:1</Text>
                </View>

                {/* Instagram Caption */}
                <Text style={styles.mockInstagramText}>
                  <Text style={{ fontWeight: "bold", color: "#18181b" }}>onion.ai </Text>
                  {getAdaptedOutput()}
                </Text>
              </View>
            )}
          </View>

          {/* Enqueue Dispatch Action Trigger */}
          <TouchableOpacity
            onPress={handleSchedulePost}
            style={styles.scheduleActionButton}
          >
            <Text style={styles.scheduleActionButtonText}>Schedule Adapted Native Post</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {activeTab === "queue" && (
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={styles.chipsSectionTitle}>Scheduled Dispatch Queue Timeline</Text>
          
          {scheduledPosts.length === 0 ? (
            <View style={styles.emptyQueueBox}>
              <Text style={styles.emptyQueueHeading}>No Scheduled Posts</Text>
              <Text style={styles.emptyQueueSub}>
                Write and schedule your thoughts in the Composer tab to see them enqueued in this timeline.
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab("composer")}
                style={styles.composerBackBtn}
              >
                <Text style={styles.composerBackBtnText}>Back to Composer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }}>
              {scheduledPosts.map((post) => (
                <View key={post.id} style={styles.queueCard}>
                  <View style={styles.queueHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={styles.queueDotPulse} />
                      <Text style={styles.queuePlatformText}>
                        {post.platform.toUpperCase()} - {post.tone.toUpperCase()} STRATEGY
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeletePost(post.id)}>
                      <Text style={styles.deleteBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.queueBodyText} numberOfLines={4}>
                    {post.text}
                  </Text>
                  <View style={styles.queueFooter}>
                    <Text style={styles.queueTimeLabel}>Release Scheduled: {post.scheduledTime}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {activeTab === "connections" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.chipsSectionTitle}>Linked Social Profiles Status</Text>
          <Text style={styles.descText}>
            Connect or disconnect direct OAuth channels securely. Linked profiles are authenticated using system AES-256 standard protocols.
          </Text>

          <View style={styles.connectionsGrid}>
            {/* Profile Card X */}
            <View style={styles.connectProfileCard}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flex: 1, width: "100%" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectPlatformName}>X / Twitter</Text>
                  <Text style={styles.connectUserHandle}>@onion_ai</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.statusIndicatorPulse, { backgroundColor: connections.twitter ? "#84cc16" : "#cbd5e1" }]} />
                  <Text style={[styles.statusText, { color: connections.twitter ? "#84cc16" : "#71717a" }]}>
                    {connections.twitter ? "Synchronized" : "Disconnected"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => toggleConnection("twitter")}
                style={[styles.connectionToggleBtn, { backgroundColor: connections.twitter ? "#f4f4f5" : "#84cc16" }]}
              >
                <Text style={[styles.connectionToggleBtnText, { color: connections.twitter ? "#ef4444" : "#ffffff" }]}>
                  {connections.twitter ? "Disconnect Feed" : "Link Channel"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Profile Card LinkedIn */}
            <View style={styles.connectProfileCard}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flex: 1, width: "100%" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectPlatformName}>LinkedIn</Text>
                  <Text style={styles.connectUserHandle}>onion.ai Corporation</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.statusIndicatorPulse, { backgroundColor: connections.linkedin ? "#84cc16" : "#cbd5e1" }]} />
                  <Text style={[styles.statusText, { color: connections.linkedin ? "#84cc16" : "#71717a" }]}>
                    {connections.linkedin ? "Synchronized" : "Disconnected"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => toggleConnection("linkedin")}
                style={[styles.connectionToggleBtn, { backgroundColor: connections.linkedin ? "#f4f4f5" : "#84cc16" }]}
              >
                <Text style={[styles.connectionToggleBtnText, { color: connections.linkedin ? "#ef4444" : "#ffffff" }]}>
                  {connections.linkedin ? "Disconnect Feed" : "Link Channel"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Profile Card Instagram */}
            <View style={styles.connectProfileCard}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flex: 1, width: "100%" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectPlatformName}>Instagram</Text>
                  <Text style={styles.connectUserHandle}>onion_social_native</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.statusIndicatorPulse, { backgroundColor: connections.instagram ? "#84cc16" : "#cbd5e1" }]} />
                  <Text style={[styles.statusText, { color: connections.instagram ? "#84cc16" : "#71717a" }]}>
                    {connections.instagram ? "Synchronized" : "Disconnected"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => toggleConnection("instagram")}
                style={[styles.connectionToggleBtn, { backgroundColor: connections.instagram ? "#f4f4f5" : "#84cc16" }]}
              >
                <Text style={[styles.connectionToggleBtnText, { color: connections.instagram ? "#ef4444" : "#ffffff" }]}>
                  {connections.instagram ? "Disconnect Feed" : "Link Channel"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Global Success Notification Toast Alert */}
      <Animated.View style={[
        styles.toastContainer,
        {
          opacity: toastAnim,
          transform: [{
            translateY: toastAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }
      ]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  dashHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  logoBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeTextSmall: {
    color: "#84cc16",
    fontWeight: "bold",
    fontSize: 12,
  },
  logoTextSmall: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#09090b",
  },
  pulseContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4e4e7",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#84cc16",
  },
  pulseText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#71717a",
  },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f4f4f5",
    borderWidth: 0.5,
    borderColor: "#e4e4e7",
  },
  exitBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ef4444",
  },
  tabSelectorBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#84cc16",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717a",
  },
  tabButtonTextActive: {
    color: "#84cc16",
    fontWeight: "700",
  },

  // Composer Area
  composerCard: {
    backgroundColor: "#f4f4f5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
    marginBottom: 20,
  },
  fieldSectionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  composerTextInput: {
    height: 120,
    fontSize: 14,
    color: "#09090b",
    textAlignVertical: "top",
    padding: 0,
    lineHeight: 20,
  },
  composerMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e4e4e7",
    paddingTop: 10,
    marginTop: 10,
  },
  composerCharCount: {
    fontSize: 10,
    color: "#71717a",
  },
  composerLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#cbd5e1",
    letterSpacing: 0.5,
  },

  // Tone selector chips
  chipsSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#09090b",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  chipItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
    marginRight: 8,
  },
  chipActive: {
    borderColor: "#84cc16",
    backgroundColor: "#f4f5f0",
  },
  chipText: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#84cc16",
    fontWeight: "700",
  },

  // Segment Platform Bar
  segmentBar: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 4,
    borderRadius: 24,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 20,
  },
  segmentButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  segmentTextActive: {
    color: "#09090b",
    fontWeight: "700",
  },

  // Mock Previews
  previewContainerShadow: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    marginBottom: 24,
  },
  mockTwitterCard: {
    backgroundColor: "#09090b",
    borderRadius: 20,
    padding: 16,
  },
  mockTwitterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mockAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#84cc16",
    alignItems: "center",
    justifyContent: "center",
  },
  mockAvatarContainerLinkedin: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: "#84cc16",
    alignItems: "center",
    justifyContent: "center",
  },
  mockAvatarContainerInsta: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#84cc16",
    alignItems: "center",
    justifyContent: "center",
  },
  mockAvatarText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 11,
  },
  mockTwitterUser: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
  mockTwitterVerified: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#84cc16",
    alignItems: "center",
    justifyContent: "center",
  },
  mockTwitterHandle: {
    color: "#71717a",
    fontSize: 11,
  },
  nativeLimitBadge: {
    backgroundColor: "#27272a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockTwitterText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  mockTwitterMeta: {
    fontSize: 10,
    color: "#71717a",
    borderTopWidth: 0.5,
    borderTopColor: "#27272a",
    paddingTop: 10,
    marginBottom: 10,
  },
  mockTwitterActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#27272a",
    paddingTop: 10,
  },
  mockActionText: {
    fontSize: 11,
    color: "#71717a",
    fontWeight: "600",
  },

  // LinkedIn Mock
  mockLinkedinCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
  },
  mockLinkedinUser: {
    color: "#18181b",
    fontWeight: "bold",
    fontSize: 13,
  },
  mockLinkedinHeadline: {
    color: "#71717a",
    fontSize: 10,
  },
  mockLinkedinTime: {
    color: "#a1a1aa",
    fontSize: 9,
  },
  mockLinkedinText: {
    color: "#18181b",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  linkedinFeedbackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#f4f4f5",
  },
  linkedinActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#f4f4f5",
    paddingTop: 8,
  },

  // Instagram Mock
  mockInstagramCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    padding: 16,
  },
  instagramVisualBox: {
    height: 120,
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    gap: 4,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: {
    color: "#84cc16",
    fontWeight: "900",
    fontSize: 16,
  },
  instaPostLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#84cc16",
    letterSpacing: 1,
  },
  mockInstagramText: {
    fontSize: 11,
    color: "#18181b",
    lineHeight: 16,
  },

  // Call to Actions
  scheduleActionButton: {
    backgroundColor: "#84cc16",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#84cc16",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleActionButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },

  // Empty Queue styles
  emptyQueueBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 80,
  },
  emptyQueueHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#09090b",
    marginBottom: 8,
  },
  emptyQueueSub: {
    fontSize: 13,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  composerBackBtn: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  composerBackBtnText: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "700",
  },

  // Queue Timeline Styles
  queueCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  queueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f4f4f5",
    paddingBottom: 8,
    marginBottom: 10,
  },
  queueDotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#84cc16",
  },
  queuePlatformText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#71717a",
    letterSpacing: 0.5,
  },
  deleteBtnText: {
    fontSize: 10,
    color: "#ef4444",
    fontWeight: "bold",
  },
  queueBodyText: {
    fontSize: 13,
    color: "#18181b",
    lineHeight: 18,
    marginBottom: 10,
  },
  queueFooter: {
    borderTopWidth: 0.5,
    borderTopColor: "#f4f4f5",
    paddingTop: 8,
  },
  queueTimeLabel: {
    fontSize: 9,
    color: "#cbd5e1",
    fontWeight: "bold",
  },

  // Connections List
  descText: {
    fontSize: 14,
    color: "#71717a",
    lineHeight: 20,
    marginBottom: 15,
  },
  connectionsGrid: {
    gap: 12,
    marginTop: 15,
  },
  connectProfileCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
  },
  connectPlatformName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#09090b",
  },
  connectUserHandle: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
  },
  statusIndicatorPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  connectionToggleBtn: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  connectionToggleBtnText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  // Global success Toast Alert
  toastContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#09090b",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});

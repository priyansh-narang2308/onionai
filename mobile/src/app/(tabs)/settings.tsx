import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { fetchWithAuth, API_BASE_URL } from "../../lib/api";
import {
  Settings,
  User as UserIcon,
  Layers,
  Palette,
  LogOut,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from "lucide-react-native";

export default function SettingsTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, signOut } = useAuth();

  const [activeSegment, setActiveSegment] = useState<"profile" | "channels" | "appearance">("channels");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch Channels
  const {
    data: channelsData,
    isLoading: isLoadingChannels,
    isRefetching: isRefetchingChannels,
    refetch: refetchChannels,
    error: channelsError,
  } = useQuery({
    queryKey: ["channels"],
    queryFn: () => fetchWithAuth("/api/channel", { method: "GET" }, getToken),
  });

  const channels = channelsData?.channels || [];
  const connectedCount = channelsData?.connectedCount || 0;

  // Disconnect Mutation
  const disconnectMutation = useMutation({
    mutationFn: (userChannelId: string) =>
      fetchWithAuth(
        "/api/channel/disconnect",
        {
          method: "POST",
          body: JSON.stringify({ userChannelId }),
        },
        getToken
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      alert("Social channel disconnected successfully.");
    },
    onError: (err: any) => {
      console.error(err);
      alert(err.message || "Failed to disconnect channel.");
    },
  });

  // Connect Mutation
  const connectMutation = useMutation({
    mutationFn: (channelTypeId: string) =>
      fetchWithAuth(
        "/api/channel/connect",
        {
          method: "POST",
          body: JSON.stringify({ channelTypeId }),
        },
        getToken
      ),
    onSuccess: async ({ url }) => {
      if (url) {
        // Open authorization flow in standard web browser
        await WebBrowser.openBrowserAsync(url);
      }
    },
    onError: (err: any) => {
      console.error(err);
      alert(err.message || "Failed to start connection flow.");
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (err: any) {
      console.error("Sign out error:", err);
    }
  };

  const handleConnect = (id: string) => {
    connectMutation.mutate(id);
  };

  const handleDisconnect = (userChannelId: string) => {
    disconnectMutation.mutate(userChannelId);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Settings color="#84cc16" size={24} />
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Configure user profiles and sync connected feeds</Text>
        </View>
      </View>

      {/* Segment Selector tabs */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          onPress={() => setActiveSegment("profile")}
          style={[styles.segmentButton, activeSegment === "profile" ? styles.segmentButtonActive : null]}
        >
          <UserIcon color={activeSegment === "profile" ? "#84cc16" : "#71717a"} size={16} />
          <Text style={[styles.segmentText, activeSegment === "profile" ? styles.segmentTextActive : null]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSegment("channels")}
          style={[styles.segmentButton, activeSegment === "channels" ? styles.segmentButtonActive : null]}
        >
          <Layers color={activeSegment === "channels" ? "#84cc16" : "#71717a"} size={16} />
          <Text style={[styles.segmentText, activeSegment === "channels" ? styles.segmentTextActive : null]}>
            Channels ({connectedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSegment("appearance")}
          style={[styles.segmentButton, activeSegment === "appearance" ? styles.segmentButtonActive : null]}
        >
          <Palette color={activeSegment === "appearance" ? "#84cc16" : "#71717a"} size={16} />
          <Text style={[styles.segmentText, activeSegment === "appearance" ? styles.segmentTextActive : null]}>
            Appearance
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* PROFILE TAB */}
        {activeSegment === "profile" && (
          <View style={styles.tabContent}>
            {isUserLoaded && user ? (
              <View style={styles.profileCard}>
                <View style={styles.profileMetaRow}>
                  {user.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <UserIcon color="#71717a" size={32} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.profileName}>{user.fullName || "Onion Creator"}</Text>
                    <Text style={styles.profileEmail}>
                      {user.primaryEmailAddress?.emailAddress || "No email synchronized"}
                    </Text>
                    <View style={styles.verifiedRow}>
                      <CheckCircle2 color="#84cc16" size={14} />
                      <Text style={styles.verifiedLabel}>Verified Creator Session</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.profileDetailsList}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailKey}>User ID</Text>
                    <Text style={styles.detailVal} numberOfLines={1}>
                      {user.id}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailKey}>Created At</Text>
                    <Text style={styles.detailVal}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailKey}>Account Plan</Text>
                    <Text style={styles.detailPlanBadge}>Pro Membership</Text>
                  </View>
                </View>

                <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                  <LogOut color="#ef4444" size={16} />
                  <Text style={styles.signOutButtonText}>Sign Out of onion.ai</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ActivityIndicator color="#84cc16" size="small" style={{ marginTop: 40 }} />
            )}

            <View style={styles.infoBox}>
              <HelpCircle color="#71717a" size={18} />
              <Text style={styles.infoBoxText}>
                Need to change password or update verification fields? Modify details via web control room for complete multi-factor verification sync.
              </Text>
            </View>
          </View>
        )}

        {/* CHANNELS TAB */}
        {activeSegment === "channels" && (
          <View style={styles.tabContent}>
            <View style={styles.channelsIntroRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.introHeading}>Synchronized Profiles</Text>
                <Text style={styles.introDesc}>
                  Link multi-channel profiles. Direct OAuth connections allow background dispatcher to release scheduled threads.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => refetchChannels()}
                style={styles.refreshIconBtn}
                disabled={isLoadingChannels || isRefetchingChannels}
              >
                {isLoadingChannels || isRefetchingChannels ? (
                  <ActivityIndicator color="#84cc16" size="small" />
                ) : (
                  <RefreshCw color="#71717a" size={18} />
                )}
              </TouchableOpacity>
            </View>

            {isLoadingChannels && !isRefetchingChannels ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator color="#84cc16" size="large" />
                <Text style={styles.loaderText}>Syncing social profiles database...</Text>
              </View>
            ) : channelsError ? (
              <View style={styles.errorBox}>
                <AlertCircle color="#ef4444" size={24} />
                <Text style={styles.errorText}>Failed to retrieve synchronized channels.</Text>
                <Text style={styles.errorSub}>{channelsError.message}</Text>
                <TouchableOpacity onPress={() => refetchChannels()} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>Retry Sync</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.channelsList}>
                {channels.map((channel: any) => {
                  const isConnected = channel.connected;
                  const isPendingAction =
                    (connectMutation.isPending && connectMutation.variables === channel.id) ||
                    (disconnectMutation.isPending && disconnectMutation.variables === channel.user_channel_id);

                  return (
                    <View key={channel.id} style={styles.channelItemCard}>
                      <View style={styles.channelItemHeader}>
                        {/* Channel Badge with original background color */}
                        <View style={[styles.channelBadge, { backgroundColor: channel.color || "#09090b" }]}>
                          <Text style={styles.channelBadgeLetter}>
                            {channel.type.substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.channelName}>{channel.name}</Text>
                          {isConnected && channel.handle ? (
                            <Text style={styles.channelHandle}>{channel.handle}</Text>
                          ) : (
                            <Text style={styles.channelHandleUnlinked}>Unlinked Profile</Text>
                          )}
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View
                            style={[
                              styles.indicatorDot,
                              { backgroundColor: isConnected ? "#84cc16" : "#cbd5e1" },
                            ]}
                          />
                          <Text style={[styles.indicatorText, { color: isConnected ? "#84cc16" : "#71717a" }]}>
                            {isConnected ? "Linked" : "Offline"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.channelActionRow}>
                        {isConnected ? (
                          <TouchableOpacity
                            onPress={() => handleDisconnect(channel.user_channel_id)}
                            style={[styles.channelBtn, styles.channelBtnDisconnect]}
                            disabled={isPendingAction}
                          >
                            {isPendingAction ? (
                              <ActivityIndicator color="#ef4444" size="small" />
                            ) : (
                              <Text style={styles.channelBtnTextDisconnect}>Disconnect Account</Text>
                            )}
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleConnect(channel.id)}
                            style={[styles.channelBtn, styles.channelBtnConnect]}
                            disabled={isPendingAction}
                          >
                            {isPendingAction ? (
                              <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                              <>
                                <Plus color="#ffffff" size={14} strokeWidth={3} />
                                <Text style={styles.channelBtnTextConnect}>Authenticate Account</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* APPEARANCE TAB */}
        {activeSegment === "appearance" && (
          <View style={styles.tabContent}>
            <View style={styles.appearanceCard}>
              <View style={styles.appearanceItem}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.settingLabel}>Light Theme Aesthetics</Text>
                  <Text style={styles.settingDesc}>
                    Lock workspace to premium high contrast light interface matching standard SaaS aesthetics.
                  </Text>
                </View>
                <Switch
                  value={!isDarkMode}
                  onValueChange={(val) => setIsDarkMode(!val)}
                  trackColor={{ false: "#e4e4e7", true: "#d9f99d" }}
                  thumbColor={!isDarkMode ? "#84cc16" : "#a1a1aa"}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.appearanceItem}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.settingLabel}>Optimal Auto-scheduling</Text>
                  <Text style={styles.settingDesc}>
                    Deploy posts dynamically during verified peak traffic slots for linked channels.
                  </Text>
                </View>
                <Switch value={true} disabled trackColor={{ false: "#e4e4e7", true: "#d9f99d" }} />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Palette color="#71717a" size={18} />
              <Text style={styles.infoBoxText}>
                Onion AI uses specialized hex keys (`#84cc16` Lime, `#09090b` Coal, `#ffffff` Paper) to ensure optimal focus and a premium native aesthetic.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f4f5f0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#09090b",
  },
  subtitle: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 4,
    borderRadius: 20,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
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
  scroll: {
    padding: 20,
    paddingBottom: 120,
  },
  tabContent: {
    width: "100%",
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f4f4f5",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#09090b",
  },
  profileEmail: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  verifiedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#84cc16",
  },
  divider: {
    height: 1,
    backgroundColor: "#f4f4f5",
    marginVertical: 20,
  },
  profileDetailsList: {
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailKey: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  detailVal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#18181b",
    maxWidth: 160,
  },
  detailPlanBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#3f6212",
    backgroundColor: "#d9f99d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  signOutButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 20,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: "#71717a",
    lineHeight: 16,
  },
  channelsIntroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  introHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#09090b",
  },
  introDesc: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 4,
    lineHeight: 18,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 10,
  },
  errorBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
    borderRadius: 20,
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
    marginTop: 10,
  },
  errorSub: {
    fontSize: 11,
    color: "#7f1d1d",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  channelsList: {
    gap: 16,
  },
  channelItemCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 20,
    padding: 16,
  },
  channelItemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  channelBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  channelBadgeLetter: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
  channelName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  channelHandle: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 1,
  },
  channelHandleUnlinked: {
    fontSize: 11,
    color: "#a1a1aa",
    marginTop: 1,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: "700",
  },
  channelActionRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    paddingTop: 12,
  },
  channelBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  channelBtnDisconnect: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  channelBtnConnect: {
    backgroundColor: "#84cc16",
    flexDirection: "row",
    gap: 6,
  },
  channelBtnTextDisconnect: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
  },
  channelBtnTextConnect: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  appearanceCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  appearanceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#09090b",
  },
  settingDesc: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 4,
    lineHeight: 16,
  },
});

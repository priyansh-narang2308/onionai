import { Tabs } from "expo-router";
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  UIManager,
} from "react-native";
import {
  Lightbulb,
  Calendar,
  CreditCard,
  Settings,
  BarChart3,
} from "lucide-react-native";
import React from "react";

// Enable LayoutAnimation for Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            if (Platform.OS !== "web") {
              LayoutAnimation.configureNext({
                duration: 250,
                create: {
                  type: LayoutAnimation.Types.easeInEaseOut,
                  property: LayoutAnimation.Properties.opacity,
                },
                update: {
                  type: LayoutAnimation.Types.easeInEaseOut,
                },
              });
            }
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const renderIcon = (color: string, size: number) => {
          const strokeWidth = 2.2;
          switch (route.name) {
            case "ideas":
              return (
                <Lightbulb
                  color={color}
                  size={size}
                  strokeWidth={strokeWidth}
                />
              );
            case "schedule":
              return (
                <Calendar color={color} size={size} strokeWidth={strokeWidth} />
              );
            case "dashboard":
              return (
                <BarChart3
                  color={color}
                  size={size}
                  strokeWidth={strokeWidth}
                />
              );
            case "billing":
              return (
                <CreditCard
                  color={color}
                  size={size}
                  strokeWidth={strokeWidth}
                />
              );
            case "settings":
              return (
                <Settings color={color} size={size} strokeWidth={strokeWidth} />
              );
            default:
              return (
                <Lightbulb
                  color={color}
                  size={size}
                  strokeWidth={strokeWidth}
                />
              );
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            {isFocused ? (
              <View style={styles.activePill}>
                {renderIcon("#84cc16", 18)}
                <Text style={styles.activeLabel}>{label}</Text>
              </View>
            ) : (
              <View style={styles.inactiveContainer}>
                {renderIcon("#71717a", 20)}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="ideas"
        options={{
          title: "Ideas",
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 32 : 20,
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    // Elevated drop shadows for light theme
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(132, 204, 22, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(132, 204, 22, 0.2)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  activeLabel: {
    color: "#4d7c0f",
    fontSize: 12,
    fontWeight: "700",
  },
  inactiveContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

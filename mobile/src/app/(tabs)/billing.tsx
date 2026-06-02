import React, { useState } from "react"
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { CreditCard, Check, Sparkles, Zap, ShieldCheck } from "lucide-react-native"
import { useToast } from "../../components/ui/toast"

export default function BillingTab() {
  const [isYearly, setIsYearly] = useState(false)
  const [activePlan, setActivePlan] = useState<"free" | "pro" | "premium">("pro")
  const { toast } = useToast()

  const plans = [
    {
      id: "free" as const,
      name: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      desc: "Perfect for testing",
      icon: CreditCard,
      color: "#71717a",
      bgLight: "#f4f4f5",
      features: ["1 Connected Channel", "10 Posts/mo", "Basic Tone Adaptations"],
    },
    {
      id: "pro" as const,
      name: "Pro",
      priceMonthly: 19,
      priceYearly: 15,
      desc: "For growing creators",
      icon: Zap,
      color: "#84cc16",
      bgLight: "#f4f5f0",
      features: ["5 Connected Channels", "Unlimited Posts", "AI Tone Presets", "Optimal Timing", "Chat Support"],
      popular: true,
    },
    {
      id: "premium" as const,
      name: "Premium",
      priceMonthly: 49,
      priceYearly: 39,
      desc: "For agencies & teams",
      icon: Sparkles,
      color: "#09090b",
      bgLight: "#f4f4f5",
      features: ["Unlimited Channels", "Unlimited Posts", "Custom AI Presets", "Video/Image Support", "24/7 Support", "Team Access"],
    },
  ]

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <CreditCard color="#84cc16" size={24} />
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.title}>Billing</Text>
          <Text style={styles.subtitle}>Manage your subscription</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.toggleCard}>
          <Text style={[styles.toggleText, !isYearly && styles.toggleTextActive]}>Monthly</Text>
          <Switch
            value={isYearly}
            onValueChange={setIsYearly}
            trackColor={{ false: "#e4e4e7", true: "#d9f99d" }}
            thumbColor={isYearly ? "#84cc16" : "#a1a1aa"}
            ios_backgroundColor="#e4e4e7"
          />
          <View style={styles.yearlyLabelRow}>
            <Text style={[styles.toggleText, isYearly && styles.toggleTextActive]}>Annual</Text>
            <View style={styles.discountBadge}><Text style={styles.discountText}>SAVE 20%</Text></View>
          </View>
        </View>

        {plans.map((plan) => {
          const PlanIcon = plan.icon
          const isSelected = activePlan === plan.id
          const price = isYearly ? plan.priceYearly : plan.priceMonthly

          return (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.9}
              onPress={() => setActivePlan(plan.id)}
              style={[styles.planCard, isSelected && styles.planCardSelected, plan.popular && styles.planCardPopular]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              )}
              <View style={styles.planCardHeader}>
                <View style={[styles.planIconContainer, { backgroundColor: plan.bgLight }]}>
                  <PlanIcon color={plan.color} size={22} strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDesc}>{plan.desc}</Text>
                </View>
              </View>
              {plan.id !== "free" && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceSymbol}>$</Text>
                  <Text style={styles.priceValue}>{price}</Text>
                  <Text style={styles.pricePeriod}>/mo</Text>
                  {isYearly && <Text style={styles.billedAnnuallyText}>billed annually</Text>}
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.featuresList}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Check color={plan.color} size={16} strokeWidth={3} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setActivePlan(plan.id)
                  if (plan.id !== "free") toast(`Checkout for ${plan.name} coming soon!`)
                }}
                style={[styles.planButton, isSelected && styles.planButtonSelected]}
              >
                <Text style={[styles.planButtonText, isSelected && styles.planButtonTextSelected]}>
                  {isSelected ? "Current Plan" : `Upgrade to ${plan.name}`}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })}

        <View style={styles.guaranteeBox}>
          <ShieldCheck color="#71717a" size={20} />
          <Text style={styles.guaranteeText}>
            Secure payments powered by Stripe. Cancel anytime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f4f4f5" },
  iconBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#f4f5f0", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#09090b" },
  subtitle: { fontSize: 12, color: "#71717a", marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 120 },
  toggleCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#f4f4f5", borderRadius: 20, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 20, gap: 12 },
  toggleText: { fontSize: 13, fontWeight: "600", color: "#71717a" },
  toggleTextActive: { color: "#09090b", fontWeight: "700" },
  yearlyLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  discountBadge: { backgroundColor: "#d9f99d", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  discountText: { fontSize: 9, fontWeight: "800", color: "#3f6212" },
  planCard: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 24, padding: 20, marginBottom: 20, position: "relative" },
  planCardSelected: { borderColor: "#84cc16", borderWidth: 2 },
  planCardPopular: { borderColor: "#a3e635", borderWidth: 1.5 },
  popularBadge: { position: "absolute", top: -12, right: 20, backgroundColor: "#84cc16", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  popularBadgeText: { color: "#ffffff", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  planCardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  planIconContainer: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  planName: { fontSize: 16, fontWeight: "700", color: "#09090b" },
  planDesc: { fontSize: 12, color: "#71717a", marginTop: 4, lineHeight: 16 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 16 },
  priceSymbol: { fontSize: 18, fontWeight: "700", color: "#09090b" },
  priceValue: { fontSize: 32, fontWeight: "800", color: "#09090b" },
  pricePeriod: { fontSize: 14, color: "#71717a", fontWeight: "500", marginLeft: 2 },
  billedAnnuallyText: { fontSize: 11, color: "#84cc16", fontWeight: "600", marginLeft: 10 },
  divider: { height: 1, backgroundColor: "#f4f4f5", marginBottom: 16 },
  featuresList: { gap: 10, marginBottom: 20 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 13, color: "#3f3f46", fontWeight: "500" },
  planButton: { backgroundColor: "#f4f4f5", borderRadius: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e4e4e7" },
  planButtonSelected: { backgroundColor: "#09090b", borderColor: "#09090b" },
  planButtonText: { fontSize: 14, fontWeight: "700", color: "#18181b" },
  planButtonTextSelected: { color: "#ffffff" },
  guaranteeBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f4f4f5", borderRadius: 16, padding: 16, gap: 12, marginTop: 10 },
  guaranteeText: { flex: 1, fontSize: 11, color: "#71717a", lineHeight: 16 },
})

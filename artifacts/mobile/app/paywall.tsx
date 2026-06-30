import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLists } from "@/context/ListsContext";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  { icon: "list" as const, text: "Unlimited decision lists" },
  { icon: "shuffle" as const, text: "Unlimited shuffles" },
  { icon: "star" as const, text: "Priority support" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { unlockPremium } = useLists();
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handlePurchase() {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 1200));
    await unlockPremium();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Close */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 8 }]}
        onPress={() => router.back()}
      >
        <Feather name="x" size={20} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View style={[styles.content, { paddingTop: topPad + 60, paddingBottom: bottomPad + 24 }]}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="zap" size={36} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Unlock Unlimited
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          You've reached the 3-list limit on the free plan. Upgrade to keep creating.
        </Text>

        {/* Features */}
        <View style={[styles.featureList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((f, i) => (
            <View
              key={f.text}
              style={[
                styles.featureRow,
                i < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name={f.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
              <Feather name="check" size={16} color={colors.success as string} />
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        {/* Price */}
        <Text style={[styles.price, { color: colors.foreground }]}>$2.99</Text>
        <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>
          One-time purchase · No subscription
        </Text>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaBtnText}>Unlock Now</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.restoreBtn}>
          <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
            Restore Purchase
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: "absolute",
    right: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 4,
  },
  featureList: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  spacer: { flex: 1 },
  price: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  priceNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
    marginBottom: 4,
  },
  ctaBtn: {
    width: "100%",
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#7B5EF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  restoreBtn: {
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});

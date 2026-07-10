import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Check, ClipboardPaste, List, ListChecks, X, Zap } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FREE_LIST_LIMIT } from "@/context/ListsContext";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";

const FEATURES = [
  { Icon: List, text: "Unlimited decision lists" },
  { Icon: ListChecks, text: "Cross off picks — no repeats until you reset" },
  { Icon: ClipboardPaste, text: "Paste in a full list instantly" },
  { Icon: Zap, text: "Priority support" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore, isPurchasing, isRestoring } = useSubscription();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const currentOffering = offerings?.current;
  const packageToPurchase = currentOffering?.availablePackages[0];
  const priceString = packageToPurchase?.product.priceString ?? "$0.99";

  async function performPurchase() {
    if (!packageToPurchase) {
      setError("This offer isn't available right now. Please try again later.");
      return;
    }
    setError(null);
    setConfirmVisible(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await purchase(packageToPurchase);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      if (!err?.userCancelled) {
        setError(err?.message ?? "Purchase failed. Please try again.");
      }
    }
  }

  function handlePurchase() {
    setConfirmVisible(true);
  }

  async function handleRestore() {
    setError(null);
    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err?.message ?? "Restore failed. Please try again.");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 8 }]}
        onPress={() => router.back()}
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <X size={20} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View style={[styles.content, { paddingTop: topPad + 60, paddingBottom: bottomPad + 24 }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "22" }]}>
          <Zap size={36} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Unlock Choosr Premium</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          The free plan is capped at {FREE_LIST_LIMIT} lists. Upgrade for unlimited lists and smarter decision tools.
        </Text>

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
                <f.Icon size={16} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
              <Check size={16} color={colors.success as string} />
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        {error && (
          <Text style={[styles.errorText, { color: colors.destructive as string }]}>{error}</Text>
        )}

        <Text style={[styles.price, { color: colors.foreground }]}>{priceString}</Text>
        <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>
          One-time purchase · No subscription
        </Text>

        <TouchableOpacity
          testID="paywall-unlock-btn"
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={handlePurchase}
          disabled={isPurchasing || isRestoring}
          activeOpacity={0.85}
        >
          {isPurchasing ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaBtnText}>Unlock Now</Text>}
        </TouchableOpacity>

        <TouchableOpacity testID="paywall-restore-btn" onPress={handleRestore} style={styles.restoreBtn} disabled={isRestoring || isPurchasing}>
          {isRestoring ? (
            <ActivityIndicator color={colors.mutedForeground} size="small" />
          ) : (
            <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>Restore Purchase</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Confirm Purchase</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              This is a test purchase for {priceString}. No real charge will be made in test mode.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="paywall-confirm-btn"
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={performPurchase}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: "absolute", right: 20, width: 36, height: 36, alignItems: "center", justifyContent: "center", zIndex: 10 },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 28, gap: 16 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21, marginBottom: 4 },
  featureList: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden", marginTop: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  featureIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  spacer: { flex: 1 },
  price: { fontSize: 40, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  priceNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -8, marginBottom: 4 },
  ctaBtn: {
    width: "100%", paddingVertical: 17, borderRadius: 18, alignItems: "center",
    boxShadow: "0px 4px 14px rgba(123,94,246,0.4)",
  },
  ctaBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17 },
  restoreBtn: { paddingVertical: 8 },
  restoreText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 28 },
  modalCard: { width: "100%", borderRadius: 20, padding: 22, gap: 8 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
  modalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});

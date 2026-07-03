import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ChevronRight, Dices, Shuffle, X } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FREE_LIST_LIMIT, useLists } from "@/context/ListsContext";
import { useColors } from "@/hooks/useColors";

const WHEEL_EMOJI = "\u{1F3AF}";

const MODES = [
  {
    key: "shuffle" as const,
    title: "Shuffle",
    desc: "Cycle through your options and land on one at random.",
    Icon: Shuffle,
  },
  {
    key: "wheel" as const,
    title: "Spin the Wheel",
    desc: "Spin a wheel divided into your options to pick a winner.",
    Icon: null,
  },
  {
    key: "dice" as const,
    title: "Roll the Dice",
    desc: "Roll a die instantly \u2014 no list needed.",
    Icon: Dices,
  },
];

export default function ModeSelectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lists, isPremium } = useLists();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handlePick(mode: "shuffle" | "wheel" | "dice") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === "dice") {
      router.push("/dice");
      return;
    }
    if (!isPremium && lists.length >= FREE_LIST_LIMIT) {
      router.replace("/paywall");
      return;
    }
    router.push({ pathname: "/editor", params: { mode } });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 12, paddingBottom: bottomPad + 24 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>How do you want to decide?</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.cards}>
        {MODES.map(({ key, title, desc, Icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => handlePick(key)}
            activeOpacity={0.85}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
              {Icon ? (
                <Icon size={24} color={colors.primary} />
              ) : (
                <Text style={{ fontSize: 22 }}>{WHEEL_EMOJI}</Text>
              )}
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
              <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{desc}</Text>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  title: { flex: 1, fontSize: 24, fontFamily: "Inter_700Bold", paddingRight: 12 },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  cards: { gap: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});

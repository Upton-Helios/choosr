import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { RotateCw, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Die } from "@/components/Die";
import { useColors } from "@/hooks/useColors";

export default function DiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [value, setValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimeouts() {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }

  function handleRoll() {
    if (rolling) return;
    setRolling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    rotateAnim.setValue(0);
    Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 30 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 14 }),
    ]).start();

    const frames = 10;
    let i = 0;
    let delay = 60;
    function tick() {
      setValue(1 + Math.floor(Math.random() * 6));
      i++;
      if (i % 2 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (i < frames) {
        delay = Math.min(delay * 1.18, 180);
        const t = setTimeout(tick, delay);
        timeouts.current.push(t);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRolling(false);
      }
    }
    tick();
  }

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => { clearTimeouts(); router.back(); }} style={styles.closeBtn}>
          <X size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.foreground }]}>Roll the Dice</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Tap the button below to roll a six-sided die.
        </Text>

        <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate }], marginTop: 32 }}>
          <Die value={value} size={140} color={colors.card} pipColor={colors.primary} borderColor={colors.border} />
        </Animated.View>

        {!rolling && (
          <View style={[styles.resultBadge, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.resultText, { color: colors.primary }]}>You rolled a {value}</Text>
          </View>
        )}
      </View>

      <View style={[styles.actions, { paddingBottom: bottomPad + 24 }]}>
        <TouchableOpacity
          style={[styles.rollBtn, { backgroundColor: colors.primary }]}
          onPress={handleRoll}
          disabled={rolling}
          activeOpacity={0.85}
        >
          <RotateCw size={20} color="#fff" />
          <Text style={styles.rollBtnText}>{rolling ? "Rolling..." : "Roll"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, flexDirection: "row", justifyContent: "flex-end" },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, lineHeight: 20 },
  resultBadge: { marginTop: 28, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  resultText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  actions: { paddingHorizontal: 24 },
  rollBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 17, borderRadius: 18,
    shadowColor: "#7B5EF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  rollBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17 },
});

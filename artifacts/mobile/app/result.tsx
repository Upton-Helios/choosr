import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle, Pencil, RotateCcw, Shuffle } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLists } from "@/context/ListsContext";
import { useColors } from "@/hooks/useColors";

type Phase = "idle" | "spinning" | "reveal";

function buildFrames(options: string[], winner: string): Array<{ text: string; delay: number }> {
  const frames: Array<{ text: string; delay: number }> = [];
  const totalFrames = 22;
  let delay = 55;
  let idx = Math.floor(Math.random() * options.length);
  for (let i = 0; i < totalFrames; i++) {
    frames.push({ text: options[idx % options.length], delay });
    idx++;
    if (i > 10) delay = Math.min(delay * 1.25, 340);
    else delay = Math.min(delay * 1.05, 200);
  }
  frames.push({ text: winner, delay: 0 });
  return frames;
}

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { lists, updateLastPick, crossOffOption, resetCrossedOff } = useLists();

  const list = lists.find((l) => l.id === listId);

  const [phase, setPhase] = useState<Phase>("idle");
  const [displayed, setDisplayed] = useState<string>("");
  const [winner, setWinner] = useState<string>("");

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const crossOffMode = !!list?.crossOffMode;
  const crossedOff = useMemo(() => list?.crossedOff ?? [], [list]);
  const remaining = useMemo(
    () => (list ? list.options.filter((o) => !crossedOff.includes(o)) : []),
    [list, crossedOff]
  );
  const allUsed = crossOffMode && remaining.length === 0;

  function clearTimeouts() {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }

  const runShuffle = useCallback((poolOverride?: string[]) => {
    if (!list) return;
    const pool = poolOverride ?? (crossOffMode ? remaining : list.options);
    if (pool.length === 0) return;
    clearTimeouts();
    setPhase("spinning");

    const pick = pool[Math.floor(Math.random() * pool.length)];
    const frames = buildFrames(pool, pick);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    glowAnim.setValue(0);
    scaleAnim.setValue(1);

    let accumulated = 0;
    frames.forEach((frame, i) => {
      const t = setTimeout(() => {
        setDisplayed(frame.text);
        if (i % 3 === 0 && i < frames.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        if (i === frames.length - 1) {
          setWinner(pick);
          setPhase("reveal");
          updateLastPick(listId, pick);
          if (crossOffMode) crossOffOption(listId, pick);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1.08, useNativeDriver: true, friction: 4 }),
            Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          ]).start(() => {
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
          });
        }
      }, accumulated);
      timeouts.current.push(t);
      accumulated += frame.delay;
    });
  }, [list, listId, updateLastPick, crossOffMode, remaining, crossOffOption]);

  useEffect(() => {
    if (list && phase === "idle" && !allUsed) {
      const t = setTimeout(() => runShuffle(), 300);
      return () => clearTimeout(t);
    }
  }, []);

  function handleReset() {
    if (!list) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetCrossedOff(listId);
    // Context state hasn't propagated yet, so shuffle the full option pool directly
    runShuffle(list.options);
  }

  useEffect(() => { return () => clearTimeouts(); }, []);

  if (!list) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>List not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { clearTimeouts(); router.back(); }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={[styles.listName, { color: colors.foreground }]}>
            &ldquo;{list.name}&rdquo;
          </Text>
        </View>
      </View>

      <View style={styles.revealArea}>
        <Animated.View
          style={[
            styles.resultCard,
            {
              backgroundColor: colors.card,
              borderColor: phase === "reveal" ? colors.primary : colors.border,
              transform: [{ scale: scaleAnim }],
              boxShadow: phase === "reveal" ? "0px 0px 24px rgba(123,94,246,0.5)" : "none",
            },
          ]}
        >
          {phase === "idle" ? (
            <Text style={[styles.idleText, { color: colors.mutedForeground }]}>
              {allUsed ? "All options have been picked 🎉" : "Getting ready..."}
            </Text>
          ) : (
            <Text
              style={[
                styles.resultText,
                {
                  color: phase === "reveal" ? colors.foreground : colors.mutedForeground,
                  fontFamily: phase === "reveal" ? "Inter_700Bold" : "Inter_400Regular",
                },
              ]}
              numberOfLines={3}
              adjustsFontSizeToFit
            >
              {displayed}
            </Text>
          )}
        </Animated.View>

        {phase === "reveal" && (
          <View style={styles.winnerLabel}>
            <View style={[styles.winnerBadge, { backgroundColor: colors.success + "22" }]}>
              <CheckCircle size={14} color={colors.success as string} />
              <Text style={[styles.winnerBadgeText, { color: colors.success as string }]}>The Pick</Text>
            </View>
          </View>
        )}
      </View>

      {crossOffMode && (
        <View style={styles.chipsWrap}>
          {list.options.map((opt, i) => {
            const isCrossed = crossedOff.includes(opt);
            return (
              <View
                key={`${opt}-${i}`}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isCrossed ? colors.muted : colors.card,
                    borderColor: isCrossed ? colors.border : colors.primary + "55",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isCrossed
                      ? { color: colors.mutedForeground, textDecorationLine: "line-through" }
                      : { color: colors.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {opt}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Text style={[styles.optionsHint, { color: colors.mutedForeground }]}>
        {crossOffMode
          ? `${remaining.length} of ${list.options.length} option${list.options.length !== 1 ? "s" : ""} remaining`
          : `${list.options.length} option${list.options.length !== 1 ? "s" : ""}`}
      </Text>

      <View style={[styles.actions, { paddingBottom: bottomPad + 24 }]}>
        {allUsed && phase !== "spinning" ? (
          <TouchableOpacity
            style={[styles.reshuffleBtn, { backgroundColor: colors.primary }]}
            onPress={handleReset}
            activeOpacity={0.85}
            accessibilityLabel="Reset list and shuffle"
            accessibilityRole="button"
          >
            <RotateCcw size={20} color="#fff" />
            <Text style={styles.reshuffleBtnText}>Start Over</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.reshuffleBtn, { backgroundColor: colors.primary }]}
            onPress={() => runShuffle()}
            disabled={phase === "spinning"}
            activeOpacity={0.85}
            accessibilityLabel="Shuffle again"
            accessibilityRole="button"
          >
            <Shuffle size={20} color="#fff" />
            <Text style={styles.reshuffleBtnText}>Shuffle Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => { clearTimeouts(); router.replace({ pathname: "/editor", params: { listId } }); }}
          accessibilityLabel="Edit list"
          accessibilityRole="button"
        >
          <Pencil size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  header: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  backBtn: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  listName: { fontSize: 46, fontFamily: "NowAlt_900Black", letterSpacing: 0.2, textAlign: "center" },
  revealArea: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%", paddingHorizontal: 32, gap: 16 },
  resultCard: { width: "100%", minHeight: 180, borderRadius: 28, borderWidth: 2, alignItems: "center", justifyContent: "center", padding: 32 },
  idleText: { fontSize: 18, fontFamily: "Inter_400Regular" },
  resultText: { fontSize: 36, textAlign: "center", lineHeight: 44 },
  winnerLabel: { alignItems: "center" },
  winnerBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  winnerBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  optionsHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 24 },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 160,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  actions: { flexDirection: "row", gap: 12, paddingHorizontal: 24, width: "100%" },
  reshuffleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 16, borderRadius: 18,
    boxShadow: "0px 4px 12px rgba(123,94,246,0.35)",
  },
  reshuffleBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  editBtn: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular", marginTop: 100 },
});

import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle, Pencil, Shuffle } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SpinWheel } from "@/components/SpinWheel";
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
  const { lists, updateLastPick } = useLists();

  const list = lists.find((l) => l.id === listId);

  const isWheel = list?.mode === "wheel";

  const [phase, setPhase] = useState<Phase>("idle");
  const [displayed, setDisplayed] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [wheelTargetIndex, setWheelTargetIndex] = useState<number | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function clearTimeouts() {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }

  const runShuffle = useCallback(() => {
    if (!list || list.options.length < 2) return;
    clearTimeouts();
    setPhase("spinning");

    const pick = list.options[Math.floor(Math.random() * list.options.length)];
    const frames = buildFrames(list.options, pick);

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
  }, [list, listId, updateLastPick]);

  const runWheel = useCallback(() => {
    if (!list || list.options.length < 2) return;
    setPhase("spinning");
    const idx = Math.floor(Math.random() * list.options.length);
    setWheelTargetIndex(idx);
  }, [list]);

  function handleWheelSpinEnd() {
    if (!list || wheelTargetIndex === null) return;
    const pick = list.options[wheelTargetIndex];
    setWinner(pick);
    setPhase("reveal");
    updateLastPick(listId, pick);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const runPick = isWheel ? runWheel : runShuffle;

  useEffect(() => {
    if (list && phase === "idle") {
      const t = setTimeout(runPick, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          >
            <ArrowLeft size={22} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={[styles.listName, { color: colors.foreground }]}>
            &ldquo;{list.name}&rdquo;
          </Text>
        </View>
      </View>

      <View style={styles.revealArea}>
        {isWheel ? (
          <>
            <SpinWheel
              options={list.options}
              spinning={phase === "spinning"}
              targetIndex={wheelTargetIndex}
              onSpinEnd={handleWheelSpinEnd}
            />
            {phase === "reveal" && (
              <View style={[styles.wheelWinnerCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <Text style={[styles.wheelWinnerText, { color: colors.foreground }]} numberOfLines={2} adjustsFontSizeToFit>
                  {winner}
                </Text>
              </View>
            )}
            {phase === "reveal" && (
              <View style={styles.winnerLabel}>
                <View style={[styles.winnerBadge, { backgroundColor: colors.success + "22" }]}>
                  <CheckCircle size={14} color={colors.success as string} />
                  <Text style={[styles.winnerBadgeText, { color: colors.success as string }]}>The Pick</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <Animated.View
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.card,
                  borderColor: phase === "reveal" ? colors.primary : colors.border,
                  transform: [{ scale: scaleAnim }],
                  shadowColor: phase === "reveal" ? colors.primary : "transparent",
                  shadowOpacity: phase === "reveal" ? 0.5 : 0,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: phase === "reveal" ? 12 : 0,
                },
              ]}
            >
              {phase === "idle" ? (
                <Text style={[styles.idleText, { color: colors.mutedForeground }]}>Getting ready...</Text>
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
          </>
        )}
      </View>

      <Text style={[styles.optionsHint, { color: colors.mutedForeground }]}>
        {list.options.length} option{list.options.length !== 1 ? "s" : ""}
      </Text>

      <View style={[styles.actions, { paddingBottom: bottomPad + 24 }]}>
        <TouchableOpacity
          style={[styles.reshuffleBtn, { backgroundColor: colors.primary }]}
          onPress={runPick}
          disabled={phase === "spinning"}
          activeOpacity={0.85}
        >
          <Shuffle size={20} color="#fff" />
          <Text style={styles.reshuffleBtnText}>{isWheel ? "Spin Again" : "Shuffle Again"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => { clearTimeouts(); router.replace({ pathname: "/editor", params: { listId } }); }}
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
  wheelWinnerCard: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, borderWidth: 2, minWidth: "80%", alignItems: "center" },
  wheelWinnerText: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  winnerLabel: { alignItems: "center", marginTop: 10 },
  winnerBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  winnerBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  optionsHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 24 },
  actions: { flexDirection: "row", gap: 12, paddingHorizontal: 24, width: "100%" },
  reshuffleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 16, borderRadius: 18,
    shadowColor: "#7B5EF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  reshuffleBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  editBtn: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular", marginTop: 100 },
});

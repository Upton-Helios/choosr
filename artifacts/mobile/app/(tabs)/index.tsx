import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Clock,
  Crown,
  ListChecks,
  Plus,
  Shuffle,
  Sparkles,
} from "lucide-react-native";
import React, { useMemo, useRef } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const logoSource = require("@/assets/images/choosr-logo-new.png");

import { getCategoryForList } from "@/constants/categories";
import {
  DecisionList,
  FREE_LIST_LIMIT,
  useLists,
} from "@/context/ListsContext";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function ListCard({
  item,
  onPress,
  onEdit,
  onDelete,
}: {
  item: DecisionList;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const shuffleScale = useRef(new Animated.Value(1)).current;
  const category = useMemo(() => getCategoryForList(item.name), [item.name]);

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }
  function handleShufflePressIn() {
    Animated.spring(shuffleScale, { toValue: 0.92, useNativeDriver: true, speed: 30 }).start();
  }
  function handleShufflePressOut() {
    Animated.spring(shuffleScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  }
  function handleLongPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(item.name, "What would you like to do?", [
      { text: "Edit", onPress: onEdit },
      { text: "Delete", style: "destructive", onPress: onDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const dotCount = Math.min(item.options.length, 6);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: category.color + "20" }]}>
            <Text style={styles.iconEmoji}>{category.emoji}</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.cardMetaRow}>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {item.options.length} choice{item.options.length !== 1 ? "s" : ""}
              </Text>
              <View style={styles.dotsRow}>
                {Array.from({ length: dotCount }).map((_, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: category.color }]} />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

        <View style={styles.cardBottom}>
          {item.lastPick ? (
            <View style={styles.lastPickRow}>
              <View style={[styles.clockWrap, { backgroundColor: colors.secondary }]}>
                <Clock size={13} color={colors.mutedForeground} />
              </View>
              <View>
                <Text style={[styles.lastPickLabel, { color: colors.mutedForeground }]}>Last Pick</Text>
                <Text style={[styles.lastPickValue, { color: colors.foreground }]} numberOfLines={1}>
                  {item.lastPick}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.noPickYet, { color: colors.mutedForeground }]}>Not shuffled yet</Text>
          )}

          <Animated.View style={{ transform: [{ scale: shuffleScale }] }}>
            <TouchableOpacity
              onPress={onPress}
              onPressIn={handleShufflePressIn}
              onPressOut={handleShufflePressOut}
              activeOpacity={0.9}
              style={[styles.shuffleBtn, { backgroundColor: colors.primary }]}
            >
              <Shuffle size={16} color="#fff" />
              <Text style={styles.shuffleBtnText}>Shuffle</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lists, deleteList } = useLists();
  const { isSubscribed: isPremium } = useSubscription();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalChoices = useMemo(
    () => lists.reduce((sum, l) => sum + l.options.length, 0),
    [lists]
  );

  function handleNewList() {
    if (!isPremium && lists.length >= FREE_LIST_LIMIT) {
      router.push("/paywall");
      return;
    }
    router.push("/editor");
  }

  function handleDelete(id: string) {
    Alert.alert("Delete List", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteList(id) },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#EFEBFF", "#F8F7FF", "#F8F7FF"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Status bar backdrop */}
      <View style={[styles.statusBarBg, { height: topPad, backgroundColor: colors.primary }]} />

      {/* Header section */}
      <View style={styles.header}>
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextCol}>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                {getGreeting()} 👋
              </Text>
              <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/paywall")}
              style={[
                styles.crownBadge,
                { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" },
              ]}
            >
              <Crown size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.card }]}>
                <ListChecks size={14} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{lists.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  List{lists.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.card }]}>
                <Sparkles size={14} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{totalChoices}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Total choices
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {lists.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyIconEmoji}>🎲</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Let's make your first list</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Food, movie night, baby names, date ideas — add your options and let Choosr decide.
          </Text>
          <TouchableOpacity
            testID="new-list-empty-btn"
            onPress={handleNewList}
            activeOpacity={0.85}
            style={[styles.emptyCta, { backgroundColor: colors.primary }]}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.emptyCtaText}>Create List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.listHeaderRow}>
            <Text style={[styles.listHeaderTitle, { color: colors.foreground }]}>Your Lists</Text>
            <TouchableOpacity
              onPress={handleNewList}
              style={[styles.newListPill, { backgroundColor: colors.secondary }]}
              activeOpacity={0.8}
            >
              <Plus size={14} color={colors.primary} />
              <Text style={[styles.newListPillText, { color: colors.primary }]}>New List</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ListCard
                item={item}
                onPress={() => router.push({ pathname: "/result", params: { listId: item.id } })}
                onEdit={() => router.push({ pathname: "/editor", params: { listId: item.id } })}
                onDelete={() => handleDelete(item.id)}
              />
            )}
          />
        </>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 24 }]}
        onPress={handleNewList}
        activeOpacity={0.85}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBarBg: {
    width: "100%",
  },
  header: {
    paddingBottom: 20,
  },
  headerCard: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderWidth: 1,
    borderTopWidth: 0,
    padding: 20,
    paddingTop: 24,
    gap: 16,
    shadowColor: "#7B5EF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextCol: { flex: 1 },
  greeting: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 6 },
  logo: { width: 148, height: 40 },
  crownBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  statDivider: { width: 1, height: 32, marginHorizontal: 12 },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", flexShrink: 1 },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  listHeaderTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  newListPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  newListPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconEmoji: { fontSize: 24 },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dotsRow: { flexDirection: "row", gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  cardDivider: { height: 1, width: "100%" },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lastPickRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  clockWrap: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  lastPickLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  lastPickValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  noPickYet: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  shuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#7B5EF6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shuffleBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
  },
  emptyIconEmoji: { fontSize: 42 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#7B5EF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyCtaText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  fab: {
    position: "absolute",
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7B5EF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

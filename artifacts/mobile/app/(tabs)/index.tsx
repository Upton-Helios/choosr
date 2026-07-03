import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { List, Moon, Plus, Shuffle, Sun, Zap } from "lucide-react-native";
import React, { useRef } from "react";
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

const logoSource = require("@/assets/images/choosr-logo.png");

import {
  DecisionList,
  FREE_LIST_LIMIT,
  useLists,
} from "@/context/ListsContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

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

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  }
  function handleLongPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(item.name, "What would you like to do?", [
      { text: "Edit", onPress: onEdit },
      { text: "Delete", style: "destructive", onPress: onDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
            <List size={20} color={colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {item.options.length} option{item.options.length !== 1 ? "s" : ""}
              {item.lastPick ? ` · Last: ${item.lastPick}` : ""}
            </Text>
          </View>
        </View>
        <View style={[styles.shuffleBtn, { backgroundColor: colors.primary }]}>
          <Shuffle size={18} color="#fff" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lists, isPremium, deleteList } = useLists();
  const { isDark, toggleTheme } = useTheme();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
      {/* Header section */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 16,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View
            style={[
              styles.logoWrap,
              isDark && { backgroundColor: "#FFFFFF" },
            ]}
          >
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.headerActions}>
            {!isPremium && (
              <TouchableOpacity
                onPress={() => router.push("/paywall")}
                style={[
                  styles.premiumBadge,
                  { backgroundColor: colors.accent + "18", borderColor: colors.accent + "44" },
                ]}
              >
                <Zap size={12} color={colors.accent} />
                <Text style={[styles.premiumText, { color: colors.accent }]}>Unlimited</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTheme();
              }}
              style={[styles.themeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              {isDark ? (
                <Sun size={18} color={colors.mutedForeground} />
              ) : (
                <Moon size={18} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {lists.length === 0
            ? "No lists yet"
            : `${lists.length} list${lists.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {lists.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Shuffle size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No decision lists yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Create your first list and let fate decide for you.
          </Text>
        </View>
      ) : (
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoWrap: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  logo: { width: 118, height: 34 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  premiumText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  shuffleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
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

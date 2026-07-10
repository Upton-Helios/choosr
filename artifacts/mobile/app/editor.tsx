import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ClipboardPaste, Crown, Plus, Trash2, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLists } from "@/context/ListsContext";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";

export default function EditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { listId } = useLocalSearchParams<{ listId?: string }>();
  const { lists, addList, updateList } = useLists();
  const { isSubscribed: isPremium } = useSubscription();

  const existing = listId ? lists.find((l) => l.id === listId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [options, setOptions] = useState<string[]>(existing?.options ?? []);
  const [crossOffMode, setCrossOffMode] = useState(existing?.crossOffMode ?? false);
  const [newOption, setNewOption] = useState("");
  const inputRef = useRef<TextInput>(null);

  const isEdit = !!existing;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleAddOption() {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOptions((prev) => [...prev, trimmed]);
    setNewOption("");
    inputRef.current?.focus();
  }

  function appendLines(lines: string[]) {
    setOptions((prev) => {
      const seen = new Set(prev.map((o) => o.toLowerCase()));
      const fresh = lines.filter((l) => {
        const key = l.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }

  // Pasting multi-line text into the option field adds one option per line
  function handleOptionChange(text: string) {
    if (!text.includes("\n")) {
      setNewOption(text);
      return;
    }
    const parts = text.split(/\r?\n/);
    const last = parts.pop() ?? "";
    const lines = parts.map((s) => s.trim()).filter(Boolean);
    if (lines.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      appendLines(lines);
    }
    setNewOption(last.trim());
  }

  function handleImportPress() {
    if (!isPremium) {
      router.push("/paywall");
      return;
    }
    handlePasteImport();
  }

  function handleCrossOffToggle(value: boolean) {
    if (value && !isPremium) {
      router.push("/paywall");
      return;
    }
    setCrossOffMode(value);
  }

  async function handlePasteImport() {
    let text = "";
    try {
      text = await Clipboard.getStringAsync();
    } catch {
      Alert.alert("Clipboard unavailable", "Couldn't read your clipboard on this device.");
      return;
    }
    const lines = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      Alert.alert("Nothing to import", "Copy a list first — one option per line — then tap Import.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    appendLines(lines);
  }

  function handleRemoveOption(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your list a name.");
      return;
    }
    if (options.length < 2) {
      Alert.alert("Need more options", "Add at least 2 options to decide between.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEdit) {
      updateList(listId!, name.trim(), options, crossOffMode);
    } else {
      addList(name.trim(), options, crossOffMode);
    }
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <X size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEdit ? "Edit List" : "New List"}
        </Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={16}
      >
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>LIST NAME</Text>
          <TextInput
            style={[styles.nameInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. Where to eat tonight"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            onSubmitEditing={() => inputRef.current?.focus()}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              OPTIONS ({options.length})
            </Text>
            <TouchableOpacity
              onPress={handleImportPress}
              style={[styles.importBtn, { backgroundColor: colors.secondary }]}
              accessibilityLabel={isPremium ? "Import options from clipboard" : "Import options from clipboard (Premium)"}
              accessibilityRole="button"
            >
              {!isPremium && <Crown size={12} color={colors.primary} />}
              <ClipboardPaste size={13} color={colors.primary} />
              <Text style={[styles.importBtnText, { color: colors.primary }]}>Import</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.addRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.optionInput, { color: colors.foreground }]}
              placeholder="Type an option..."
              placeholderTextColor={colors.mutedForeground}
              value={newOption}
              onChangeText={handleOptionChange}
              returnKeyType="done"
              onSubmitEditing={handleAddOption}
            />
            <TouchableOpacity
              onPress={handleAddOption}
              disabled={!newOption.trim()}
              style={[styles.addBtn, { backgroundColor: newOption.trim() ? colors.primary : colors.muted }]}
              accessibilityLabel="Add option"
              accessibilityRole="button"
            >
              <Plus size={18} color={newOption.trim() ? "#fff" : colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {options.length > 0 && (
            <View style={[styles.optionsList, { borderColor: colors.border }]}>
              {options.map((opt, i) => (
                <View
                  key={i}
                  style={[
                    styles.optionRow,
                    { backgroundColor: colors.card, borderBottomColor: i < options.length - 1 ? colors.border : "transparent" },
                  ]}
                >
                  <View style={[styles.optionIndex, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.optionIndexText, { color: colors.mutedForeground }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.optionText, { color: colors.foreground }]} numberOfLines={1}>{opt}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveOption(i)}
                    style={styles.removeBtn}
                    accessibilityLabel={`Remove option: ${opt}`}
                    accessibilityRole="button"
                  >
                    <Trash2 size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {options.length === 0 && (
            <View style={[styles.emptyOptions, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyOptionsText, { color: colors.mutedForeground }]}>
                Add at least 2 options to decide between
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.toggleTextCol}>
              <View style={styles.toggleTitleRow}>
                <Text style={[styles.toggleTitle, { color: colors.foreground }]}>Cross off picks</Text>
                {!isPremium && (
                  <View style={[styles.proBadge, { backgroundColor: colors.primary + "18" }]}>
                    <Crown size={10} color={colors.primary} />
                    <Text style={[styles.proBadgeText, { color: colors.primary }]}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.toggleDesc, { color: colors.mutedForeground }]}>
                Each pick sits out future shuffles until you reset the list
              </Text>
            </View>
            <Switch
              value={crossOffMode}
              onValueChange={handleCrossOffToggle}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor="#fff"
              accessibilityLabel="Cross off picks"
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  content: { padding: 20, gap: 24 },
  section: { gap: 10 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  importBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleTextCol: { flex: 1, gap: 2 },
  toggleTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toggleDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  nameInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "Inter_400Regular" },
  addRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, gap: 8 },
  optionInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 8 },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  optionsList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  optionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1 },
  optionIndex: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  optionIndexText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  optionText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  emptyOptions: { borderRadius: 14, borderWidth: 1, borderStyle: "dashed", padding: 20, alignItems: "center" },
  emptyOptionsText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});

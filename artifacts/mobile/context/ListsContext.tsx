import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ListMode = "shuffle" | "wheel";

export interface DecisionList {
  id: string;
  name: string;
  options: string[];
  mode: ListMode;
  lastPick?: string;
  createdAt: number;
}

interface ListsContextValue {
  lists: DecisionList[];
  isPremium: boolean;
  isLoaded: boolean;
  addList: (name: string, options: string[], mode: ListMode) => DecisionList;
  updateList: (id: string, name: string, options: string[], mode: ListMode) => void;
  deleteList: (id: string) => void;
  updateLastPick: (id: string, pick: string) => void;
  unlockPremium: () => void;
}

const ListsContext = createContext<ListsContextValue | null>(null);

const LISTS_KEY = "@decision_randomizer/lists";
const PREMIUM_KEY = "@decision_randomizer/premium";
export const FREE_LIST_LIMIT = 1;

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function ListsProvider({ children }: { children: React.ReactNode }) {
  const [lists, setLists] = useState<DecisionList[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [listsJson, premiumVal] = await Promise.all([
          AsyncStorage.getItem(LISTS_KEY),
          AsyncStorage.getItem(PREMIUM_KEY),
        ]);
        if (listsJson) {
          const parsed: DecisionList[] = JSON.parse(listsJson);
          setLists(parsed.map((l) => ({ ...l, mode: l.mode ?? "shuffle" })));
        }
        if (premiumVal === "true") setIsPremium(true);
      } catch {}
      setIsLoaded(true);
    }
    load();
  }, []);

  const saveLists = useCallback(async (updated: DecisionList[]) => {
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
  }, []);

  const addList = useCallback(
    (name: string, options: string[], mode: ListMode): DecisionList => {
      const newList: DecisionList = {
        id: generateId(),
        name,
        options,
        mode,
        createdAt: Date.now(),
      };
      setLists((prev) => {
        const updated = [newList, ...prev];
        saveLists(updated);
        return updated;
      });
      return newList;
    },
    [saveLists]
  );

  const updateList = useCallback(
    (id: string, name: string, options: string[], mode: ListMode) => {
      setLists((prev) => {
        const updated = prev.map((l) =>
          l.id === id ? { ...l, name, options, mode } : l
        );
        saveLists(updated);
        return updated;
      });
    },
    [saveLists]
  );

  const deleteList = useCallback(
    (id: string) => {
      setLists((prev) => {
        const updated = prev.filter((l) => l.id !== id);
        saveLists(updated);
        return updated;
      });
    },
    [saveLists]
  );

  const updateLastPick = useCallback(
    (id: string, pick: string) => {
      setLists((prev) => {
        const updated = prev.map((l) =>
          l.id === id ? { ...l, lastPick: pick } : l
        );
        saveLists(updated);
        return updated;
      });
    },
    [saveLists]
  );

  const unlockPremium = useCallback(async () => {
    setIsPremium(true);
    await AsyncStorage.setItem(PREMIUM_KEY, "true");
  }, []);

  return (
    <ListsContext.Provider
      value={{
        lists,
        isPremium,
        isLoaded,
        addList,
        updateList,
        deleteList,
        updateLastPick,
        unlockPremium,
      }}
    >
      {children}
    </ListsContext.Provider>
  );
}

export function useLists() {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error("useLists must be used inside ListsProvider");
  return ctx;
}

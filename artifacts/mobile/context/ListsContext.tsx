import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface DecisionList {
  id: string;
  name: string;
  options: string[];
  lastPick?: string;
  createdAt: number;
  crossOffMode?: boolean;
  crossedOff?: string[];
}

interface ListsContextValue {
  lists: DecisionList[];
  isLoaded: boolean;
  addList: (name: string, options: string[], crossOffMode?: boolean) => DecisionList;
  updateList: (id: string, name: string, options: string[], crossOffMode?: boolean) => void;
  deleteList: (id: string) => void;
  restoreList: (list: DecisionList, index: number) => void;
  updateLastPick: (id: string, pick: string) => void;
  crossOffOption: (id: string, option: string) => void;
  resetCrossedOff: (id: string) => void;
}

const ListsContext = createContext<ListsContextValue | null>(null);

const LISTS_KEY = "@decision_randomizer/lists";
export const FREE_LIST_LIMIT = 3;

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function ListsProvider({ children }: { children: React.ReactNode }) {
  const [lists, setLists] = useState<DecisionList[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const listsJson = await AsyncStorage.getItem(LISTS_KEY);
        if (listsJson) setLists(JSON.parse(listsJson));
      } catch {}
      setIsLoaded(true);
    }
    load();
  }, []);

  const saveLists = useCallback(async (updated: DecisionList[]) => {
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
  }, []);

  const addList = useCallback(
    (name: string, options: string[], crossOffMode = false): DecisionList => {
      const newList: DecisionList = {
        id: generateId(),
        name,
        options,
        createdAt: Date.now(),
        crossOffMode,
        crossedOff: [],
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
    (id: string, name: string, options: string[], crossOffMode?: boolean) => {
      setLists((prev) => {
        const updated = prev.map((l) =>
          l.id === id
            ? {
                ...l,
                name,
                options,
                crossOffMode: crossOffMode ?? l.crossOffMode,
                // Removed options shouldn't linger as crossed off
                crossedOff: (l.crossedOff ?? []).filter((o) => options.includes(o)),
              }
            : l
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

  const restoreList = useCallback(
    (list: DecisionList, index: number) => {
      setLists((prev) => {
        if (prev.some((l) => l.id === list.id)) return prev;
        const updated = [...prev];
        updated.splice(Math.min(index, updated.length), 0, list);
        saveLists(updated);
        return updated;
      });
    },
    [saveLists]
  );

  const crossOffOption = useCallback(
    (id: string, option: string) => {
      setLists((prev) => {
        const updated = prev.map((l) => {
          if (l.id !== id) return l;
          const crossed = l.crossedOff ?? [];
          if (crossed.includes(option)) return l;
          return { ...l, crossedOff: [...crossed, option] };
        });
        saveLists(updated);
        return updated;
      });
    },
    [saveLists]
  );

  const resetCrossedOff = useCallback(
    (id: string) => {
      setLists((prev) => {
        const updated = prev.map((l) =>
          l.id === id ? { ...l, crossedOff: [] } : l
        );
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

  return (
    <ListsContext.Provider
      value={{
        lists,
        isLoaded,
        addList,
        updateList,
        deleteList,
        restoreList,
        updateLastPick,
        crossOffOption,
        resetCrossedOff,
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

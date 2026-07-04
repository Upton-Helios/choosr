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
}

interface ListsContextValue {
  lists: DecisionList[];
  isLoaded: boolean;
  addList: (name: string, options: string[]) => DecisionList;
  updateList: (id: string, name: string, options: string[]) => void;
  deleteList: (id: string) => void;
  updateLastPick: (id: string, pick: string) => void;
}

const ListsContext = createContext<ListsContextValue | null>(null);

const LISTS_KEY = "@decision_randomizer/lists";
export const FREE_LIST_LIMIT = 1;

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
    (name: string, options: string[]): DecisionList => {
      const newList: DecisionList = {
        id: generateId(),
        name,
        options,
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
    (id: string, name: string, options: string[]) => {
      setLists((prev) => {
        const updated = prev.map((l) =>
          l.id === id ? { ...l, name, options } : l
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

  return (
    <ListsContext.Provider
      value={{
        lists,
        isLoaded,
        addList,
        updateList,
        deleteList,
        updateLastPick,
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

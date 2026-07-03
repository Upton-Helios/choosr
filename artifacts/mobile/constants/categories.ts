interface Category {
  emoji: string;
  color: string;
}

const DEFAULT_CATEGORY: Category = { emoji: "🎲", color: "#7B5EF6" };

const KEYWORD_CATEGORIES: Array<{ keywords: string[]; category: Category }> = [
  {
    keywords: ["food", "eat", "dinner", "lunch", "breakfast", "restaurant", "meal", "snack", "cuisine", "takeout"],
    category: { emoji: "🍔", color: "#FF9F43" },
  },
  {
    keywords: ["movie", "film", "cinema", "watch", "show", "tv", "series"],
    category: { emoji: "🎬", color: "#EF5B5B" },
  },
  {
    keywords: ["game", "gaming", "play", "board game", "video game"],
    category: { emoji: "🎮", color: "#3CB878" },
  },
  {
    keywords: ["travel", "trip", "vacation", "destination", "flight", "city", "country"],
    category: { emoji: "✈️", color: "#4C8DFF" },
  },
  {
    keywords: ["workout", "fitness", "gym", "exercise", "run", "yoga"],
    category: { emoji: "💪", color: "#8BC53F" },
  },
  {
    keywords: ["book", "read", "novel", "author"],
    category: { emoji: "📚", color: "#A9714E" },
  },
  {
    keywords: ["shop", "shopping", "buy", "purchase", "gift"],
    category: { emoji: "🛍️", color: "#F06AA5" },
  },
  {
    keywords: ["music", "song", "album", "playlist", "band"],
    category: { emoji: "🎵", color: "#9B6BF2" },
  },
  {
    keywords: ["name", "baby", "pet", "dog", "cat"],
    category: { emoji: "👶", color: "#4DD0C8" },
  },
  {
    keywords: ["friend", "team", "people", "who", "person"],
    category: { emoji: "👥", color: "#5E9BF6" },
  },
];

export function getCategoryForList(name: string): Category {
  const lower = name.toLowerCase();
  for (const { keywords, category } of KEYWORD_CATEGORIES) {
    if (keywords.some((k) => lower.includes(k))) {
      return category;
    }
  }
  return DEFAULT_CATEGORY;
}

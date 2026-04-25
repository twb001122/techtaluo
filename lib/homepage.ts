import type { TarotCard } from "./types";

export type HomepageStat = {
  value: string;
  label: string;
  detail: string;
};

export type HomepageModel = {
  featuredCard: TarotCard;
  heroSignals: string[];
  stats: HomepageStat[];
};

export function buildHomepageModel(cards: TarotCard[]): HomepageModel {
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);
  const featuredCard = sortedCards.find((card) => Boolean(card.imageUrl)) ?? sortedCards[Math.floor(sortedCards.length / 2)];
  const totalCount = sortedCards.length;
  const groupStats = Array.from(new Set(sortedCards.map((card) => card.group)))
    .map((group) => {
      const groupCards = sortedCards.filter((card) => card.group === group);
      const categories = Array.from(new Set(groupCards.map((card) => card.category).filter(Boolean)));
      return {
        value: String(groupCards.length),
        label: categories.length === 1 ? categories[0] : group,
        detail: `${group} 分组`
      };
    })
    .slice(0, 3);

  return {
    featuredCard,
    heroSignals: [`${totalCount} 张命运样本`, "幽默吐槽解读", "AI 三牌洞察"],
    stats: [
      { value: String(totalCount), label: "总牌数", detail: "科技命运样本库" },
      ...groupStats
    ]
  };
}

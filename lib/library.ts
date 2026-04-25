import type { CardGroup, TarotCard } from "./types";

export type LibraryGroupChip = {
  value: "all" | CardGroup;
  label: string;
  count: number;
};

export type LibraryArchiveModel = {
  groups: LibraryGroupChip[];
  resultLabel: string;
  archiveNote: string;
};

const labelForGroup = (group: CardGroup, cards: TarotCard[]) => {
  const categories = Array.from(new Set(cards.filter((card) => card.group === group).map((card) => card.category).filter(Boolean)));
  return categories.length === 1 ? categories[0] : group;
};

export function buildLibraryArchiveModel(cards: TarotCard[], visibleCards: TarotCard[]): LibraryArchiveModel {
  const groups = Array.from(new Set(cards.map((card) => card.group)))
    .map((value) => ({
      value,
      label: labelForGroup(value, cards),
      count: cards.filter((card) => card.group === value).length,
      firstOrder: Math.min(...cards.filter((card) => card.group === value).map((card) => card.order))
    }))
    .sort((a, b) => a.firstOrder - b.firstOrder || a.label.localeCompare(b.label, "zh-Hans-CN"));

  return {
    groups: [
      { value: "all", label: "全部", count: cards.length },
      ...groups.map(({ value, label, count }) => ({ value, label, count }))
    ],
    resultLabel: `当前可见 ${visibleCards.length} / ${cards.length} 份馆藏档案`,
    archiveNote: "馆藏索引按技术母题、情绪标签与故障类型归档。"
  };
}

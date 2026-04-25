import { describe, expect, it } from "vitest";
import type { TarotCard } from "./types";
import { buildLibraryArchiveModel } from "./library";

function makeCard(overrides: Partial<TarotCard> = {}): TarotCard {
  return {
    id: overrides.id ?? "card-1",
    order: overrides.order ?? 1,
    name: overrides.name ?? "测试卡牌",
    subtitle: overrides.subtitle ?? "副标题",
    category: overrides.category ?? "大牌",
    group: overrides.group ?? "major",
    tags: overrides.tags ?? ["精神状态"],
    uprightMeaning: overrides.uprightMeaning ?? "正位",
    reversedMeaning: overrides.reversedMeaning ?? "逆位",
    aiKeywords: overrides.aiKeywords ?? ["关键词"],
    stageLine: overrides.stageLine ?? "舞台一句话",
    description: overrides.description ?? "介绍",
    imageElements: overrides.imageElements ?? ["元素"],
    visualStyle: overrides.visualStyle ?? "风格",
    accentColor: overrides.accentColor ?? "#b88a46",
    imageUrl: overrides.imageUrl ?? "",
    isPublished: overrides.isPublished ?? true
  };
}

describe("buildLibraryArchiveModel", () => {
  it("builds ordered archive group chips with counts", () => {
    const cards = [
      makeCard({ id: "ai-1", group: "ai", category: "AI / 科技机制", order: 1 }),
      makeCard({ id: "work-1", group: "workplace", category: "职场流程 / 互联网黑话", order: 2 }),
      makeCard({ id: "work-2", group: "workplace", category: "职场流程 / 互联网黑话", order: 3 }),
      makeCard({ id: "media-1", group: "media", category: "传播 / 大场面", order: 4 })
    ];

    const model = buildLibraryArchiveModel(cards, cards.slice(0, 2));

    expect(model.groups.map((item) => `${item.label}:${item.count}`)).toEqual([
      "全部:4",
      "AI / 科技机制:1",
      "职场流程 / 互联网黑话:2",
      "传播 / 大场面:1"
    ]);
  });

  it("summarizes the visible archive results in a curator tone", () => {
    const cards = [
      makeCard({ id: "major-1", group: "major" }),
      makeCard({ id: "chip-1", group: "chip" }),
      makeCard({ id: "easter-1", group: "easter" })
    ];

    const model = buildLibraryArchiveModel(cards, [cards[1]]);

    expect(model.resultLabel).toBe("当前可见 1 / 3 份馆藏档案");
    expect(model.archiveNote).toContain("馆藏索引");
  });
});

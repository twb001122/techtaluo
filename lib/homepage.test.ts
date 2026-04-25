import { describe, expect, it } from "vitest";
import type { TarotCard } from "./types";
import { buildHomepageModel } from "./homepage";

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

describe("buildHomepageModel", () => {
  it("builds homepage metrics and hero signals from the deck", () => {
    const cards = [
      makeCard({ id: "ai-1", group: "ai", category: "AI / 科技机制", order: 1 }),
      makeCard({ id: "digital-1", group: "digital_life", category: "互联网平台 / 数字生活", order: 2 }),
      makeCard({ id: "digital-2", group: "digital_life", category: "互联网平台 / 数字生活", order: 3 }),
      makeCard({ id: "roles-1", group: "roles", category: "公司角色 / 组织人物", order: 4 })
    ];

    const model = buildHomepageModel(cards);

    expect(model.stats).toEqual([
      { value: "4", label: "总牌数", detail: "科技命运样本库" },
      { value: "1", label: "AI / 科技机制", detail: "ai 分组" },
      { value: "2", label: "互联网平台 / 数字生活", detail: "digital_life 分组" },
      { value: "1", label: "公司角色 / 组织人物", detail: "roles 分组" }
    ]);
    expect(model.heroSignals).toEqual(["4 张命运样本", "幽默吐槽解读", "AI 三牌洞察"]);
  });

  it("prefers a card with an uploaded cover for the hero float card", () => {
    const cards = [
      makeCard({ id: "major-1", order: 1 }),
      makeCard({ id: "major-2", order: 2, imageUrl: "/cards/major-2.jpg" }),
      makeCard({ id: "major-3", order: 3 })
    ];

    const model = buildHomepageModel(cards);

    expect(model.featuredCard.id).toBe("major-2");
  });

  it("falls back to the middle card when no cover has been uploaded yet", () => {
    const cards = [
      makeCard({ id: "major-1", order: 1 }),
      makeCard({ id: "major-2", order: 2 }),
      makeCard({ id: "major-3", order: 3 }),
      makeCard({ id: "major-4", order: 4 }),
      makeCard({ id: "major-5", order: 5 })
    ];

    const model = buildHomepageModel(cards);

    expect(model.featuredCard.id).toBe("major-3");
  });
});

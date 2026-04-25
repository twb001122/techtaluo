import { describe, expect, it } from "vitest";
import type { TarotCard } from "./types";
import { buildCardDisplayModel } from "./card-display";

function makeCard(overrides: Partial<TarotCard> = {}): TarotCard {
  return {
    id: overrides.id ?? "major-01",
    order: overrides.order ?? 1,
    name: overrides.name ?? "服务器宕机",
    subtitle: overrides.subtitle ?? "系统不是坏了，是暂时不可用。",
    category: overrides.category ?? "大牌",
    group: overrides.group ?? "major",
    tags: overrides.tags ?? ["故障"],
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

describe("buildCardDisplayModel", () => {
  it("separates archive metadata from title and subtitle", () => {
    const model = buildCardDisplayModel(makeCard({ order: 12, category: "激光剑" }));

    expect(model.orderLabel).toBe("12");
    expect(model.categoryLabel).toBe("激光剑");
    expect(model.title).toBe("服务器宕机");
    expect(model.subtitle).toBe("系统不是坏了，是暂时不可用。");
  });

  it("preserves orientation as an optional badge label", () => {
    const model = buildCardDisplayModel(makeCard(), "逆位");

    expect(model.orientationLabel).toBe("逆位");
  });
});

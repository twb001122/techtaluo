import { describe, expect, it } from "vitest";
import { initialCards } from "./cards";
import { drawThreeCards, interpretReadingFallback } from "./readings";

describe("initial card data", () => {
  it("contains the 40-card tech tarot deck with expected groups", () => {
    expect(initialCards).toHaveLength(40);
    expect(initialCards.filter((card) => card.group === "major")).toHaveLength(18);
    expect(initialCards.filter((card) => card.group !== "major" && card.group !== "easter")).toHaveLength(17);
    expect(initialCards.filter((card) => card.group === "easter")).toHaveLength(5);
  });

  it("has all required interpretation fields for every card", () => {
    for (const card of initialCards) {
      expect(card.id).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(card.subtitle).toBeTruthy();
      expect(card.uprightMeaning).toBeTruthy();
      expect(card.reversedMeaning).toBeTruthy();
      expect(card.aiKeywords.length).toBeGreaterThan(0);
      expect(card.stageLine).toBeTruthy();
      expect(card.description).toBeTruthy();
      expect(card.imageElements.length).toBeGreaterThan(0);
    }
  });
});

describe("readings", () => {
  it("draws three unique cards with a stable orientation for each card", () => {
    const cards = drawThreeCards(initialCards, () => 0.1);

    expect(cards).toHaveLength(3);
    expect(new Set(cards.map((draw) => draw.card.id)).size).toBe(3);
    expect(cards.every((draw) => draw.orientation === "upright")).toBe(true);
  });

  it("builds a readable fallback interpretation from the question and cards", () => {
    const draws = drawThreeCards(initialCards, () => 0.7);
    const result = interpretReadingFallback("我该不该换工作？", draws);

    expect(result.summary).toContain("我该不该换工作");
    expect(result.cardReadings).toHaveLength(3);
    expect(result.cardReadings[0]?.position).toBe("现状");
    expect(result.analysis).toContain("我该不该换工作");
    expect(result.insight).toContain("建议");
    expect(result.paywallRoasts.paid).toContain("1块钱");
    expect(result.paywallRoasts.unpaid).toContain("1块钱");
  });
});

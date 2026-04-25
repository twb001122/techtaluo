import type { CardDraw, Orientation, ReadingInterpretation, TarotCard } from "./types";

const positions: CardDraw["position"][] = ["现状", "阻力", "建议"];

export function drawThreeCards(cards: TarotCard[], rng: () => number = Math.random): CardDraw[] {
  const pool = cards.filter((card) => card.isPublished);
  const draws: CardDraw[] = [];

  for (let index = 0; index < 3 && pool.length > 0; index += 1) {
    const selectedIndex = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
    const [card] = pool.splice(selectedIndex, 1);
    const orientation: Orientation = rng() < 0.5 ? "upright" : "reversed";
    draws.push({ card, orientation, position: positions[index] });
  }

  return draws;
}

export function interpretReadingFallback(question: string, draws: CardDraw[]): ReadingInterpretation {
  const normalizedQuestion = question.trim() || "这件事";
  const reversedCount = draws.filter((draw) => draw.orientation === "reversed").length;
  const tone = reversedCount >= 2 ? "现在的阻力比机会更响，但它不是结论，是系统提示。" : "机会已经出现，但需要你别只看表面的提示灯。";

  return {
    summary: `关于“${normalizedQuestion}”，这组三张牌给出的结论是：${tone}`,
    cardReadings: draws.map((draw) => {
      const meaning = draw.orientation === "upright" ? draw.card.uprightMeaning : draw.card.reversedMeaning;
      return {
        position: draw.position,
        cardName: draw.card.name,
        orientation: draw.orientation === "upright" ? "正位" : "逆位",
        reading: `${meaning} ${draw.card.stageLine}`
      };
    }),
    analysis: `如果你在想“${normalizedQuestion}”到底该怎么看，这组三张牌更像在提醒你：别把眼前的情绪误认成最终答案。先承认现状里的卡点，再决定下一步动作，节奏比冲动重要。`,
    insight: `幽默但认真一点的建议是：先别急着改命，先把和“${normalizedQuestion}”相关的一个现实动作做掉，别让人生永远停在脑内彩排。`,
    paywallRoasts: {
      paid: "1块钱就想了解命运？也行，至少你愿意为自己的精神状态出一点预算。",
      unpaid: "1块钱都不花就想了解命运？你的财务策略和感情策略一样，主打一个再看看。"
    }
  };
}

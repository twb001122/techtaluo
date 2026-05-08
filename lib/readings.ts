import type { CardDraw, Orientation, ReadingInterpretation, TarotCard } from "./types";

const positions: CardDraw["position"][] = ["症状", "解法"];

export function drawReadingCards(cards: TarotCard[], rng: () => number = Math.random): CardDraw[] {
  const pool = cards.filter((card) => card.isPublished);
  const draws: CardDraw[] = [];

  for (let index = 0; index < positions.length && pool.length > 0; index += 1) {
    const selectedIndex = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
    const [card] = pool.splice(selectedIndex, 1);
    const orientation: Orientation = rng() < 0.5 ? "upright" : "reversed";
    draws.push({ card, orientation, position: positions[index] });
  }

  return draws;
}

export const drawTwoCards = drawReadingCards;

export function interpretReadingFallback(question: string, draws: CardDraw[]): ReadingInterpretation {
  const normalizedQuestion = question.trim() || "这件事";
  const reversedCount = draws.filter((draw) => draw.orientation === "reversed").length;
  const tone = reversedCount >= 2 ? "这次两张牌都在报警，说明不是命运严厉，是你的系统确实该重启。" : "问题已经露出尾巴，解法也没完全跑路，先别急着给人生判死刑。";

  return {
    summary: `关于“${normalizedQuestion}”，这组两张牌给出的结论是：${tone}`,
    cardReadings: draws.map((draw) => {
      const meaning = draw.orientation === "upright" ? draw.card.uprightMeaning : draw.card.reversedMeaning;
      return {
        position: draw.position,
        cardName: draw.card.name,
        orientation: draw.orientation === "upright" ? "正位" : "逆位",
        reading: `${meaning} ${draw.card.stageLine}`
      };
    }),
    analysis: `如果你在想“${normalizedQuestion}”到底该怎么看，这两张牌更像一份迷你诊断：第一张指出你卡住的症状，第二张给出临时补丁。先别急着解释世界，先处理那个最具体、最烦、但确实能动一下的环节。`,
    insight: `幽默但认真一点的解法是：先别急着改命，先给“${normalizedQuestion}”写一个能在今天完成的小动作，别让人生永远停在脑内彩排。`,
    paywallRoasts: {
      paid: "1块钱就想了解命运？也行，至少你愿意为自己的精神状态出一点预算。",
      unpaid: "1块钱都不花就想了解命运？你的财务策略和感情策略一样，主打一个再看看。"
    }
  };
}

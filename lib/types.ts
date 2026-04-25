export type CardGroup = string;

export type Orientation = "upright" | "reversed";

export type TarotCard = {
  id: string;
  order: number;
  name: string;
  subtitle: string;
  category: string;
  group: CardGroup;
  tags: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  aiKeywords: string[];
  stageLine: string;
  description: string;
  imageElements: string[];
  visualStyle: string;
  accentColor: string;
  imageUrl: string;
  isPublished: boolean;
};

export type CardDraw = {
  card: TarotCard;
  orientation: Orientation;
  position: "现状" | "阻力" | "建议";
};

export type ReadingCardInterpretation = {
  position: CardDraw["position"];
  cardName: string;
  orientation: "正位" | "逆位";
  reading: string;
};

export type ReadingPaywallRoasts = {
  paid: string;
  unpaid: string;
};

export type ReadingInterpretation = {
  summary: string;
  cardReadings: ReadingCardInterpretation[];
  analysis: string;
  insight: string;
  paywallRoasts: ReadingPaywallRoasts;
};

import type { TarotCard } from "./types";

export type CardDisplayModel = {
  orderLabel: string;
  categoryLabel: string;
  title: string;
  subtitle: string;
  orientationLabel?: string;
};

export function buildCardDisplayModel(card: TarotCard, orientation?: string): CardDisplayModel {
  return {
    orderLabel: String(card.order).padStart(2, "0"),
    categoryLabel: card.category,
    title: card.name,
    subtitle: card.subtitle,
    orientationLabel: orientation
  };
}

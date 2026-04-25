import type { TarotCard } from "./types";

export type DetailModalModel = {
  metaLabel: string;
  title: string;
  subtitle: string;
  stageLine: string;
  descriptionLabel: string;
  description: string;
  properties: Array<{ label: string; value: string }>;
  tags: string[];
};

export function buildDetailModalModel(card: TarotCard): DetailModalModel {
  return {
    metaLabel: `${card.category} / ${String(card.order).padStart(2, "0")}`,
    title: card.name,
    subtitle: card.subtitle,
    stageLine: card.stageLine,
    descriptionLabel: "详细介绍",
    description: card.description,
    properties: [
      { label: "正位", value: card.uprightMeaning },
      { label: "逆位", value: card.reversedMeaning }
    ],
    tags: card.tags
  };
}

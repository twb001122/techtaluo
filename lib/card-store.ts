import { Prisma } from "@prisma/client";
import { initialCards } from "./cards";
import { prisma } from "./prisma";
import type { TarotCard } from "./types";

type CardRecord = {
  id: string;
  order: number;
  name: string;
  subtitle: string;
  category: string;
  group: string;
  tags: Prisma.JsonValue;
  uprightMeaning: string;
  reversedMeaning: string;
  aiKeywords: Prisma.JsonValue;
  stageLine: string;
  description: string;
  imageElements: Prisma.JsonValue;
  visualStyle: string;
  accentColor: string;
  imageUrl: string;
  isPublished: boolean;
};

export type CardQuery = {
  group?: string | null;
  category?: string | null;
  tag?: string | null;
  q?: string | null;
  sort?: string | null;
  includeDrafts?: boolean;
};

const asStringArray = (value: Prisma.JsonValue): string[] => (Array.isArray(value) ? value.map(String) : []);

export const recordToCard = (record: CardRecord): TarotCard => ({
  ...record,
  tags: asStringArray(record.tags),
  aiKeywords: asStringArray(record.aiKeywords),
  imageElements: asStringArray(record.imageElements)
});

const matchesQuery = (card: TarotCard, query: CardQuery) => {
  const q = query.q?.trim().toLowerCase();
  return (
    (!query.group || card.group === query.group) &&
    (!query.category || card.category === query.category) &&
    (!query.tag || card.tags.includes(query.tag)) &&
    (!q ||
      [card.name, card.subtitle, card.description, card.stageLine, card.category, ...card.tags]
        .join(" ")
        .toLowerCase()
        .includes(q)) &&
    (query.includeDrafts || card.isPublished)
  );
};

const sortCards = (cards: TarotCard[], sort?: string | null) => {
  const sorted = [...cards];
  if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
  else if (sort === "updated") sorted.sort((a, b) => b.order - a.order);
  else sorted.sort((a, b) => a.order - b.order);
  return sorted;
};

export async function listCards(query: CardQuery = {}): Promise<TarotCard[]> {
  try {
    const records = await prisma.card.findMany({ orderBy: { order: "asc" } });
    const source = records.length > 0 ? records.map(recordToCard) : initialCards;
    return sortCards(source.filter((card) => matchesQuery(card, query)), query.sort);
  } catch {
    return sortCards(initialCards.filter((card) => matchesQuery(card, query)), query.sort);
  }
}

export async function getCard(id: string): Promise<TarotCard | null> {
  try {
    const record = await prisma.card.findUnique({ where: { id } });
    return record ? recordToCard(record) : initialCards.find((card) => card.id === id) ?? null;
  } catch {
    return initialCards.find((card) => card.id === id) ?? null;
  }
}

export async function upsertCard(card: TarotCard): Promise<TarotCard> {
  const record = await prisma.card.upsert({
    where: { id: card.id },
    update: card,
    create: card
  });
  return recordToCard(record);
}

export async function updateCard(id: string, patch: Partial<TarotCard>): Promise<TarotCard> {
  const record = await prisma.card.update({
    where: { id },
    data: patch
  });
  return recordToCard(record);
}

export async function seedCards(): Promise<number> {
  for (const card of initialCards) {
    await upsertCard(card);
  }
  return initialCards.length;
}

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TarotCard } from "../lib/types";

type RawCard = Partial<TarotCard> & {
  id: string;
  name: string;
};

const prisma = new PrismaClient();
const sourcePath = resolve(process.cwd(), "ref/newcardv4.json");

function parseCardsFile(raw: string): RawCard[] {
  const arrayMatch = raw.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  const source = arrayMatch?.[1] ?? raw;
  const parsed = Function(`"use strict"; return (${source});`)();
  if (!Array.isArray(parsed)) {
    throw new Error("newcardv4.json 没有解析出卡牌数组。");
  }
  return parsed as RawCard[];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCard(card: RawCard, index: number): TarotCard {
  return {
    id: asString(card.id),
    order: typeof card.order === "number" ? card.order : index + 1,
    name: asString(card.name),
    subtitle: asString(card.subtitle),
    category: asString(card.category) || asString(card.group) || "未分类",
    group: asString(card.group) || "uncategorized",
    tags: asStringArray(card.tags),
    uprightMeaning: asString(card.uprightMeaning),
    reversedMeaning: asString(card.reversedMeaning),
    aiKeywords: asStringArray(card.aiKeywords),
    stageLine: asString(card.stageLine),
    description: asString(card.description),
    imageElements: asStringArray(card.imageElements),
    visualStyle: asString(card.visualStyle),
    accentColor: asString(card.accentColor) || "#c7a76c",
    imageUrl: asString(card.imageUrl),
    isPublished: typeof card.isPublished === "boolean" ? card.isPublished : true
  };
}

function assertValid(cards: TarotCard[]) {
  const ids = new Set<string>();
  const orders = new Set<number>();
  const missing: string[] = [];

  cards.forEach((card, index) => {
    if (!card.id) missing.push(`第 ${index + 1} 张缺少 id`);
    if (!card.name) missing.push(`${card.id || `第 ${index + 1} 张`} 缺少 name`);
    if (!card.group) missing.push(`${card.id || `第 ${index + 1} 张`} 缺少 group`);
    if (ids.has(card.id)) missing.push(`重复 id: ${card.id}`);
    if (orders.has(card.order)) missing.push(`重复 order: ${card.order}`);
    ids.add(card.id);
    orders.add(card.order);
  });

  if (missing.length > 0) {
    throw new Error(missing.join("\n"));
  }
}

async function main() {
  const raw = readFileSync(sourcePath, "utf8");
  const cards = parseCardsFile(raw).map(normalizeCard);
  assertValid(cards);

  await prisma.$transaction([
    prisma.card.deleteMany({}),
    prisma.card.createMany({ data: cards })
  ]);

  const groups = cards.reduce<Record<string, number>>((acc, card) => {
    acc[card.group] = (acc[card.group] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Imported ${cards.length} cards from ${sourcePath}`);
  console.table(groups);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

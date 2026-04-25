import { isAdminRequest, unauthorized } from "@/lib/admin";
import { listCards, upsertCard } from "@/lib/card-store";
import type { TarotCard } from "@/lib/types";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const cards = await listCards({ includeDrafts: true });
  return Response.json({ cards, total: cards.length });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();
  const card = (await request.json()) as TarotCard;
  const saved = await upsertCard(card);
  return Response.json({ card: saved });
}

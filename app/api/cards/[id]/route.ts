import { getCard } from "@/lib/card-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCard(id);

  if (!card || !card.isPublished) {
    return Response.json({ error: "未找到这张牌。" }, { status: 404 });
  }

  return Response.json({ card });
}

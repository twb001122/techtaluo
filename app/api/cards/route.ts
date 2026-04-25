import { NextRequest } from "next/server";
import { listCards } from "@/lib/card-store";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const cards = await listCards({
    group: params.get("group"),
    category: params.get("category"),
    tag: params.get("tag"),
    q: params.get("q"),
    sort: params.get("sort")
  });

  return Response.json({ cards, total: cards.length });
}

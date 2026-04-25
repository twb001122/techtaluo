import { isAdminRequest, unauthorized } from "@/lib/admin";
import { updateCard } from "@/lib/card-store";
import type { TarotCard } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorized();
  const { id } = await params;
  const patch = (await request.json()) as Partial<TarotCard>;
  const saved = await updateCard(id, patch);
  return Response.json({ card: saved });
}

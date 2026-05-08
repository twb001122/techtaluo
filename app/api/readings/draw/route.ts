import { listCards } from "@/lib/card-store";
import { prisma } from "@/lib/prisma";
import { drawReadingCards } from "@/lib/readings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const cards = await listCards();
  const draws = drawReadingCards(cards);

  let readingId: string | null = null;
  try {
    const reading = await prisma.reading.create({
      data: {
        question,
        draws
      }
    });
    readingId = reading.id;
  } catch {
    readingId = `local-${Date.now()}`;
  }

  return Response.json({ readingId, question, draws });
}

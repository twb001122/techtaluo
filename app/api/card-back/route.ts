import { stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const cardBackPath = path.join(process.cwd(), "public", "cards", "card-back.webp");

export async function GET() {
  try {
    const file = await stat(cardBackPath);
    return Response.json({
      exists: true,
      imageUrl: `/cards/card-back.webp?v=${Math.round(file.mtimeMs)}`
    });
  } catch {
    return Response.json({
      exists: false,
      imageUrl: ""
    });
  }
}

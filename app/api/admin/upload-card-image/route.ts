import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdminRequest, unauthorized } from "@/lib/admin";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const safeCardId = (value: string) => value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");
  const cardIdValue = formData.get("cardId");
  const cardId = typeof cardIdValue === "string" ? safeCardId(cardIdValue) : "";

  if (!cardId) {
    return Response.json({ error: "请先填写卡牌 ID，再上传封面。" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ error: "没有收到图片文件。" }, { status: 400 });
  }

  const extension = allowedTypes[file.type];
  if (!extension) {
    return Response.json({ error: "只支持 JPG、PNG 或 WebP 图片。" }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "图片不能超过 8MB。" }, { status: 400 });
  }

  const cardsDir = path.join(process.cwd(), "public", "cards");
  await mkdir(cardsDir, { recursive: true });

  const fileName = `${cardId}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(cardsDir, fileName), bytes);

  return Response.json({ imageUrl: `/cards/${fileName}` });
}

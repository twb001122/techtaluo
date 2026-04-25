import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdminRequest, unauthorized } from "@/lib/admin";
import { allowedImageTypes, compressToWebp, formatBytes, maxUploadBytes, outputImageExtension, removeImageVariants } from "@/lib/image-processing";

export const runtime = "nodejs";

const maxImageWidth = 1200;
const maxImageHeight = 1600;
const webpQuality = 82;

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

  const extension = allowedImageTypes[file.type];
  if (!extension) {
    return Response.json({ error: "只支持 JPG、PNG 或 WebP 图片。" }, { status: 400 });
  }

  if (file.size > maxUploadBytes) {
    return Response.json({ error: "图片不能超过 8MB。" }, { status: 400 });
  }

  const cardsDir = path.join(process.cwd(), "public", "cards");
  await mkdir(cardsDir, { recursive: true });

  const fileName = `${cardId}.${outputImageExtension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  let compressed: Buffer;

  try {
    compressed = await compressToWebp(bytes, { width: maxImageWidth, height: maxImageHeight, quality: webpQuality });
  } catch {
    return Response.json({ error: "图片压缩失败，请换一张 JPG、PNG 或 WebP 图片再试。" }, { status: 400 });
  }

  await removeImageVariants(cardsDir, cardId);
  await writeFile(path.join(cardsDir, fileName), compressed);

  return Response.json({
    imageUrl: `/cards/${fileName}`,
    originalSize: bytes.length,
    compressedSize: compressed.length,
    message: `已压缩：${formatBytes(bytes.length)} → ${formatBytes(compressed.length)}`
  });
}

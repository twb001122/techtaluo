import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdminRequest, unauthorized } from "@/lib/admin";
import { allowedImageTypes, compressToWebp, formatBytes, maxUploadBytes, outputImageExtension, removeImageVariants } from "@/lib/image-processing";

export const runtime = "nodejs";

const cardBackBaseName = "card-back";
const cardBackWidth = 1200;
const cardBackHeight = 1680;
const cardBackQuality = 84;

const cardsDir = () => path.join(process.cwd(), "public", "cards");
const imageUrlWithVersion = async () => {
  const file = await stat(path.join(cardsDir(), `${cardBackBaseName}.${outputImageExtension}`));
  return `/cards/${cardBackBaseName}.${outputImageExtension}?v=${Math.round(file.mtimeMs)}`;
};

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "没有收到卡背图片文件。" }, { status: 400 });
  }

  if (!allowedImageTypes[file.type]) {
    return Response.json({ error: "卡背只支持 JPG、PNG 或 WebP 图片。" }, { status: 400 });
  }

  if (file.size > maxUploadBytes) {
    return Response.json({ error: "卡背图片不能超过 8MB。" }, { status: 400 });
  }

  const directory = cardsDir();
  await mkdir(directory, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  let compressed: Buffer;

  try {
    compressed = await compressToWebp(bytes, { width: cardBackWidth, height: cardBackHeight, quality: cardBackQuality });
  } catch {
    return Response.json({ error: "卡背图片压缩失败，请换一张 JPG、PNG 或 WebP 图片再试。" }, { status: 400 });
  }

  await removeImageVariants(directory, cardBackBaseName);
  await writeFile(path.join(directory, `${cardBackBaseName}.${outputImageExtension}`), compressed);

  return Response.json({
    imageUrl: await imageUrlWithVersion(),
    originalSize: bytes.length,
    compressedSize: compressed.length,
    message: `卡背已压缩：${formatBytes(bytes.length)} → ${formatBytes(compressed.length)}`
  });
}

import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const allowedImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export const outputImageExtension = "webp";
export const maxUploadBytes = 8 * 1024 * 1024;

export const formatBytes = (value: number) => {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(value / 1024))}KB`;
};

type CompressOptions = {
  width: number;
  height: number;
  quality?: number;
};

export async function compressToWebp(bytes: Buffer, options: CompressOptions) {
  return sharp(bytes, { failOn: "none" })
    .rotate()
    .resize({
      width: options.width,
      height: options.height,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({
      quality: options.quality ?? 82,
      effort: 5,
      smartSubsample: true
    })
    .toBuffer();
}

export async function removeImageVariants(directory: string, baseName: string) {
  await Promise.all(
    Object.values(allowedImageTypes).map(async (extension) => {
      try {
        await unlink(path.join(directory, `${baseName}.${extension}`));
      } catch {
        // It is fine when a previous image format does not exist.
      }
    })
  );
}

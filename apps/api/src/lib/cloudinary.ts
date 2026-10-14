import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import type { UploadFolder, UploadResult } from "@portfolio/shared";
import { env } from "../env";
import { ApiError } from "./errors";
import { logger } from "./logger";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** Seeded placeholder assets are not on Cloudinary and must never be destroyed. */
const SEED_PREFIX = "seed/";
const isPdfId = (publicId: string): boolean => publicId.endsWith(".pdf");

export function uploadBuffer(
  buffer: Buffer,
  folder: UploadFolder,
  kind: "image" | "pdf",
): Promise<UploadResult> {
  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      kind === "pdf"
        ? {
            // PDFs are stored raw; the explicit .pdf id lets destroyAsset infer the resource type.
            resource_type: "raw",
            public_id: `portfolio/${folder}/${randomUUID()}.pdf`,
          }
        : { resource_type: "image", folder: `portfolio/${folder}` },
      (error, result) => {
        if (error || !result) {
          reject(new ApiError(502, "INTERNAL", "Image storage failed"));
          return;
        }
        resolve({
          // f_auto,q_auto: Cloudinary serves WebP/AVIF at an optimised quality.
          url:
            kind === "image"
              ? result.secure_url.replace("/upload/", "/upload/f_auto,q_auto/")
              : result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );
    stream.end(buffer);
  });
}

/** Best-effort delete: a storage failure must never block the database operation. */
export async function destroyAsset(publicId: string | null | undefined): Promise<void> {
  if (!publicId || publicId.startsWith(SEED_PREFIX)) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: isPdfId(publicId) ? "raw" : "image",
      invalidate: true,
    });
  } catch (err) {
    logger.warn({ err, publicId }, "Failed to delete Cloudinary asset");
  }
}

/** Deletes `oldId` when the replacement differs. */
export async function replaceAsset(
  oldId: string | null | undefined,
  newId: string | null | undefined,
): Promise<void> {
  if (oldId && oldId !== newId) await destroyAsset(oldId);
}

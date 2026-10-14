import { fileTypeFromBuffer } from "file-type";
import { UPLOAD_LIMITS, type UploadFolder, type UploadResult } from "@portfolio/shared";
import { uploadBuffer } from "../lib/cloudinary";
import { ApiError } from "../lib/errors";

/** SVG is deliberately excluded: it can carry scripts. */
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const PDF_MIME = "application/pdf";

export const uploadService = {
  /** Validates the real file type from magic bytes — the client-supplied MIME/extension is ignored. */
  async upload(buffer: Buffer | undefined, folder: UploadFolder): Promise<UploadResult> {
    if (!buffer || buffer.length === 0) throw ApiError.upload("No file provided");

    const detected = await fileTypeFromBuffer(buffer);
    const wantsPdf = folder === "resume";
    const allowed = wantsPdf ? detected?.mime === PDF_MIME : !!detected && IMAGE_MIMES.has(detected.mime);
    if (!allowed) {
      throw ApiError.upload(
        wantsPdf ? "Resume must be a PDF file" : "Only JPEG, PNG, WebP, GIF or AVIF images are allowed",
        415,
      );
    }

    const max = wantsPdf ? UPLOAD_LIMITS.pdfMaxBytes : UPLOAD_LIMITS.imageMaxBytes;
    if (buffer.length > max) {
      throw ApiError.upload(`File exceeds the ${max / 1024 / 1024} MB limit`, 413);
    }

    return uploadBuffer(buffer, folder, wantsPdf ? "pdf" : "image");
  },
};

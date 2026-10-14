import type { ImageLoaderProps } from "next/image";

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Rewrites Cloudinary delivery URLs to request a sized, auto-format variant. */
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const transform = `f_auto,q_${quality ?? "auto"},w_${width},c_limit`;
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    return src.replace("/upload/", `/upload/${transform}/`);
  }
  if (!src.startsWith("http") && cloud) {
    return `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${src.replace(/^\//, "")}`;
  }
  return src;
}

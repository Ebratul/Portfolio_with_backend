"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { BLUR_DATA_URL } from "@/lib/site";

export interface GalleryImage {
  url: string;
  alt: string;
}

export function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const current = images[index] ?? images[0];
  if (!current) return null;
  const go = (d: number): void => {
    setIndex((i) => (i + d + images.length) % images.length);
  };

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  }

  return (
    <div role="group" aria-roledescription="carousel" aria-label="Project screenshots" onKeyDown={onKeyDown}>
      <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-bg">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 800px, 100vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => {
                go(-1);
              }}
              aria-label="Previous image"
              className="glass absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                go(1);
              }}
              aria-label="Next image"
              className="glass absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Choose image">
          {images.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIndex(i);
                }}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "relative block h-14 w-24 overflow-hidden rounded-lg border-2 transition",
                  i === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { UPLOAD_LIMITS } from "@portfolio/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/admin/resources";
import { cn } from "@/lib/cn";
import { uploadFile } from "./ImageUploader";
import { SortableList } from "./SortableList";

export interface GalleryItem {
  id: string;
  url: string;
  publicId: string;
  alt: string | null;
}

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Multi-image gallery with drag-to-reorder and alt text. Persistence is up to the parent. */
export function ProjectGalleryManager({
  items,
  onAdd,
  onRemove,
  onAlt,
  onReorder,
}: {
  items: GalleryItem[];
  onAdd: (image: { url: string; publicId: string }) => Promise<void>;
  onRemove: (id: string) => void;
  onAlt: (id: string, alt: string | null) => void;
  onReorder: (ids: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [over, setOver] = useState(false);

  async function addFiles(list: FileList | File[]): Promise<void> {
    const files = [...list];
    const valid = files.filter((f) => {
      if (!TYPES.includes(f.type)) toast.error(`${f.name}: unsupported file type`);
      else if (f.size > UPLOAD_LIMITS.imageMaxBytes) toast.error(`${f.name}: larger than 5 MB`);
      else return true;
      return false;
    });
    if (valid.length === 0) return;
    setProgress({ done: 0, total: valid.length });
    for (const [i, file] of valid.entries()) {
      try {
        const res = await uploadFile(file, "projects");
        await onAdd({ url: res.url, publicId: res.publicId });
      } catch (err) {
        toast.error(`${file.name}: ${errorMessage(err)}`);
      }
      setProgress({ done: i + 1, total: valid.length });
    }
    setProgress(null);
  }

  const onDrop = (e: DragEvent): void => {
    e.preventDefault();
    setOver(false);
    void addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => { setOver(false); }}
        onDrop={onDrop}
        className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4 transition", over ? "border-primary bg-primary/10" : "border-line")}
      >
        <p className="text-sm text-muted">Drop screenshots here or choose files. JPEG, PNG, WebP, GIF or AVIF, up to 5 MB each.</p>
        <Button variant="outline" disabled={progress !== null} onClick={() => inputRef.current?.click()}>
          {progress ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
          {progress ? `Uploading ${progress.done}/${progress.total}…` : "Add images"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={TYPES.join(",")}
          className="sr-only"
          aria-label="Add gallery images"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <SortableList
          label="Gallery images"
          items={items}
          onReorder={(next) => { onReorder(next.map((i) => i.id)); }}
          renderItem={(img, handle) => (
            <div className="card flex items-center gap-3 p-2.5">
              {handle}
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
                <Image src={img.url} alt={img.alt ?? ""} fill sizes="112px" className="object-cover" />
              </div>
              <Input
                aria-label="Alt text"
                placeholder="Describe the image (alt text)"
                defaultValue={img.alt ?? ""}
                onBlur={(e) => {
                  const next = e.target.value.trim() || null;
                  if (next !== (img.alt ?? null)) onAlt(img.id, next);
                }}
              />
              <Button variant="ghost" size="icon" aria-label="Remove image" onClick={() => { onRemove(img.id); }}>
                <Trash2 className="size-4 text-red-500" aria-hidden="true" />
              </Button>
            </div>
          )}
        />
      ) : null}
    </div>
  );
}

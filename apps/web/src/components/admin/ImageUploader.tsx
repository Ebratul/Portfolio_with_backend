"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { UPLOAD_LIMITS, type UploadFolder, type UploadResult } from "@portfolio/shared";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/cn";
import { adminFetch } from "@/lib/admin/client";
import { errorMessage } from "@/lib/admin/resources";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export async function uploadFile(file: File, folder: UploadFolder): Promise<UploadResult> {
  const form = new FormData();
  form.append("folder", folder);
  form.append("file", file);
  return adminFetch<UploadResult>("/admin/upload", { method: "POST", body: form });
}

function validate(file: File): string | null {
  if (!ACCEPT.split(",").includes(file.type)) return "Use a JPEG, PNG, WebP, GIF or AVIF image";
  if (file.size > UPLOAD_LIMITS.imageMaxBytes) return "Image must be 5 MB or smaller";
  return null;
}

async function cropToFile(src: string, area: Area, original: File): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => {
      resolve(el);
    };
    el.onerror = () => {
      reject(new Error("Could not read the image"));
    };
    el.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const type = original.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, 0.92);
  });
  if (!blob) throw new Error("Could not crop the image");
  return new File([blob], original.name, { type });
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

export function ImageUploader({
  label,
  folder,
  value,
  onChange,
  aspect,
  shape = "rect",
  hint,
  error,
  previewClassName,
  stacked = false,
}: {
  label: string;
  folder: UploadFolder;
  value: UploadedImage | null;
  onChange: (next: UploadedImage | null) => void;
  /** width / height. When set, the file is cropped before upload. */
  aspect?: number;
  shape?: "rect" | "circle";
  hint?: string;
  error?: string | undefined;
  previewClassName?: string;
  /** Put the preview above the controls (for narrow containers such as sidebars). */
  stacked?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<{ file: File; src: string } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  const send = useCallback(
    async (file: File): Promise<void> => {
      setBusy(true);
      try {
        const res = await uploadFile(file, folder);
        onChange({ url: res.url, publicId: res.publicId });
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [folder, onChange],
  );

  function pick(file: File | undefined): void {
    if (!file) return;
    const problem = validate(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (aspect && file.type !== "image/gif") {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setPending({ file, src: URL.createObjectURL(file) });
    } else void send(file);
  }

  function closeCrop(): void {
    if (pending) URL.revokeObjectURL(pending.src);
    setPending(null);
  }

  async function confirmCrop(): Promise<void> {
    if (!pending || !area) return;
    try {
      const file = await cropToFile(pending.src, area, pending.file);
      closeCrop();
      await send(file);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  function onDrop(e: DragEvent): void {
    e.preventDefault();
    setOver(false);
    pick(e.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => {
          setOver(false);
        }}
        onDrop={onDrop}
        className={cn(
          "flex gap-4 rounded-xl border border-dashed p-3 transition",
          // Side-by-side only when there is room; phones (and narrow sidebars via `stacked`) stack.
          stacked ? "flex-col items-start" : "flex-col items-start sm:flex-row sm:items-center",
          over ? "border-primary bg-primary/10" : "border-line",
          error && "border-red-500",
        )}
      >
        <div
          className={cn(
            "relative grid shrink-0 place-items-center overflow-hidden bg-bg",
            shape === "circle" ? "size-24 rounded-full" : "h-24 w-40 rounded-lg",
            previewClassName,
          )}
        >
          {value ? (
            <Image src={value.url} alt={`${label} preview`} fill sizes="160px" className="object-cover" />
          ) : (
            <ImagePlus className="size-7 text-muted" aria-hidden="true" />
          )}
          {busy ? (
            <span className="absolute inset-0 grid place-items-center bg-black/50" role="status" aria-label="Uploading">
              <Loader2 className="size-6 animate-spin text-white" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted">{hint ?? "Drag an image here or choose a file. Max 5 MB."}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
              <ImagePlus className="size-4" aria-hidden="true" />
              {value ? "Replace" : "Choose image"}
            </Button>
            {value ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  onChange(null);
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label={`${label} file`}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}

      <Modal
        open={pending !== null}
        onOpenChange={(o) => {
          if (!o) closeCrop();
        }}
        title="Crop image"
        description="Drag to reposition and use the slider to zoom."
        footer={
          <>
            <Button variant="outline" onClick={closeCrop}>
              Cancel
            </Button>
            <Button onClick={() => void confirmCrop()} disabled={!area}>
              Crop &amp; upload
            </Button>
          </>
        }
      >
        {pending && aspect ? (
          <div className="space-y-4">
            <div className="relative h-72 overflow-hidden rounded-lg bg-black">
              <Cropper
                image={pending.src}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={shape === "circle" ? "round" : "rect"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, px) => {
                  setArea(px);
                }}
              />
            </div>
            <Slider aria-label="Zoom" value={zoom} min={1} max={3} step={0.05} onValueChange={setZoom} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

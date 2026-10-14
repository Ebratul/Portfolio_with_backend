"use client";

import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UPLOAD_LIMITS } from "@portfolio/shared";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/admin/resources";
import { uploadFile, type UploadedImage } from "./ImageUploader";

/** PDF uploader for the resume. */
export function FileUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: UploadedImage | null;
  onChange: (next: UploadedImage | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined): Promise<void> {
    if (!file) return;
    if (file.type !== "application/pdf") return void toast.error("Resume must be a PDF");
    if (file.size > UPLOAD_LIMITS.pdfMaxBytes) return void toast.error("PDF must be 10 MB or smaller");
    setBusy(true);
    try {
      const res = await uploadFile(file, "resume");
      onChange({ url: res.url, publicId: res.publicId });
      toast.success("Resume uploaded");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line p-3">
        <FileText className="size-8 text-muted" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-sm">
          {value ? (
            <a href={value.url} target="_blank" rel="noopener noreferrer" className="truncate text-ink underline">
              View current resume<span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-muted">No resume uploaded. PDF, max 10 MB.</span>
          )}
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
          {value ? "Replace" : "Upload PDF"}
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
        <input
          ref={ref}
          type="file"
          accept="application/pdf"
          className="sr-only"
          aria-label={`${label} file`}
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

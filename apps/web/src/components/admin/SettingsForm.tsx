"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { FONT_OPTIONS, siteSettingsInputSchema, type SiteSettings } from "@portfolio/shared";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminApiError, adminFetch } from "@/lib/admin/client";
import { errorMessage } from "@/lib/admin/resources";
import { onColor } from "@/lib/color";
import { ColorField } from "./ColorField";
import { ImageUploader } from "./ImageUploader";
import { PageHeader } from "./PageHeader";
import { TagInput } from "./TagInput";
import { useUnsavedWarning } from "./useUnsavedWarning";

type FormIn = z.input<typeof siteSettingsInputSchema>;
type FormOut = z.output<typeof siteSettingsInputSchema>;

const FONT_OPTS = FONT_OPTIONS.map((f) => ({ value: f, label: f }));
const THEME_OPTS = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "Match visitor's system" },
];

const toForm = (s: SiteSettings): FormIn => ({
  primaryColor: s.primaryColor, accentColor: s.accentColor, bgColor: s.bgColor, surfaceColor: s.surfaceColor,
  defaultTheme: s.defaultTheme, fontHeading: s.fontHeading, fontBody: s.fontBody,
  seoTitle: s.seoTitle, seoDescription: s.seoDescription, seoKeywords: s.seoKeywords,
  ogImageUrl: s.ogImageUrl ?? null, ogImagePublicId: s.ogImagePublicId ?? null, faviconUrl: s.faviconUrl ?? null,
  footerText: s.footerText,
});

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

const safe = (hex: string, fallback: string): string => (/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : fallback);

function ThemePreview({ primary, accent, bg, surface }: { primary: string; accent: string; bg: string; surface: string }) {
  const p = safe(primary, "#FF4D6D");
  const a = safe(accent, "#E94584");
  const b = safe(bg, "#0A0E1A");
  const s = safe(surface, "#111827");
  const text = onColor(b);
  return (
    <div aria-label="Live colour preview" role="img" className="overflow-hidden rounded-xl border border-line p-5" style={{ background: b, color: text }}>
      <p className="text-xs opacity-60">Live preview</p>
      <p className="mt-1 text-2xl font-extrabold" style={{ backgroundImage: `linear-gradient(90deg, ${p}, ${a})`, WebkitBackgroundClip: "text", color: "transparent" }}>
        Your Name
      </p>
      <div className="mt-3 rounded-xl p-4" style={{ background: s, border: "1px solid rgba(128,128,128,.2)" }}>
        <p className="text-sm font-semibold">Card surface</p>
        <p className="text-xs opacity-70">Body text on the surface colour.</p>
        <span className="mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-semibold" style={{ backgroundImage: `linear-gradient(90deg, ${p}, ${a})`, color: onColor(p) }}>
          Get In Touch
        </span>
      </div>
    </div>
  );
}

function SettingsFormInner({ settings }: { settings: SiteSettings }) {
  const qc = useQueryClient();
  const { register, control, handleSubmit, reset, setError, watch, setValue, formState: { errors, isDirty } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(siteSettingsInputSchema),
    defaultValues: toForm(settings),
  });
  useUnsavedWarning(isDirty);

  const save = useMutation({
    mutationFn: (v: FormOut) => adminFetch<SiteSettings>("/admin/settings", { method: "PUT", body: v }),
    onSuccess: (saved) => {
      toast.success("Settings saved");
      qc.setQueryData(["settings"], saved);
      reset(toForm(saved));
    },
    onError: (err) => {
      if (err instanceof AdminApiError) for (const [f, m] of Object.entries(err.fieldErrors)) if (m?.[0]) setError(f as keyof FormIn, { message: m[0] });
      toast.error(errorMessage(err));
    },
  });

  const err = (n: keyof FormIn): string | undefined => {
    const e = errors[n];
    return typeof e?.message === "string" ? e.message : undefined;
  };
  const [primary, accent, bg, surface] = watch(["primaryColor", "accentColor", "bgColor", "surfaceColor"]);
  const seoTitle = watch("seoTitle");
  const seoDesc = watch("seoDescription");
  const og = watch("ogImageUrl");
  const favicon = watch("faviconUrl");

  return (
    <form onSubmit={(e) => void handleSubmit((v) => save.mutateAsync(v))(e)} noValidate className="space-y-6 pb-24">
      <Card title="Colours" description="Re-themes the whole public site. Visitors can still pick their own accent from the palette button.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {([
              ["primaryColor", "Primary colour", "Buttons, highlights, gradient start"],
              ["accentColor", "Accent colour", "Gradient end"],
              ["bgColor", "Background (dark theme)", "Page background"],
              ["surfaceColor", "Surface (dark theme)", "Cards and panels"],
            ] as const).map(([name, label, hint]) => (
              <Field key={name} label={label} htmlFor={name} error={err(name)} hint={hint}>
                <Controller control={control} name={name} render={({ field }) => <ColorField id={name} value={field.value} onChange={(v) => { field.onChange(v ?? ""); }} invalid={!!errors[name]} />} />
              </Field>
            ))}
          </div>
          <ThemePreview primary={primary} accent={accent} bg={bg} surface={surface} />
        </div>
      </Card>

      <Card title="Typography & theme">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Heading font" htmlFor="fontHeading" error={err("fontHeading")}>
            <Controller control={control} name="fontHeading" render={({ field }) => <Select id="fontHeading" value={field.value} onValueChange={field.onChange} options={FONT_OPTS} />} />
          </Field>
          <Field label="Body font" htmlFor="fontBody" error={err("fontBody")}>
            <Controller control={control} name="fontBody" render={({ field }) => <Select id="fontBody" value={field.value} onValueChange={field.onChange} options={FONT_OPTS} />} />
          </Field>
          <Field label="Default theme" htmlFor="defaultTheme" error={err("defaultTheme")}>
            <Controller control={control} name="defaultTheme" render={({ field }) => <Select id="defaultTheme" value={field.value} onValueChange={field.onChange} options={THEME_OPTS} />} />
          </Field>
        </div>
      </Card>

      <Card title="SEO" description="Used for search results and link previews.">
        <Field label="Title" htmlFor="seoTitle" error={err("seoTitle")} hint={`${seoTitle.length}/70 characters`} required>
          <Input id="seoTitle" maxLength={70} aria-invalid={!!errors.seoTitle} {...register("seoTitle")} />
        </Field>
        <Field label="Description" htmlFor="seoDescription" error={err("seoDescription")} hint={`${seoDesc.length}/200 characters`} required>
          <Textarea id="seoDescription" rows={3} maxLength={200} aria-invalid={!!errors.seoDescription} {...register("seoDescription")} />
        </Field>
        <Field label="Keywords" htmlFor="seoKeywords">
          <Controller control={control} name="seoKeywords" render={({ field }) => <TagInput id="seoKeywords" value={field.value ?? []} onChange={field.onChange} />} />
        </Field>
        <div className="grid gap-6 lg:grid-cols-2">
          <ImageUploader
            label="Social share image"
            folder="og"
            aspect={1200 / 630}
            hint="1200×630 works best. You can crop after choosing."
            value={og ? { url: og, publicId: watch("ogImagePublicId") ?? "" } : null}
            onChange={(v) => {
              setValue("ogImageUrl", v?.url ?? null, { shouldDirty: true });
              setValue("ogImagePublicId", v?.publicId ?? null, { shouldDirty: true });
            }}
          />
          <ImageUploader
            label="Favicon"
            folder="og"
            hint="Square PNG, at least 64×64."
            previewClassName="!h-16 !w-16"
            value={favicon ? { url: favicon, publicId: "" } : null}
            onChange={(v) => { setValue("faviconUrl", v?.url ?? null, { shouldDirty: true }); }}
          />
        </div>
      </Card>

      <Card title="Footer">
        <Field label="Footer text" htmlFor="footerText" error={err("footerText")} required>
          <Input id="footerText" aria-invalid={!!errors.footerText} {...register("footerText")} />
        </Field>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 sm:justify-between">
          <p className="sr-only text-sm text-muted sm:not-sr-only" aria-live="polite">{isDirty ? "You have unsaved changes" : "All changes saved"}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!isDirty || save.isPending} onClick={() => { reset(toForm(settings)); }}>Discard</Button>
            <Button type="submit" disabled={!isDirty || save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function SettingsForm() {
  const { data, isPending } = useQuery({ queryKey: ["settings"], queryFn: () => adminFetch<SiteSettings>("/admin/settings") });
  return (
    <>
      <PageHeader title="Site settings" description="Theme, fonts, SEO and footer." />
      {isPending ? <div className="space-y-6">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56" />)}</div> : data ? <SettingsFormInner settings={data} /> : <p className="text-muted">Settings could not be loaded.</p>}
    </>
  );
}

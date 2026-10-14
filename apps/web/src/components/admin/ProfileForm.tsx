"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { profileInputSchema, type Profile } from "@portfolio/shared";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { adminFetch, AdminApiError } from "@/lib/admin/client";
import { errorMessage } from "@/lib/admin/resources";
import { FileUploader } from "./FileUploader";
import { ImageUploader } from "./ImageUploader";
import { PageHeader } from "./PageHeader";
import { StringListInput } from "./StringListInput";
import { TagInput } from "./TagInput";
import { useUnsavedWarning } from "./useUnsavedWarning";

type FormIn = z.input<typeof profileInputSchema>;
type FormOut = z.output<typeof profileInputSchema>;

const toForm = (p: Profile): FormIn => ({
  fullName: p.fullName,
  brandName: p.brandName,
  brandSuffix: p.brandSuffix,
  badgeText: p.badgeText,
  roles: p.roles,
  tagline: p.tagline,
  shortBio: p.shortBio,
  aboutHeading: p.aboutHeading,
  aboutHighlights: p.aboutHighlights,
  aboutParagraphs: p.aboutParagraphs,
  avatarUrl: p.avatarUrl ?? null,
  avatarPublicId: p.avatarPublicId ?? null,
  aboutImageUrl: p.aboutImageUrl ?? null,
  aboutImagePublicId: p.aboutImagePublicId ?? null,
  experienceYears: p.experienceYears,
  isAvailable: p.isAvailable,
  availabilityText: p.availabilityText,
  resumeUrl: p.resumeUrl ?? null,
  resumePublicId: p.resumePublicId ?? null,
  location: p.location,
  email: p.email,
  phone: p.phone ?? "",
  whatsapp: p.whatsapp ?? "",
  githubUsername: p.githubUsername ?? "",
});

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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

function ProfileFormInner({ profile }: { profile: Profile }) {
  const qc = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(profileInputSchema), defaultValues: toForm(profile) });

  useUnsavedWarning(isDirty);

  const save = useMutation({
    mutationFn: (values: FormOut) => adminFetch<Profile>("/admin/profile", { method: "PUT", body: values }),
    onSuccess: (saved) => {
      toast.success("Profile saved");
      qc.setQueryData(["profile"], saved);
      reset(toForm(saved));
    },
    onError: (err) => {
      if (err instanceof AdminApiError) {
        for (const [field, msgs] of Object.entries(err.fieldErrors)) {
          if (msgs?.[0]) setError(field as keyof FormIn, { message: msgs[0] });
        }
      }
      toast.error(errorMessage(err));
    },
  });

  const err = (name: keyof FormIn): string | undefined => {
    const e = errors[name];
    return typeof e?.message === "string" ? e.message : undefined;
  };
  const avatar = watch("avatarUrl");
  const aboutImg = watch("aboutImageUrl");
  const resume = watch("resumeUrl");

  return (
    <form onSubmit={(e) => void handleSubmit((v) => save.mutateAsync(v))(e)} noValidate className="space-y-6 pb-24">
      <Card title="Identity" description="Shown in the navbar, hero and footer.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" error={err("fullName")} required>
            <Input id="fullName" aria-invalid={!!errors.fullName} {...register("fullName")} />
          </Field>
          <Field label="Hero badge text" htmlFor="badgeText" error={err("badgeText")} hint='e.g. "Digital Architect"' required>
            <Input id="badgeText" aria-invalid={!!errors.badgeText} {...register("badgeText")} />
          </Field>
          <Field label="Brand name" htmlFor="brandName" error={err("brandName")} hint='Rendered as "name.dev"' required>
            <Input id="brandName" aria-invalid={!!errors.brandName} {...register("brandName")} />
          </Field>
          <Field label="Brand suffix" htmlFor="brandSuffix" error={err("brandSuffix")} hint="Shown in the accent colour">
            <Input id="brandSuffix" aria-invalid={!!errors.brandSuffix} {...register("brandSuffix")} />
          </Field>
        </div>
        <Field label="Typing roles" htmlFor="roles" error={typeof errors.roles?.message === "string" ? errors.roles.message : undefined} hint="Cycled by the typing animation in the hero. Press Enter after each." required>
          <Controller control={control} name="roles" render={({ field }) => <TagInput id="roles" value={field.value} onChange={field.onChange} placeholder="Full-Stack Developer" />} />
        </Field>
        <Field label="Tagline" htmlFor="tagline" error={err("tagline")} required>
          <Input id="tagline" aria-invalid={!!errors.tagline} {...register("tagline")} />
        </Field>
        <Field label="Short bio" htmlFor="shortBio" error={err("shortBio")} required>
          <Textarea id="shortBio" rows={3} aria-invalid={!!errors.shortBio} {...register("shortBio")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Years of experience" htmlFor="experienceYears" error={err("experienceYears")} required>
            <Input id="experienceYears" type="number" step="0.5" min={0} aria-invalid={!!errors.experienceYears} {...register("experienceYears", { valueAsNumber: true })} />
          </Field>
          <Field label="Availability label" htmlFor="availabilityText" error={err("availabilityText")}>
            <Input id="availabilityText" {...register("availabilityText")} />
          </Field>
        </div>
        <Controller
          control={control}
          name="isAvailable"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch id="isAvailable" checked={field.value} onCheckedChange={field.onChange} />
              <label htmlFor="isAvailable" className="text-sm font-medium">Show the &ldquo;Available&rdquo; status chip in the hero</label>
            </div>
          )}
        />
      </Card>

      <Card title="Images & resume" description="Square crop. Uploaded to Cloudinary; replaced files are cleaned up automatically on save.">
        <div className="grid gap-6 lg:grid-cols-2">
          <ImageUploader
            label="Profile photo"
            folder="avatar"
            aspect={1}
            shape="circle"
            value={avatar ? { url: avatar, publicId: watch("avatarPublicId") ?? "" } : null}
            onChange={(v) => {
              setValue("avatarUrl", v?.url ?? null, { shouldDirty: true });
              setValue("avatarPublicId", v?.publicId ?? null, { shouldDirty: true });
            }}
          />
          <ImageUploader
            label="About section image"
            folder="avatar"
            aspect={1}
            shape="circle"
            value={aboutImg ? { url: aboutImg, publicId: watch("aboutImagePublicId") ?? "" } : null}
            onChange={(v) => {
              setValue("aboutImageUrl", v?.url ?? null, { shouldDirty: true });
              setValue("aboutImagePublicId", v?.publicId ?? null, { shouldDirty: true });
            }}
          />
        </div>
        <FileUploader
          label="Resume (PDF)"
          value={resume ? { url: resume, publicId: watch("resumePublicId") ?? "" } : null}
          onChange={(v) => {
            setValue("resumeUrl", v?.url ?? null, { shouldDirty: true });
            setValue("resumePublicId", v?.publicId ?? null, { shouldDirty: true });
          }}
        />
      </Card>

      <Card title="About section">
        <Field label="Heading" htmlFor="aboutHeading" error={err("aboutHeading")} required>
          <Input id="aboutHeading" aria-invalid={!!errors.aboutHeading} {...register("aboutHeading")} />
        </Field>
        <Field label="Highlighted words" htmlFor="aboutHighlights" hint="Words from the heading to render in the accent colour.">
          <Controller control={control} name="aboutHighlights" render={({ field }) => <TagInput id="aboutHighlights" value={field.value ?? []} onChange={field.onChange} placeholder="fast" />} />
        </Field>
        <Field label="Paragraphs" htmlFor="aboutParagraphs-0" error={typeof errors.aboutParagraphs?.message === "string" ? errors.aboutParagraphs.message : undefined} required>
          <Controller control={control} name="aboutParagraphs" render={({ field }) => <StringListInput idPrefix="aboutParagraphs" value={field.value} onChange={field.onChange} multiline addLabel="Add paragraph" />} />
        </Field>
      </Card>

      <Card title="Contact & links">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={err("email")} required>
            <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Location" htmlFor="location" error={err("location")} required>
            <Input id="location" aria-invalid={!!errors.location} {...register("location")} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={err("phone")}>
            <Input id="phone" type="tel" {...register("phone")} />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" error={err("whatsapp")} hint="International format, e.g. +8801700000000">
            <Input id="whatsapp" type="tel" {...register("whatsapp")} />
          </Field>
          <Field label="GitHub username" htmlFor="githubUsername" error={err("githubUsername")} hint="Enables the contribution graph. Leave empty to hide that section.">
            <Input id="githubUsername" aria-invalid={!!errors.githubUsername} {...register("githubUsername")} />
          </Field>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 sm:justify-between">
          <p className="sr-only text-sm text-muted sm:not-sr-only" aria-live="polite">{isDirty ? "You have unsaved changes" : "All changes saved"}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!isDirty || save.isPending} onClick={() => { reset(toForm(profile)); }}>Discard</Button>
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

export function ProfileForm() {
  const { data, isPending, isError, error } = useQuery({ queryKey: ["profile"], queryFn: () => adminFetch<Profile>("/admin/profile") });
  useEffect(() => {
    if (isError) toast.error(errorMessage(error));
  }, [isError, error]);

  return (
    <>
      <PageHeader title="Profile" description="Everything on the hero, about and contact sections." />
      {isPending ? (
        <div className="space-y-6">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : data ? (
        <ProfileFormInner profile={data} />
      ) : (
        <p className="text-muted">Profile could not be loaded.</p>
      )}
    </>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { projectInputSchema, type Project } from "@portfolio/shared";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AdminApiError, adminFetch } from "@/lib/admin/client";
import { errorMessage } from "@/lib/admin/resources";
import { slugify } from "@/lib/admin/slug";
import { ImageUploader } from "./ImageUploader";
import { PageHeader } from "./PageHeader";
import { ProjectGalleryManager, type GalleryItem } from "./ProjectGalleryManager";
import { RichTextEditor } from "./RichTextEditor";
import { StringListInput } from "./StringListInput";
import { TagInput } from "./TagInput";
import { useUnsavedWarning } from "./useUnsavedWarning";

const formSchema = projectInputSchema
  .omit({ startDate: true, endDate: true, coverUrl: true, coverPublicId: true })
  .extend({
    title: z.string().trim().min(1, "Title is required").max(120),
    subtitle: z.string().trim().min(1, "Subtitle is required").max(160),
    summary: z.string().trim().min(1, "Summary is required").max(400),
    description: z.string().min(1, "Description is required"),
    coverUrl: z.string().min(1, "Upload a cover image"),
    coverPublicId: z.string().min(1, "Upload a cover image"),
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ["endDate"], message: "End date must be after the start date" });
type FormIn = z.input<typeof formSchema>;
type FormOut = z.output<typeof formSchema>;

const blank: FormIn = {
  slug: "", title: "", subtitle: "", summary: "", description: "", features: [], architecture: "", techStack: [], role: "",
  coverUrl: "", coverPublicId: "", liveUrl: "", githubUrl: "", githubServerUrl: "", isFeatured: false, status: "DRAFT", startDate: "", endDate: "",
};

const toForm = (p: Project): FormIn => ({
  slug: p.slug, title: p.title, subtitle: p.subtitle, summary: p.summary, description: p.description, features: p.features,
  architecture: p.architecture ?? "", techStack: p.techStack, role: p.role ?? "", coverUrl: p.coverUrl, coverPublicId: p.coverPublicId,
  liveUrl: p.liveUrl ?? "", githubUrl: p.githubUrl ?? "", githubServerUrl: p.githubServerUrl ?? "", isFeatured: p.isFeatured, status: p.status,
  startDate: p.startDate?.slice(0, 10) ?? "", endDate: p.endDate?.slice(0, 10) ?? "",
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

export function ProjectForm({ project }: { project: Project | null }) {
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const editing = project !== null;
  const [slugTouched, setSlugTouched] = useState(editing);
  const [pending, setPending] = useState<GalleryItem[]>([]);
  const tmp = useRef(0);

  const { register, control, handleSubmit, reset, setValue, setError, watch, formState: { errors, isDirty } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(formSchema),
    defaultValues: project ? toForm(project) : blank,
  });
  useUnsavedWarning(isDirty || pending.length > 0);

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: ["projects"] });
    if (project) void qc.invalidateQueries({ queryKey: ["project", project.id] });
    void qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const save = useMutation({
    mutationFn: async (v: FormOut): Promise<Project> => {
      const body = { ...v, startDate: v.startDate || null, endDate: v.endDate || null };
      if (project) return adminFetch<Project>(`/admin/projects/${project.id}`, { method: "PATCH", body });
      const created = await adminFetch<Project>("/admin/projects", { method: "POST", body });
      for (const img of pending) {
        await adminFetch(`/admin/projects/${created.id}/images`, { method: "POST", body: { url: img.url, publicId: img.publicId, alt: img.alt } });
      }
      return created;
    },
    onSuccess: (saved) => {
      toast.success(project ? "Project saved" : "Project created");
      invalidate();
      reset(toForm(saved));
      setPending([]);
      if (!project) router.replace(`/admin/projects/${saved.id}`);
    },
    onError: (err) => {
      if (err instanceof AdminApiError) {
        for (const [f, m] of Object.entries(err.fieldErrors)) if (m?.[0]) setError(f as keyof FormIn, { message: m[0] });
        if (err.code === "CONFLICT") {
          setError("slug", { message: "This slug is already used by another project. It may exist as a draft: check the Projects list, or choose a different slug." });
          document.getElementById("p-slug")?.focus();
          toast.error("This slug is already used by another project (maybe a draft). Change the Slug field or edit the existing project.");
          return;
        }
      }
      toast.error(errorMessage(err));
    },
  });

  const imgBase = project ? `/admin/projects/${project.id}/images` : "";
  const addImage = useMutation({ mutationFn: (i: { url: string; publicId: string }) => adminFetch(imgBase, { method: "POST", body: i }), onSuccess: invalidate });
  const altImage = useMutation({ mutationFn: (v: { id: string; alt: string | null }) => adminFetch(`${imgBase}/${v.id}`, { method: "PATCH", body: { alt: v.alt } }), onSuccess: invalidate, onError: (e) => toast.error(errorMessage(e)) });
  const delImage = useMutation({ mutationFn: (id: string) => adminFetch(`${imgBase}/${id}`, { method: "DELETE" }), onSuccess: () => { toast.success("Image removed"); invalidate(); }, onError: (e) => toast.error(errorMessage(e)) });
  const orderImages = useMutation({
    mutationFn: (ids: string[]) => adminFetch(`${imgBase}/reorder`, { method: "PATCH", body: { items: ids.map((id, order) => ({ id, order })) } }),
    onMutate: (ids) => {
      if (!project) return;
      qc.setQueryData<Project>(["project", project.id], (old) => (old ? { ...old, images: ids.map((id) => old.images.find((i) => i.id === id)).filter((i) => i !== undefined) } : old));
    },
    onSettled: invalidate,
    onError: (e) => toast.error(errorMessage(e)),
  });

  const gallery: GalleryItem[] = project ? project.images.map((i) => ({ id: i.id, url: i.url, publicId: i.publicId, alt: i.alt ?? null })) : pending;
  const galleryHandlers = project
    ? {
        onAdd: async (i: { url: string; publicId: string }) => { await addImage.mutateAsync(i); },
        onRemove: (id: string) => void confirm({ title: "Remove this image?", confirmLabel: "Remove" }).then((ok) => { if (ok) delImage.mutate(id); }),
        onAlt: (id: string, alt: string | null) => { altImage.mutate({ id, alt }); },
        onReorder: (ids: string[]) => { orderImages.mutate(ids); },
      }
    : {
        onAdd: (i: { url: string; publicId: string }) => {
          setPending((p) => [...p, { id: `tmp-${++tmp.current}`, ...i, alt: null }]);
          return Promise.resolve();
        },
        onRemove: (id: string) => { setPending((p) => p.filter((i) => i.id !== id)); },
        onAlt: (id: string, alt: string | null) => { setPending((p) => p.map((i) => (i.id === id ? { ...i, alt } : i))); },
        onReorder: (ids: string[]) => { setPending((p) => ids.map((id) => p.find((i) => i.id === id)).filter((i) => i !== undefined)); },
      };

  async function onDelete(): Promise<void> {
    if (!project) return;
    if (!(await confirm({ title: `Delete “${project.title}”?`, description: "The project and all of its images will be permanently removed." }))) return;
    try {
      await adminFetch(`/admin/projects/${project.id}`, { method: "DELETE" });
      toast.success("Project deleted");
      reset();
      invalidate();
      router.replace("/admin/projects");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const err = (n: keyof FormIn): string | undefined => {
    const e = errors[n];
    return typeof e?.message === "string" ? e.message : undefined;
  };
  const v = watch();
  const cover = v.coverUrl ? { url: v.coverUrl, publicId: v.coverPublicId } : null;
  const previewProject: Project = {
    id: "preview", slug: v.slug, title: v.title || "Project title", subtitle: v.subtitle || "Project subtitle", summary: v.summary || "A short summary appears here.",
    description: "", features: [], architecture: null, techStack: v.techStack ?? [], role: null, coverUrl: v.coverUrl, coverPublicId: "", images: [],
    liveUrl: v.liveUrl || null, githubUrl: v.githubUrl || null, githubServerUrl: null, isFeatured: false, status: "DRAFT", order: 0,
    startDate: null, endDate: null, createdAt: "", updatedAt: "",
  };

  return (
    <>
      <Link href="/admin/projects" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden="true" />All projects</Link>
      <PageHeader
        title={editing ? "Edit project" : "New project"}
        description={editing ? project.title : "Fill in the details, add images, then publish."}
        actions={
          editing ? (
            <>
              {project.status === "PUBLISHED" ? <a href={`/projects/${project.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:border-primary">View live <ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a> : null}
              <Button variant="outline" onClick={() => void onDelete()}><Trash2 className="size-4 text-red-500" aria-hidden="true" />Delete</Button>
            </>
          ) : null
        }
      />

      <form onSubmit={(e) => void handleSubmit((vals) => save.mutateAsync(vals))(e)} noValidate className="pb-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <Card title="Basics">
              <Field label="Title" htmlFor="p-title" error={err("title")} required>
                <Input
                  id="p-title"
                  aria-invalid={!!errors.title}
                  {...register("title", { onChange: (e: React.ChangeEvent<HTMLInputElement>) => { if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldDirty: true }); } })}
                />
              </Field>
              <Field label="Slug" htmlFor="p-slug" error={err("slug")} hint={`Public URL: /projects/${v.slug || "your-slug"}`} required>
                <Input id="p-slug" aria-invalid={!!errors.slug} {...register("slug", { onChange: () => { setSlugTouched(true); } })} />
              </Field>
              <Field label="Subtitle" htmlFor="p-sub" error={err("subtitle")} hint='e.g. "Full-Stack Esports Contest Platform"' required>
                <Input id="p-sub" aria-invalid={!!errors.subtitle} {...register("subtitle")} />
              </Field>
              <Field label="Summary" htmlFor="p-summary" error={err("summary")} hint="Shown on the card (2 lines)." required>
                <Textarea id="p-summary" rows={3} aria-invalid={!!errors.summary} {...register("summary")} />
              </Field>
              <Field label="Your role" htmlFor="p-role" error={err("role")}>
                <Input id="p-role" {...register("role")} />
              </Field>
            </Card>

            <Card title="Content">
              <Field label="Description" htmlFor="p-desc" error={err("description")} required>
                <Controller control={control} name="description" render={({ field }) => <RichTextEditor id="p-desc" value={field.value} onChange={field.onChange} invalid={!!errors.description} placeholder="Describe the project, the problem it solves and your approach…" />} />
              </Field>
              <Field label="Key features" htmlFor="p-features-0">
                <Controller control={control} name="features" render={({ field }) => <StringListInput idPrefix="p-features" value={field.value ?? []} onChange={field.onChange} addLabel="Add feature" />} />
              </Field>
              <Field label="Architecture" htmlFor="p-arch" error={err("architecture")} hint="Optional. How the system is put together.">
                <Controller control={control} name="architecture" render={({ field }) => <RichTextEditor id="p-arch" value={field.value ?? ""} onChange={field.onChange} placeholder="Frontend, backend, database, deployment…" />} />
              </Field>
              <Field label="Tech stack" htmlFor="p-tech">
                <Controller control={control} name="techStack" render={({ field }) => <TagInput id="p-tech" value={field.value ?? []} onChange={field.onChange} placeholder="Next.js, Prisma…" />} />
              </Field>
            </Card>

            <Card title="Links & dates">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Live URL" htmlFor="p-live" error={err("liveUrl")}><Input id="p-live" type="url" placeholder="https://…" aria-invalid={!!errors.liveUrl} {...register("liveUrl")} /></Field>
                <Field label="GitHub URL" htmlFor="p-gh" error={err("githubUrl")}><Input id="p-gh" type="url" placeholder="https://github.com/…" aria-invalid={!!errors.githubUrl} {...register("githubUrl")} /></Field>
                <Field label="Server repo URL" htmlFor="p-ghs" error={err("githubServerUrl")} hint="If the backend lives in a separate repository."><Input id="p-ghs" type="url" aria-invalid={!!errors.githubServerUrl} {...register("githubServerUrl")} /></Field>
                <span className="hidden sm:block" />
                <Field label="Start date" htmlFor="p-start" error={err("startDate")}><Input id="p-start" type="date" {...register("startDate")} /></Field>
                <Field label="End date" htmlFor="p-end" error={err("endDate")}><Input id="p-end" type="date" aria-invalid={!!errors.endDate} {...register("endDate")} /></Field>
              </div>
            </Card>

            <Card title="Gallery" description={editing ? "Changes here are saved immediately." : "Images are attached when you create the project."}>
              <ProjectGalleryManager items={gallery} {...galleryHandlers} />
            </Card>
          </div>

          <aside aria-label="Publishing, cover image and preview" className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card title="Publishing">
              <Controller control={control} name="status" render={({ field }) => (
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="p-status" className="text-sm font-medium">{field.value === "PUBLISHED" ? "Published" : "Draft"}<span className="block text-xs font-normal text-muted">{field.value === "PUBLISHED" ? "Visible on the public site" : "Hidden from the public site"}</span></label>
                  <Switch id="p-status" checked={field.value === "PUBLISHED"} onCheckedChange={(c) => { field.onChange(c ? "PUBLISHED" : "DRAFT"); }} />
                </div>
              )} />
              <Controller control={control} name="isFeatured" render={({ field }) => (
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="p-featured" className="text-sm font-medium">Featured<span className="block text-xs font-normal text-muted">Shown on the homepage</span></label>
                  <Switch id="p-featured" checked={field.value ?? false} onCheckedChange={field.onChange} />
                </div>
              )} />
            </Card>
            <Card title="Cover image" description="16:9 works best.">
              <ImageUploader
                label="Cover"
                folder="projects"
                aspect={16 / 9}
                value={cover}
                error={err("coverUrl") ?? err("coverPublicId")}
                onChange={(img) => {
                  setValue("coverUrl", img?.url ?? "", { shouldDirty: true, shouldValidate: true });
                  setValue("coverPublicId", img?.publicId ?? "", { shouldDirty: true, shouldValidate: true });
                }}
                previewClassName="!h-24 !w-full"
                stacked
              />
            </Card>
            <section aria-label="Card preview" className="space-y-2">
              <h2 className="text-sm font-semibold text-muted">Card preview</h2>
              {v.coverUrl ? (
                <ProjectCard project={previewProject} onOpen={() => undefined} preview />
              ) : (
                <div className="card grid h-48 place-items-center text-sm text-muted">Upload a cover to preview the card</div>
              )}
            </section>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur lg:pl-64">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 sm:justify-between">
            <p className="sr-only text-sm text-muted sm:not-sr-only" aria-live="polite">{isDirty || pending.length > 0 ? "You have unsaved changes" : editing ? "All changes saved" : "Not saved yet"}</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={save.isPending} onClick={() => { router.push("/admin/projects"); }}>Cancel</Button>
              <Button type="submit" disabled={save.isPending || (editing && !isDirty)}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                {editing ? "Save changes" : "Create project"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

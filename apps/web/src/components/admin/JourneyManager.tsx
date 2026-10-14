"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Award, Briefcase, GraduationCap, Loader2, MapPin, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { TIMELINE_TYPES, type TimelineItem, type TimelineType } from "@portfolio/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/components/ui/confirm";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createResource } from "@/lib/admin/resources";
import { ImageUploader } from "./ImageUploader";
import { EmptyState, PageHeader } from "./PageHeader";
import { SortableList } from "./SortableList";
import { TagInput } from "./TagInput";

interface TimelinePayload {
  type: TimelineType;
  title: string;
  organization: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string;
  tags: string[];
  credentialUrl: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isVisible: boolean;
}

const timeline = createResource<TimelineItem, TimelinePayload>("timeline", "/admin/timeline", "Timeline item");

const META: Record<TimelineType, { label: string; singular: string; icon: LucideIcon }> = {
  EXPERIENCE: { label: "Experience", singular: "experience", icon: Briefcase },
  EDUCATION: { label: "Education", singular: "education", icon: GraduationCap },
  CERTIFICATE: { label: "Certificates", singular: "certificate", icon: Award },
};

const formSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(160),
    organization: z.string().trim().min(1, "Organization is required").max(160),
    location: z.string().trim().max(120),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string(),
    current: z.boolean(),
    description: z.string().trim().min(1, "Description is required").max(2000),
    tags: z.array(z.string()),
    credentialUrl: z.union([z.literal(""), z.string().url("Enter a valid URL")]),
    imageUrl: z.string().nullable(),
    imagePublicId: z.string().nullable(),
    isVisible: z.boolean(),
  })
  .refine((v) => v.current || !v.endDate || v.endDate >= v.startDate, { path: ["endDate"], message: "End date must be after the start date" });
type FormValues = z.infer<typeof formSchema>;

const empty: FormValues = {
  title: "", organization: "", location: "", startDate: "", endDate: "", current: false, description: "",
  tags: [], credentialUrl: "", imageUrl: null, imagePublicId: null, isVisible: true,
};

const toForm = (i: TimelineItem): FormValues => ({
  title: i.title,
  organization: i.organization,
  location: i.location ?? "",
  startDate: i.startDate.slice(0, 10),
  endDate: i.endDate?.slice(0, 10) ?? "",
  current: i.endDate === null,
  description: i.description,
  tags: i.tags,
  credentialUrl: i.credentialUrl ?? "",
  imageUrl: i.imageUrl,
  imagePublicId: i.imagePublicId,
  isVisible: i.isVisible,
});

function ItemDialog({ open, onOpenChange, item, type }: { open: boolean; onOpenChange: (o: boolean) => void; item: TimelineItem | null; type: TimelineType }) {
  const create = timeline.useCreate();
  const update = timeline.useUpdate();
  const busy = create.isPending || update.isPending;
  const {
    register, control, handleSubmit, reset, watch, setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: empty });

  useEffect(() => {
    if (open) reset(item ? toForm(item) : empty);
  }, [open, item, reset]);

  async function onSubmit(v: FormValues): Promise<void> {
    const payload: TimelinePayload = {
      type: item?.type ?? type,
      title: v.title,
      organization: v.organization,
      location: v.location || null,
      startDate: v.startDate,
      // "Currently here" means an open-ended item: endDate = null.
      endDate: v.current || !v.endDate ? null : v.endDate,
      description: v.description,
      tags: v.tags,
      credentialUrl: v.credentialUrl || null,
      imageUrl: v.imageUrl,
      imagePublicId: v.imagePublicId,
      isVisible: v.isVisible,
    };
    if (item) await update.mutateAsync({ id: item.id, patch: payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  }

  const effectiveType = item?.type ?? type;
  const current = watch("current");
  const imageUrl = watch("imageUrl");
  const meta = META[effectiveType];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={item ? `Edit ${meta.singular}` : `Add ${meta.singular}`}
      footer={
        <>
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>Cancel</Button>
          <Button type="submit" form="journey-form" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {item ? "Save changes" : "Add"}
          </Button>
        </>
      }
    >
      <form id="journey-form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={effectiveType === "EDUCATION" ? "Degree / programme" : effectiveType === "CERTIFICATE" ? "Certificate name" : "Job title"} htmlFor="j-title" error={errors.title?.message} required>
            <Input id="j-title" aria-invalid={!!errors.title} {...register("title")} />
          </Field>
          <Field label={effectiveType === "EDUCATION" ? "Institution" : effectiveType === "CERTIFICATE" ? "Issuer" : "Company"} htmlFor="j-org" error={errors.organization?.message} required>
            <Input id="j-org" aria-invalid={!!errors.organization} {...register("organization")} />
          </Field>
        </div>
        <Field label="Location" htmlFor="j-location" error={errors.location?.message}>
          <Input id="j-location" {...register("location")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Start date" htmlFor="j-start" error={errors.startDate?.message} required>
            <Input id="j-start" type="date" aria-invalid={!!errors.startDate} {...register("startDate")} />
          </Field>
          <Field label="End date" htmlFor="j-end" error={errors.endDate?.message}>
            <Input id="j-end" type="date" disabled={current} aria-invalid={!!errors.endDate} {...register("endDate")} />
          </Field>
        </div>
        <Controller
          control={control}
          name="current"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Checkbox id="j-current" checked={field.value} onCheckedChange={(c) => { field.onChange(c === true); if (c === true) setValue("endDate", ""); }} />
              <label htmlFor="j-current" className="text-sm font-medium">I currently {effectiveType === "EDUCATION" ? "study" : "work"} here (shown as &ldquo;Present&rdquo;)</label>
            </div>
          )}
        />
        <Field label="Description" htmlFor="j-desc" error={errors.description?.message} required>
          <Textarea id="j-desc" rows={4} aria-invalid={!!errors.description} {...register("description")} />
        </Field>
        <Field label="Tags" htmlFor="j-tags" hint="Technologies or topics. Press Enter after each.">
          <Controller control={control} name="tags" render={({ field }) => <TagInput id="j-tags" value={field.value} onChange={field.onChange} />} />
        </Field>
        {effectiveType === "CERTIFICATE" ? (
          <>
            <Field label="Credential URL" htmlFor="j-cred" error={errors.credentialUrl?.message}>
              <Input id="j-cred" type="url" placeholder="https://…" aria-invalid={!!errors.credentialUrl} {...register("credentialUrl")} />
            </Field>
            <ImageUploader
              label="Certificate image"
              folder="certificates"
              value={imageUrl ? { url: imageUrl, publicId: watch("imagePublicId") ?? "" } : null}
              onChange={(v) => {
                setValue("imageUrl", v?.url ?? null, { shouldDirty: true });
                setValue("imagePublicId", v?.publicId ?? null, { shouldDirty: true });
              }}
            />
          </>
        ) : null}
        <Controller
          control={control}
          name="isVisible"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch id="j-visible" checked={field.value} onCheckedChange={field.onChange} />
              <label htmlFor="j-visible" className="text-sm font-medium">Visible on the public site</label>
            </div>
          )}
        />
      </form>
    </Modal>
  );
}

const range = (i: TimelineItem): string => {
  const y = (d: string): string => String(new Date(d).getUTCFullYear());
  return i.type === "CERTIFICATE" ? y(i.startDate) : `${y(i.startDate)} – ${i.endDate ? y(i.endDate) : "Present"}`;
};

export function JourneyManager() {
  const { data, isPending, isError } = timeline.useList();
  const update = timeline.useUpdate();
  const remove = timeline.useRemove();
  const reorder = timeline.useReorder();
  const confirm = useConfirm();
  const [tab, setTab] = useState<TimelineType>("EXPERIENCE");
  const [editing, setEditing] = useState<TimelineItem | null>(null);
  const [open, setOpen] = useState(false);

  const openDialog = (i: TimelineItem | null): void => {
    setEditing(i);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Journey"
        description="Experience, education and certificates shown on the timeline."
        actions={<Button onClick={() => { openDialog(null); }}><Plus className="size-4" aria-hidden="true" />Add {META[tab].singular}</Button>}
      />
      <Tabs value={tab} onValueChange={(v) => { setTab(v as TimelineType); }}>
        <TabsList aria-label="Timeline types">
          {TIMELINE_TYPES.map((t) => {
            const Icon = META[t].icon;
            return (
              <TabsTrigger key={t} value={t}>
                <Icon className="size-4" aria-hidden="true" />
                {META[t].label}
                <span className="rounded-full bg-black/10 px-1.5 text-xs">{data?.filter((i) => i.type === t).length ?? 0}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {TIMELINE_TYPES.map((t) => {
          const items = (data ?? []).filter((i) => i.type === t).sort((a, b) => a.order - b.order);
          return (
            <TabsContent key={t} value={t} className="mt-6">
              {isPending ? (
                <ListSkeleton />
              ) : isError ? (
                <EmptyState title="Could not load the timeline" />
              ) : items.length === 0 ? (
                <EmptyState title={`No ${META[t].label.toLowerCase()} yet`} action={<Button onClick={() => { openDialog(null); }}>Add one</Button>} />
              ) : (
                <SortableList
                  label={META[t].label}
                  items={items}
                  onReorder={(next) => { reorder.mutate(next.map((i) => i.id)); }}
                  renderItem={(i, handle) => (
                    <div className="card flex items-center gap-2 p-3 sm:gap-3">
                      {handle}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{i.title}</p>
                        <p className="truncate text-sm text-ink">{i.organization}</p>
                        <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                          <span>{range(i)}</span>
                          {i.location ? <span className="inline-flex items-center gap-1"><MapPin className="size-3" aria-hidden="true" />{i.location}</span> : null}
                        </p>
                      </div>
                      {i.endDate === null && i.type !== "CERTIFICATE" ? <Badge tone="success" className="hidden sm:inline-flex">Current</Badge> : null}
                      <Switch checked={i.isVisible} aria-label={`${i.title} visible`} onCheckedChange={(v) => { update.mutate({ id: i.id, patch: { isVisible: v }, silent: true }); }} />
                      <Button variant="ghost" size="icon" aria-label={`Edit ${i.title}`} onClick={() => { openDialog(i); }}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${i.title}`}
                        onClick={() => void confirm({ title: `Delete “${i.title}”?`, description: i.imageUrl ? "Its image will also be removed from storage." : undefined }).then((ok) => { if (ok) remove.mutate(i.id); })}
                      >
                        <Trash2 className="size-4 text-red-500" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      <ItemDialog open={open} onOpenChange={setOpen} item={editing} type={tab} />
    </>
  );
}

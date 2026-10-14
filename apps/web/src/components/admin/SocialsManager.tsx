"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { socialLinkInputSchema, type SocialLink, type SocialLinkInput } from "@portfolio/shared";
import { SocialIcon } from "./SocialIconLite";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { createResource } from "@/lib/admin/resources";
import { EmptyState, PageHeader } from "./PageHeader";
import { SortableList } from "./SortableList";

const socials = createResource<SocialLink, SocialLinkInput>("socials", "/admin/socials", "Social link");
const PLATFORMS = ["github", "linkedin", "x", "facebook", "instagram", "youtube", "whatsapp", "telegram", "discord", "dev"];
type FormIn = z.input<typeof socialLinkInputSchema>;
const blank: FormIn = { platform: "", url: "", icon: "Globe", isVisible: true };

function LinkDialog({ open, onOpenChange, link }: { open: boolean; onOpenChange: (o: boolean) => void; link: SocialLink | null }) {
  const create = socials.useCreate();
  const update = socials.useUpdate();
  const busy = create.isPending || update.isPending;
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormIn, unknown, SocialLinkInput>({ resolver: zodResolver(socialLinkInputSchema), defaultValues: blank });

  useEffect(() => {
    if (open) reset(link ? { platform: link.platform, url: link.url, icon: link.icon, isVisible: link.isVisible } : blank);
  }, [open, link, reset]);

  async function onSubmit(v: SocialLinkInput): Promise<void> {
    const payload = { ...v, platform: v.platform.toLowerCase() };
    if (link) await update.mutateAsync({ id: link.id, patch: payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={link ? "Edit social link" : "Add social link"}
      footer={
        <>
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>Cancel</Button>
          <Button type="submit" form="social-form" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}{link ? "Save changes" : "Add link"}</Button>
        </>
      }
    >
      <form id="social-form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="space-y-5">
        <Field label="Platform" htmlFor="s-platform" error={errors.platform?.message} hint="Known platforms (GitHub, LinkedIn, X…) get their brand icon automatically." required>
          <Input id="s-platform" list="platforms" aria-invalid={!!errors.platform} {...register("platform")} />
          <datalist id="platforms">{PLATFORMS.map((p) => <option key={p} value={p} />)}</datalist>
        </Field>
        <Field label="URL" htmlFor="s-url" error={errors.url?.message} required>
          <Input id="s-url" type="url" placeholder="https://…" aria-invalid={!!errors.url} {...register("url")} />
        </Field>
        <Field label="Fallback icon name" htmlFor="s-icon" error={errors.icon?.message} hint="Lucide icon used for platforms without a brand icon, e.g. Globe, Mail, Link.">
          <Input id="s-icon" {...register("icon")} />
        </Field>
        <Controller control={control} name="isVisible" render={({ field }) => (
          <div className="flex items-center gap-3">
            <Switch id="s-visible" checked={field.value} onCheckedChange={field.onChange} />
            <label htmlFor="s-visible" className="text-sm font-medium">Visible on the public site</label>
          </div>
        )} />
      </form>
    </Modal>
  );
}

export function SocialsManager() {
  const { data, isPending, isError } = socials.useList();
  const update = socials.useUpdate();
  const remove = socials.useRemove();
  const reorder = socials.useReorder();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [open, setOpen] = useState(false);
  const items = [...(data ?? [])].sort((a, b) => a.order - b.order);
  const openDialog = (l: SocialLink | null): void => { setEditing(l); setOpen(true); };

  return (
    <>
      <PageHeader title="Social links" description="Shown in the contact section and footer." actions={<Button onClick={() => { openDialog(null); }}><Plus className="size-4" aria-hidden="true" />Add link</Button>} />
      {isPending ? <ListSkeleton rows={3} /> : isError ? <EmptyState title="Could not load social links" /> : items.length === 0 ? (
        <EmptyState title="No social links yet" action={<Button onClick={() => { openDialog(null); }}>Add one</Button>} />
      ) : (
        <SortableList
          label="Social links"
          items={items}
          onReorder={(next) => { reorder.mutate(next.map((i) => i.id)); }}
          renderItem={(l, handle) => (
            <div className="card flex items-center gap-2 p-3 sm:gap-3">
              {handle}
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line"><SocialIcon platform={l.platform} className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold capitalize">{l.platform}</p>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-sm text-muted hover:text-ink">
                  <span className="truncate">{l.url}</span><ExternalLink className="size-3 shrink-0" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
              <Switch checked={l.isVisible} aria-label={`${l.platform} visible`} onCheckedChange={(v) => { update.mutate({ id: l.id, patch: { isVisible: v }, silent: true }); }} />
              <Button variant="ghost" size="icon" aria-label={`Edit ${l.platform}`} onClick={() => { openDialog(l); }}><Pencil className="size-4" aria-hidden="true" /></Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${l.platform}`} onClick={() => void confirm({ title: `Delete the ${l.platform} link?` }).then((ok) => { if (ok) remove.mutate(l.id); })}><Trash2 className="size-4 text-red-500" aria-hidden="true" /></Button>
            </div>
          )}
        />
      )}
      <LinkDialog open={open} onOpenChange={setOpen} link={editing} />
    </>
  );
}

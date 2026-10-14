"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { sectionConfigUpdateSchema, type SectionConfig, type SectionConfigUpdate } from "@portfolio/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { createResource } from "@/lib/admin/resources";
import { EmptyState, PageHeader } from "./PageHeader";
import { SortableList } from "./SortableList";

const sections = createResource<SectionConfig, SectionConfigUpdate>("sections", "/admin/sections", "Section");

function SectionDialog({ open, onOpenChange, section }: { open: boolean; onOpenChange: (o: boolean) => void; section: SectionConfig | null }) {
  const update = sections.useUpdate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SectionConfigUpdate>({ resolver: zodResolver(sectionConfigUpdateSchema) });

  useEffect(() => {
    if (open && section) reset({ title: section.title, subtitle: section.subtitle ?? "" });
  }, [open, section, reset]);

  async function onSubmit(v: SectionConfigUpdate): Promise<void> {
    if (!section) return;
    await update.mutateAsync({ id: section.id, patch: { title: v.title, subtitle: v.subtitle || null } });
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit “${section?.key ?? ""}” section`}
      footer={
        <>
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>Cancel</Button>
          <Button type="submit" form="section-form" disabled={update.isPending}>{update.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}Save changes</Button>
        </>
      }
    >
      <form id="section-form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="space-y-5">
        <Field label="Title" htmlFor="sec-title" error={errors.title?.message} required>
          <Input id="sec-title" aria-invalid={!!errors.title} {...register("title")} />
        </Field>
        <Field label="Subtitle" htmlFor="sec-sub" error={errors.subtitle?.message} hint="Shown under the title. Optional.">
          <Input id="sec-sub" {...register("subtitle")} />
        </Field>
      </form>
    </Modal>
  );
}

export function SectionsManager() {
  const { data, isPending, isError } = sections.useList();
  const update = sections.useUpdate();
  const reorder = sections.useReorder();
  const [editing, setEditing] = useState<SectionConfig | null>(null);
  const [open, setOpen] = useState(false);
  const items = [...(data ?? [])].sort((a, b) => a.order - b.order);

  return (
    <>
      <PageHeader title="Sections" description="Rename, hide and reorder the sections of the homepage. Hidden sections also disappear from the navbar." />
      {isPending ? <ListSkeleton rows={7} /> : isError ? <EmptyState title="Could not load sections" /> : (
        <SortableList
          label="Homepage sections"
          items={items}
          onReorder={(next) => { reorder.mutate(next.map((i) => i.id)); }}
          renderItem={(s, handle) => (
            <div className="card flex items-center gap-2 p-3 sm:gap-3">
              {handle}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  <span className="truncate">{s.title}</span>
                  <Badge>{s.key}</Badge>
                </p>
                {s.subtitle ? <p className="truncate text-sm text-muted">{s.subtitle}</p> : null}
              </div>
              <span className="hidden text-xs text-muted sm:inline">{s.isVisible ? "Visible" : "Hidden"}</span>
              <Switch checked={s.isVisible} aria-label={`${s.title} visible`} onCheckedChange={(v) => { update.mutate({ id: s.id, patch: { isVisible: v }, silent: true }); }} />
              <Button variant="ghost" size="icon" aria-label={`Edit ${s.title}`} onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="size-4" aria-hidden="true" /></Button>
            </div>
          )}
        />
      )}
      <SectionDialog open={open} onOpenChange={setOpen} section={editing} />
    </>
  );
}

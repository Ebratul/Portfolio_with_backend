"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { valueCardInputSchema, type ValueCard, type ValueCardInput } from "@portfolio/shared";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import { createResource } from "@/lib/admin/resources";
import { IconField, IconPreview } from "./IconField";
import { EmptyState, PageHeader } from "./PageHeader";
import { SortableList } from "./SortableList";

const cards = createResource<ValueCard, ValueCardInput>("value-cards", "/admin/value-cards", "Value card");
const blank: ValueCardInput = { title: "", icon: "", description: "" };

function CardDialog({ open, onOpenChange, card }: { open: boolean; onOpenChange: (o: boolean) => void; card: ValueCard | null }) {
  const create = cards.useCreate();
  const update = cards.useUpdate();
  const busy = create.isPending || update.isPending;
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ValueCardInput>({ resolver: zodResolver(valueCardInputSchema), defaultValues: blank });

  useEffect(() => {
    if (open) reset(card ? { title: card.title, icon: card.icon, description: card.description ?? "" } : blank);
  }, [open, card, reset]);

  async function onSubmit(v: ValueCardInput): Promise<void> {
    const payload = { ...v, description: v.description || null };
    if (card) await update.mutateAsync({ id: card.id, patch: payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={card ? "Edit value card" : "Add value card"}
      footer={
        <>
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>Cancel</Button>
          <Button type="submit" form="value-form" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}{card ? "Save changes" : "Add card"}</Button>
        </>
      }
    >
      <form id="value-form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="space-y-5">
        <Field label="Title" htmlFor="v-title" error={errors.title?.message} required>
          <Input id="v-title" aria-invalid={!!errors.title} {...register("title")} />
        </Field>
        <Field label="Icon" htmlFor="v-icon" error={errors.icon?.message} required>
          <Controller control={control} name="icon" render={({ field }) => <IconField id="v-icon" kind="lucide" value={field.value} onChange={field.onChange} />} />
        </Field>
        <Field label="Description" htmlFor="v-desc" error={errors.description?.message} hint="Optional one-liner shown under the title.">
          <Input id="v-desc" {...register("description")} />
        </Field>
      </form>
    </Modal>
  );
}

export function ValueCardsManager() {
  const { data, isPending, isError } = cards.useList();
  const remove = cards.useRemove();
  const reorder = cards.useReorder();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<ValueCard | null>(null);
  const [open, setOpen] = useState(false);
  const items = [...(data ?? [])].sort((a, b) => a.order - b.order);
  const openDialog = (c: ValueCard | null): void => { setEditing(c); setOpen(true); };

  return (
    <>
      <PageHeader title="Value cards" description='The small "Problem Solving / Clean Code" cards in the About section.' actions={<Button onClick={() => { openDialog(null); }}><Plus className="size-4" aria-hidden="true" />Add card</Button>} />
      {isPending ? <ListSkeleton rows={3} /> : isError ? <EmptyState title="Could not load value cards" /> : items.length === 0 ? (
        <EmptyState title="No value cards yet" action={<Button onClick={() => { openDialog(null); }}>Add one</Button>} />
      ) : (
        <SortableList
          label="Value cards"
          items={items}
          onReorder={(next) => { reorder.mutate(next.map((i) => i.id)); }}
          renderItem={(c, handle) => (
            <div className="card flex items-center gap-2 p-3 sm:gap-3">
              {handle}
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-ink"><IconPreview kind="lucide" name={c.icon} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.title}</p>
                {c.description ? <p className="truncate text-sm text-muted">{c.description}</p> : null}
              </div>
              <Button variant="ghost" size="icon" aria-label={`Edit ${c.title}`} onClick={() => { openDialog(c); }}><Pencil className="size-4" aria-hidden="true" /></Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${c.title}`} onClick={() => void confirm({ title: `Delete “${c.title}”?` }).then((ok) => { if (ok) remove.mutate(c.id); })}><Trash2 className="size-4 text-red-500" aria-hidden="true" /></Button>
            </div>
          )}
        />
      )}
      <CardDialog open={open} onOpenChange={setOpen} card={editing} />
    </>
  );
}

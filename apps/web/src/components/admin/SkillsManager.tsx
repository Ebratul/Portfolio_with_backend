"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import {
  SKILL_CATEGORIES,
  SKILL_LEVELS,
  skillInputSchema,
  type Skill,
  type SkillCategory,
  type SkillInput,
} from "@portfolio/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createResource } from "@/lib/admin/resources";
import { ColorField } from "./ColorField";
import { IconField, IconPreview } from "./IconField";
import { EmptyState, PageHeader } from "./PageHeader";
import { SortableList } from "./SortableList";

const skills = createResource<Skill, SkillInput>("skills", "/admin/skills", "Skill");

const CATEGORY_LABEL: Record<SkillCategory, string> = {
  LANGUAGES: "Languages",
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DATABASE: "Database",
  TOOLS: "Tools & others",
};
const LEVEL_OPTIONS = SKILL_LEVELS.map((l) => ({ value: l, label: l.charAt(0) + l.slice(1).toLowerCase() }));
const CATEGORY_OPTIONS = SKILL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }));

type FormIn = z.input<typeof skillInputSchema>;
type FormOut = z.output<typeof skillInputSchema>;

function SkillDialog({ open, onOpenChange, skill, category }: { open: boolean; onOpenChange: (o: boolean) => void; skill: Skill | null; category: SkillCategory }) {
  const create = skills.useCreate();
  const update = skills.useUpdate();
  const busy = create.isPending || update.isPending;
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(skillInputSchema),
    defaultValues: { name: "", category, level: "INTERMEDIATE", percentage: 70, icon: "", iconColor: null, isVisible: true },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      skill
        ? { name: skill.name, category: skill.category, level: skill.level, percentage: skill.percentage, icon: skill.icon, iconColor: skill.iconColor ?? null, isVisible: skill.isVisible }
        : { name: "", category, level: "INTERMEDIATE", percentage: 70, icon: "", iconColor: null, isVisible: true },
    );
  }, [open, skill, category, reset]);

  async function onSubmit(values: FormOut): Promise<void> {
    if (skill) await update.mutateAsync({ id: skill.id, patch: values });
    else await create.mutateAsync(values);
    onOpenChange(false);
  }

  const color = watch("iconColor");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={skill ? "Edit skill" : "Add skill"}
      footer={
        <>
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>Cancel</Button>
          <Button type="submit" form="skill-form" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {skill ? "Save changes" : "Add skill"}
          </Button>
        </>
      }
    >
      <form id="skill-form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="space-y-5">
        <Field label="Name" htmlFor="skill-name" error={errors.name?.message} required>
          <Input id="skill-name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="skill-category" error={errors.category?.message}>
            <Controller control={control} name="category" render={({ field }) => <Select id="skill-category" value={field.value} onValueChange={field.onChange} options={CATEGORY_OPTIONS} />} />
          </Field>
          <Field label="Level" htmlFor="skill-level" error={errors.level?.message}>
            <Controller control={control} name="level" render={({ field }) => <Select id="skill-level" value={field.value} onValueChange={field.onChange} options={LEVEL_OPTIONS} />} />
          </Field>
        </div>
        <Field label="Proficiency" htmlFor="skill-percentage" error={errors.percentage?.message}>
          <Controller
            control={control}
            name="percentage"
            render={({ field }) => (
              <div className="flex items-center gap-4">
                <Slider aria-label="Proficiency percentage" value={field.value} onValueChange={field.onChange} min={0} max={100} step={1} />
                <Input id="skill-percentage" type="number" min={0} max={100} value={field.value} onChange={(e) => { field.onChange(e.target.valueAsNumber); }} className="w-20" />
              </div>
            )}
          />
        </Field>
        <Field label="Icon" htmlFor="skill-icon" error={errors.icon?.message} hint="Searchable Simple Icons library." required>
          <Controller control={control} name="icon" render={({ field }) => <IconField id="skill-icon" kind="si" value={field.value} color={color} onChange={field.onChange} />} />
        </Field>
        <Field label="Icon colour" htmlFor="skill-color" error={errors.iconColor?.message} hint="Optional. Leave empty to use the text colour.">
          <Controller control={control} name="iconColor" render={({ field }) => <ColorField id="skill-color" value={field.value} onChange={field.onChange} clearable invalid={!!errors.iconColor} />} />
        </Field>
        <Controller
          control={control}
          name="isVisible"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch id="skill-visible" checked={field.value} onCheckedChange={field.onChange} />
              <label htmlFor="skill-visible" className="text-sm font-medium">Visible on the public site</label>
            </div>
          )}
        />
      </form>
    </Modal>
  );
}

export function SkillsManager() {
  const { data, isPending, isError } = skills.useList();
  const update = skills.useUpdate();
  const remove = skills.useRemove();
  const reorder = skills.useReorder();
  const confirm = useConfirm();
  const [tab, setTab] = useState<SkillCategory>("LANGUAGES");
  const [editing, setEditing] = useState<Skill | null>(null);
  const [open, setOpen] = useState(false);

  const openDialog = (skill: Skill | null): void => {
    setEditing(skill);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Skills"
        description="Grouped by category. Drag the handle (or focus it and use the arrow keys) to reorder."
        actions={<Button onClick={() => { openDialog(null); }}><Plus className="size-4" aria-hidden="true" />Add skill</Button>}
      />
      <Tabs value={tab} onValueChange={(v) => { setTab(v as SkillCategory); }}>
        <TabsList aria-label="Skill categories">
          {SKILL_CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>
              {CATEGORY_LABEL[c]}
              <span className="rounded-full bg-black/10 px-1.5 text-xs">{data?.filter((s) => s.category === c).length ?? 0}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {SKILL_CATEGORIES.map((c) => {
          const items = (data ?? []).filter((s) => s.category === c).sort((a, b) => a.order - b.order);
          return (
            <TabsContent key={c} value={c} className="mt-6">
              {isPending ? (
                <ListSkeleton />
              ) : isError ? (
                <EmptyState title="Could not load skills" />
              ) : items.length === 0 ? (
                <EmptyState title={`No ${CATEGORY_LABEL[c].toLowerCase()} skills yet`} action={<Button onClick={() => { openDialog(null); }}>Add one</Button>} />
              ) : (
                <SortableList
                  label={`${CATEGORY_LABEL[c]} skills`}
                  items={items}
                  onReorder={(next) => { reorder.mutate(next.map((i) => i.id)); }}
                  renderItem={(s, handle) => (
                    <div className="card flex items-center gap-2 p-3 sm:gap-3">
                      {handle}
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-bg">
                        <IconPreview kind="si" name={s.icon} color={s.iconColor} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{s.name}</p>
                        <p className="text-xs capitalize text-muted">{s.percentage}% · {s.level.toLowerCase()}</p>
                      </div>
                      <Badge tone={s.level === "PRO" ? "brand" : "neutral"} className="hidden sm:inline-flex">{s.level}</Badge>
                      <Switch
                        checked={s.isVisible}
                        aria-label={`${s.name} visible`}
                        onCheckedChange={(v) => { update.mutate({ id: s.id, patch: { isVisible: v }, silent: true }); }}
                      />
                      <Button variant="ghost" size="icon" aria-label={`Edit ${s.name}`} onClick={() => { openDialog(s); }}>
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${s.name}`}
                        onClick={() => void confirm({ title: `Delete “${s.name}”?`, description: "It will disappear from the public site." }).then((ok) => { if (ok) remove.mutate(s.id); })}
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
      <SkillDialog open={open} onOpenChange={setOpen} skill={editing} category={tab} />
    </>
  );
}

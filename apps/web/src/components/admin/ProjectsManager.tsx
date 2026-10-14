"use client";

import { ExternalLink, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PROJECT_STATUSES, type Project, type ProjectInput } from "@portfolio/shared";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Input } from "@/components/ui/input";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { createResource } from "@/lib/admin/resources";
import { cn } from "@/lib/cn";
import { EmptyState, PageHeader } from "./PageHeader";
import { SortableList } from "./SortableList";

export const projects = createResource<Project, ProjectInput>("projects", "/admin/projects", "Project");

const STATUS_OPTS = [{ value: "all", label: "All statuses" }, ...PROJECT_STATUSES.map((s) => ({ value: s, label: s === "DRAFT" ? "Draft" : "Published" }))];

export function ProjectsManager() {
  const { data, isPending, isError } = projects.useList();
  const update = projects.useUpdate();
  const remove = projects.useRemove();
  const reorder = projects.useReorder();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const all = useMemo(() => [...(data ?? [])].sort((a, b) => a.order - b.order), [data]);
  const filtered = all.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      (!search.trim() || `${p.title} ${p.subtitle} ${p.techStack.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const filtering = search.trim() !== "" || status !== "all";

  return (
    <>
      <PageHeader
        title="Projects"
        description="Create, publish and reorder your projects."
        actions={<Link href="/admin/projects/new" className={buttonClasses("primary")}><Plus className="size-4" aria-hidden="true" />New project</Link>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input aria-label="Search projects" placeholder="Search by title or tech…" value={search} onChange={(e) => { setSearch(e.target.value); }} className="pl-9" />
        </div>
        <div className="w-44"><Select ariaLabel="Filter by status" value={status} onValueChange={setStatus} options={STATUS_OPTS} /></div>
      </div>
      {filtering && filtered.length > 0 ? <p className="mb-3 text-xs text-muted">Clear the search and filter to drag projects into a new order.</p> : null}

      {isPending ? <ListSkeleton /> : isError ? <EmptyState title="Could not load projects" /> : filtered.length === 0 ? (
        <EmptyState
          title={filtering ? "No projects match your filters" : "No projects yet"}
          action={filtering ? undefined : <Link href="/admin/projects/new" className={buttonClasses("primary")}>Create your first project</Link>}
        />
      ) : (
        <SortableList
          label="Projects"
          items={filtered}
          disabled={filtering}
          onReorder={(next) => { reorder.mutate(next.map((i) => i.id)); }}
          renderItem={(p, handle) => (
            <div className="card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              {handle}
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
                <Image src={p.coverUrl} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/projects/${p.id}`} className="block truncate font-semibold hover:text-ink">{p.title}</Link>
                <p className="truncate text-sm text-muted">{p.subtitle}</p>
                <p className="mt-0.5 hidden truncate text-xs text-muted md:block">{p.techStack.slice(0, 5).join(" · ")}</p>
              </div>
              <button
                type="button"
                onClick={() => { update.mutate({ id: p.id, patch: { status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" } }); }}
                aria-label={`${p.title} is ${p.status === "PUBLISHED" ? "published. Click to unpublish" : "a draft. Click to publish"}`}
                className="rounded-full"
              >
                <Badge tone={p.status === "PUBLISHED" ? "success" : "warn"}>{p.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={p.isFeatured}
                aria-label={`${p.isFeatured ? "Remove" : "Mark"} ${p.title} as featured`}
                onClick={() => { update.mutate({ id: p.id, patch: { isFeatured: !p.isFeatured }, silent: true }); }}
              >
                <Star className={cn("size-4", p.isFeatured && "fill-amber-400 text-amber-400")} aria-hidden="true" />
              </Button>
              {p.liveUrl ? (
                <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title} live (new tab)`} className={buttonClasses("ghost", "icon")}>
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              ) : null}
              <Link href={`/admin/projects/${p.id}`} aria-label={`Edit ${p.title}`} className={buttonClasses("ghost", "icon")}><Pencil className="size-4" aria-hidden="true" /></Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${p.title}`}
                onClick={() => void confirm({ title: `Delete “${p.title}”?`, description: "The project and all of its images will be permanently removed." }).then((ok) => { if (ok) remove.mutate(p.id); })}
              >
                <Trash2 className="size-4 text-red-500" aria-hidden="true" />
              </Button>
            </div>
          )}
        />
      )}
    </>
  );
}

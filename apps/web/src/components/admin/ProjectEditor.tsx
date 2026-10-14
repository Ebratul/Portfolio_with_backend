"use client";

import { useQuery } from "@tanstack/react-query";
import type { Project } from "@portfolio/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client";
import { EmptyState } from "./PageHeader";
import { ProjectForm } from "./ProjectForm";

export function ProjectEditor({ id }: { id: string }) {
  const { data, isPending, isError } = useQuery({ queryKey: ["project", id], queryFn: () => adminFetch<Project>(`/admin/projects/${id}`) });
  if (isPending) return <div className="space-y-6">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56" />)}</div>;
  if (isError) return <EmptyState title="Project not found" hint="It may have been deleted." />;
  // Re-mount when the server copy changes identity so the form resets cleanly after a save.
  return <ProjectForm key={`${data.id}:${data.updatedAt}`} project={data} />;
}

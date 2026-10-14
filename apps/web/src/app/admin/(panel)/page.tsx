"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Mail, Plus, Settings, Sparkles, UserRound, Route as RouteIcon, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ContactMessage } from "@portfolio/shared";
import { EmptyState, PageHeader } from "@/components/admin/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminFetch } from "@/lib/admin/client";

interface Stats {
  projects: number;
  publishedProjects: number;
  skills: number;
  timelineItems: number;
  messages: number;
  unreadMessages: number;
  recentMessages: ContactMessage[];
}

function StatCard({ label, value, sub, icon, href }: { label: string; value: number; sub?: string; icon: ReactNode; href: string }) {
  return (
    <Link href={href} className="card group flex items-center gap-4 p-5 transition hover:border-primary/60">
      <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-ink">{icon}</span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="font-heading text-3xl font-bold leading-tight">{value}</p>
        {sub ? <p className="text-xs text-muted">{sub}</p> : null}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["stats"], queryFn: () => adminFetch<Stats>("/admin/stats") });

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your portfolio content." />

      {isError ? (
        <EmptyState title="Could not load the dashboard" action={<button className={buttonClasses("outline")} onClick={() => void refetch()}>Retry</button>} />
      ) : (
        <>
          <section aria-label="Statistics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isPending ? (
              Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                <StatCard label="Projects" value={data.projects} sub={`${data.publishedProjects} published`} icon={<FolderKanban className="size-6" />} href="/admin/projects" />
                <StatCard label="Skills" value={data.skills} icon={<Sparkles className="size-6" />} href="/admin/skills" />
                <StatCard label="Timeline items" value={data.timelineItems} icon={<RouteIcon className="size-6" />} href="/admin/journey" />
                <StatCard label="Unread messages" value={data.unreadMessages} sub={`${data.messages} total`} icon={<Mail className="size-6" />} href="/admin/messages" />
              </>
            )}
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section aria-labelledby="recent" className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="recent" className="text-lg font-bold">Recent messages</h2>
                <Link href="/admin/messages" className="text-sm font-medium text-ink hover:underline">View all</Link>
              </div>
              {isPending ? (
                <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : data.recentMessages.length > 0 ? (
                <ul className="divide-y divide-line">
                  {data.recentMessages.map((m) => (
                    <li key={m.id}>
                      <Link href="/admin/messages" className="flex items-start gap-3 py-3 hover:bg-line/40">
                        <span aria-hidden="true" className={`mt-2 size-2 shrink-0 rounded-full ${m.isRead ? "bg-transparent" : "bg-primary"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-sm font-semibold">
                            <span className="truncate">{m.name}</span>
                            {!m.isRead ? <Badge tone="brand">New</Badge> : null}
                          </p>
                          <p className="truncate text-sm text-muted">{m.subject}</p>
                        </div>
                        <time dateTime={m.createdAt} className="shrink-0 text-xs text-muted">
                          {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No messages yet" hint="Messages from your contact form will appear here." />
              )}
            </section>

            <section aria-labelledby="quick" className="card p-5">
              <h2 id="quick" className="mb-4 text-lg font-bold">Quick actions</h2>
              <ul className="space-y-2">
                {[
                  { href: "/admin/projects/new", label: "New project", icon: Plus },
                  { href: "/admin/skills", label: "Manage skills", icon: Sparkles },
                  { href: "/admin/profile", label: "Edit profile", icon: UserRound },
                  { href: "/admin/settings", label: "Site settings", icon: Settings },
                ].map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link href={href} className={buttonClasses("outline", "md", "w-full justify-start")}>
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href="/" target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "md", "w-full justify-start")}>
                    <ExternalLink className="size-4" aria-hidden="true" />
                    View public site<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}

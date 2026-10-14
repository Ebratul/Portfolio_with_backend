"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { CheckCheck, ChevronLeft, ChevronRight, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ContactMessage, Paginated } from "@portfolio/shared";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/components/ui/confirm";
import { Modal } from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client";
import { errorMessage } from "@/lib/admin/resources";
import { cn } from "@/lib/cn";
import { EmptyState, PageHeader } from "./PageHeader";

type Filter = "all" | "unread" | "read";
const PAGE_SIZE = 15;

const fmt = (iso: string): string =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export function MessagesManager() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<ContactMessage | null>(null);

  const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (filter !== "all") qs.set("isRead", filter === "read" ? "true" : "false");
  const { data, isPending, isError } = useQuery({
    queryKey: ["messages", filter, page],
    queryFn: () => adminFetch<Paginated<ContactMessage>>(`/admin/messages?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });

  const refresh = (): void => {
    void qc.invalidateQueries({ queryKey: ["messages"] });
    void qc.invalidateQueries({ queryKey: ["stats"] });
  };

  const setRead = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => adminFetch<ContactMessage>(`/admin/messages/${id}`, { method: "PATCH", body: { isRead } }),
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/messages/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("Message deleted"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const bulk = useMutation({
    mutationFn: (v: { ids: string[]; action: "read" | "unread" | "delete" }) => adminFetch<{ count: number }>("/admin/messages/bulk", { method: "POST", body: v }),
    onSuccess: (r, v) => {
      toast.success(`${r.count} message${r.count === 1 ? "" : "s"} ${v.action === "delete" ? "deleted" : `marked ${v.action}`}`);
      setSelected(new Set());
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const allChecked = items.length > 0 && items.every((m) => selected.has(m.id));

  function openMessage(m: ContactMessage): void {
    setOpen(m);
    if (!m.isRead) setRead.mutate({ id: m.id, isRead: true });
  }
  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  async function deleteSelected(): Promise<void> {
    if (await confirm({ title: `Delete ${selected.size} message${selected.size === 1 ? "" : "s"}?` })) bulk.mutate({ ids: [...selected], action: "delete" });
  }

  return (
    <>
      <PageHeader title="Messages" description="Messages sent through the contact form." />
      {/* A filter, not tabs: there is no per-tab panel, so toggle buttons are the correct semantics. */}
      <div role="group" aria-label="Filter messages" className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => { setFilter(f); setPage(1); setSelected(new Set()); }}
            className="rounded-lg px-3.5 py-1.5 text-sm font-semibold capitalize text-muted transition hover:text-fg aria-pressed:bg-brand-gradient aria-pressed:text-on-primary"
          >
            {f}
          </button>
        ))}
      </div>

      {selected.size > 0 ? (
        <div role="region" aria-label="Bulk actions" className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => { bulk.mutate({ ids: [...selected], action: "read" }); }}><MailOpen className="size-4" aria-hidden="true" />Mark read</Button>
          <Button size="sm" variant="outline" onClick={() => { bulk.mutate({ ids: [...selected], action: "unread" }); }}><Mail className="size-4" aria-hidden="true" />Mark unread</Button>
          <Button size="sm" variant="danger" onClick={() => void deleteSelected()}><Trash2 className="size-4" aria-hidden="true" />Delete</Button>
        </div>
      ) : null}

      <div className="mt-4">
        {isPending ? <ListSkeleton rows={5} /> : isError ? <EmptyState title="Could not load messages" /> : items.length === 0 ? (
          <EmptyState title={filter === "all" ? "No messages yet" : `No ${filter} messages`} hint="New messages from the contact form will show up here." />
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Checkbox aria-label="Select all on this page" checked={allChecked} onCheckedChange={(c) => { setSelected(c === true ? new Set(items.map((m) => m.id)) : new Set()); }} />
              <span>{data.total} message{data.total === 1 ? "" : "s"}</span>
            </div>
            <ul className="divide-y divide-line">
              {items.map((m) => (
                <li key={m.id} className={cn("flex items-center gap-3 px-4 py-3 hover:bg-line/40", !m.isRead && "bg-primary/5")}>
                  <Checkbox aria-label={`Select message from ${m.name}`} checked={selected.has(m.id)} onCheckedChange={() => { toggle(m.id); }} />
                  <button type="button" onClick={() => { openMessage(m); }} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", m.isRead ? "bg-transparent" : "bg-primary")} />
                    <span className="w-36 shrink-0 truncate text-sm font-semibold sm:w-48">
                      {m.name}
                      {!m.isRead ? <span className="sr-only"> (unread)</span> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm"><span className="font-medium">{m.subject}</span><span className="text-muted"> — {m.message}</span></span>
                    <time dateTime={m.createdAt} className="hidden shrink-0 text-xs text-muted md:block">{fmt(m.createdAt)}</time>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage((p) => p - 1); }}><ChevronLeft className="size-4" aria-hidden="true" />Previous</Button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage((p) => p + 1); }}>Next<ChevronRight className="size-4" aria-hidden="true" /></Button>
        </nav>
      ) : null}

      <Modal
        side
        open={open !== null}
        onOpenChange={(o) => { if (!o) setOpen(null); }}
        title={open?.subject ?? ""}
        description={open ? `From ${open.name} · ${fmt(open.createdAt)}` : undefined}
        footer={
          open ? (
            <>
              <Button variant="outline" onClick={() => { setRead.mutate({ id: open.id, isRead: false }); setOpen(null); }}><Mail className="size-4" aria-hidden="true" />Mark unread</Button>
              <Button variant="danger" onClick={() => void confirm({ title: "Delete this message?" }).then((ok) => { if (ok) { remove.mutate(open.id); setOpen(null); } })}><Trash2 className="size-4" aria-hidden="true" />Delete</Button>
              <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`} className={buttonClasses("primary")}><Reply className="size-4" aria-hidden="true" />Reply by email</a>
            </>
          ) : null
        }
      >
        {open ? (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm"><CheckCheck className="size-4 text-emerald-500" aria-hidden="true" /><a href={`mailto:${open.email}`} className="text-ink hover:underline">{open.email}</a></p>
            {open.ip ? <Badge>IP {open.ip}</Badge> : null}
            <p className="whitespace-pre-wrap leading-relaxed">{open.message}</p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

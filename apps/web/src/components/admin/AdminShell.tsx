"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  ExternalLink,
  FolderKanban,
  Gem,
  KeyRound,
  LayoutDashboard,
  Layers,
  LogOut,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Share2,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { adminFetch } from "@/lib/admin/client";
import { errorMessage } from "@/lib/admin/resources";
import { AdminProviders } from "./AdminProviders";

interface NavEntry {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: boolean;
}

const NAV: NavEntry[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/skills", label: "Skills", icon: Sparkles },
  { href: "/admin/journey", label: "Journey", icon: Briefcase },
  { href: "/admin/value-cards", label: "Value Cards", icon: Gem },
  { href: "/admin/socials", label: "Social Links", icon: Share2 },
  { href: "/admin/sections", label: "Sections", icon: Layers },
  { href: "/admin/messages", label: "Messages", icon: Mail, badge: true },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
  { href: "/admin/account", label: "Account", icon: KeyRound },
];

interface Stats {
  unreadMessages: number;
}

function Sidebar({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: () => adminFetch<Stats>("/admin/stats"),
    refetchInterval: 60_000,
  });
  const unread = data?.unreadMessages ?? 0;

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon, badge }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-primary/15 text-ink" : "text-muted hover:bg-line hover:text-fg",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
            {badge && unread > 0 ? (
              <span
                aria-label={`${unread} unread`}
                className={cn(
                  "bg-brand-gradient ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold text-on-primary",
                  collapsed && "absolute right-1 top-1 ml-0 size-4 min-w-4 px-0 text-[9px]",
                )}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("admin-collapsed") === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggle(): void {
    setCollapsed((c) => {
      try {
        localStorage.setItem("admin-collapsed", c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  }

  async function logout(): Promise<void> {
    try {
      await adminFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      toast.error(errorMessage(err));
    }
    qc.clear();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      <aside
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] lg:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-line px-4", collapsed && "justify-center px-0")}>
          <Link href="/admin" className="font-heading text-lg font-bold">
            {collapsed ? <span className="text-gradient">A</span> : <>Admin<span className="text-ink">.panel</span></>}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar collapsed={collapsed} />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => { setMobileOpen(false); }} />
          <aside aria-label="Sidebar" className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="font-heading text-lg font-bold">Admin<span className="text-ink">.panel</span></span>
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => { setMobileOpen(false); }}>
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar collapsed={false} onNavigate={() => { setMobileOpen(false); }} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className={cn("transition-[padding]", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => { setMobileOpen(true); }}>
              <Menu className="size-5" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggle}>
              {collapsed ? <PanelLeftOpen className="size-5" aria-hidden="true" /> : <PanelLeftClose className="size-5" aria-hidden="true" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:border-primary hover:text-ink">
              View site <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <ThemeToggle />
            <Button variant="outline" onClick={() => void logout()}>
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminProviders>
      <Frame>{children}</Frame>
    </AdminProviders>
  );
}

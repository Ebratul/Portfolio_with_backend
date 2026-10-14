"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Zap } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { SkillCategory, SkillLevel } from "@portfolio/shared";
import { cn } from "@/lib/cn";

export interface SkillCardData {
  id: string;
  name: string;
  level: SkillLevel;
  percentage: number;
  icon: ReactNode;
  watermark: ReactNode;
}
export interface SkillTab {
  key: SkillCategory;
  label: string;
  skills: SkillCardData[];
}

export function SkillsTabs({ tabs }: { tabs: SkillTab[] }) {
  const reduce = useReducedMotion();
  const uid = useId();
  const [active, setActive] = useState<SkillCategory>(tabs.find((t) => t.skills.length > 0)?.key ?? "LANGUAGES");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = tabs.find((t) => t.key === active);

  function onKeyDown(e: KeyboardEvent, index: number): void {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    if (next) {
      setActive(next.key);
      refs.current[next.key]?.focus();
    }
  }

  return (
    <div>
      <div className="mb-10 overflow-x-auto pb-2">
        <div
          role="tablist"
          aria-label="Skill categories"
          className="glass mx-auto flex w-max gap-1 rounded-full p-1.5"
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              ref={(el) => {
                refs.current[tab.key] = el;
              }}
              id={`${uid}-tab-${tab.key}`}
              role="tab"
              type="button"
              aria-selected={active === tab.key}
              aria-controls={`${uid}-panel`}
              tabIndex={active === tab.key ? 0 : -1}
              onClick={() => {
                setActive(tab.key);
              }}
              onKeyDown={(e) => {
                onKeyDown(e, i);
              }}
              className={cn(
                "relative whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition-colors",
                active === tab.key ? "text-on-primary" : "text-muted hover:text-fg",
              )}
            >
              {active === tab.key ? (
                <m.span
                  layoutId="skills-pill"
                  className="bg-brand-gradient absolute inset-0 rounded-full"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} tabIndex={0}>
        <AnimatePresence mode="wait">
          <m.ul
            key={active}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {current && current.skills.length > 0 ? (
              current.skills.map((s) => (
                <li
                  key={s.id}
                  className="card group relative aspect-square overflow-hidden p-4 transition duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-[0_10px_40px_var(--glow)]"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-4 -right-4 size-28 opacity-[0.07] transition group-hover:opacity-[0.14] sm:size-32"
                  >
                    {s.watermark}
                  </span>
                  <div className="relative flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-xl border border-line bg-bg">{s.icon}</span>
                    <div className="text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider",
                          s.level === "PRO" ? "bg-primary/15 text-ink" : "bg-line text-muted",
                        )}
                      >
                        {s.level === "PRO" ? <Zap className="size-3" aria-hidden="true" /> : null}
                        {s.level}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-muted">{s.percentage}%</p>
                    </div>
                  </div>
                  <h3 className="absolute bottom-4 left-4 right-4 font-heading text-sm font-bold uppercase tracking-wide sm:text-base">
                    {s.name}
                  </h3>
                </li>
              ))
            ) : (
              <li className="col-span-full py-12 text-center text-muted">Nothing here yet.</li>
            )}
          </m.ul>
        </AnimatePresence>
      </div>
    </div>
  );
}

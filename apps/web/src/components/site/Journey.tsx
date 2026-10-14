"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Award, Briefcase, Check, ExternalLink, GraduationCap, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { GroupedTimeline, SectionConfig, TimelineType } from "@portfolio/shared";
import { cn } from "@/lib/cn";
import { BLUR_DATA_URL, formatYears } from "@/lib/site";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

const TABS: { key: TimelineType; label: string; icon: typeof Briefcase }[] = [
  { key: "EXPERIENCE", label: "Experience", icon: Briefcase },
  { key: "EDUCATION", label: "Education", icon: GraduationCap },
  { key: "CERTIFICATE", label: "Certificates", icon: Award },
];

export function Journey({ section, timeline }: { section: SectionConfig; timeline: GroupedTimeline }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<TimelineType>(
    TABS.find((t) => timeline[t.key].length > 0)?.key ?? "EXPERIENCE",
  );
  const items = timeline[active];

  return (
    <section id="journey" aria-labelledby="journey-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div id="journey-title">
          <SectionHeader title={section.title} subtitle={section.subtitle} />
        </div>

        <div role="tablist" aria-label="Journey categories" className="glass mx-auto mb-14 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full p-1.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => {
                setActive(key);
              }}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                active === key ? "text-on-primary" : "text-muted hover:text-fg",
              )}
            >
              {active === key ? (
                <m.span
                  layoutId="journey-pill"
                  className="bg-brand-gradient absolute inset-0 rounded-full"
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon className="relative size-4" aria-hidden="true" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <m.div
            key={active}
            role="tabpanel"
            aria-label={TABS.find((t) => t.key === active)?.label}
            tabIndex={0}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <ol className="relative space-y-10 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-px before:bg-line md:before:left-1/2">
            {items.length === 0 ? (
              <li className="py-10 text-center text-muted">Nothing here yet.</li>
            ) : (
              items.map((item, i) => {
                const left = i % 2 === 0;
                return (
                  <li key={item.id} className="relative pl-14 md:grid md:grid-cols-2 md:gap-14 md:pl-0">
                    <span
                      aria-hidden="true"
                      className="bg-brand-gradient absolute left-5 top-6 grid size-8 -translate-x-1/2 place-items-center rounded-full text-on-primary ring-4 ring-bg md:left-1/2"
                    >
                      <Check className="size-4" />
                    </span>
                    <Reveal
                      y={20}
                      className={cn(
                        "card p-6 transition hover:border-primary/60 hover:shadow-[0_8px_30px_var(--glow)]",
                        left ? "md:col-start-1 md:text-right" : "md:col-start-2",
                      )}
                    >
                      <p className="text-xs font-bold tracking-widest text-ink">
                        {formatYears(item.startDate, item.endDate, item.type === "CERTIFICATE")}
                      </p>
                      <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
                      <p className="mt-1 font-semibold text-ink">{item.organization}</p>
                      {item.location ? (
                        <p className={cn("mt-1 flex items-center gap-1 text-sm text-muted", left && "md:justify-end")}>
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {item.location}
                        </p>
                      ) : null}
                      {item.imageUrl ? (
                        <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-xl border border-line">
                          <Image
                            src={item.imageUrl}
                            alt={`${item.title} certificate`}
                            fill
                            sizes="(min-width: 768px) 400px, 90vw"
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                      <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
                      {item.tags.length > 0 ? (
                        <ul className={cn("mt-4 flex flex-wrap gap-2", left && "md:justify-end")}>
                          {item.tags.map((t) => (
                            <li key={t} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-ink">
                              {t}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {item.credentialUrl ? (
                        <a
                          href={item.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline"
                        >
                          View Credential
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : null}
                    </Reveal>
                  </li>
                );
              })
            )}
            </ol>
          </m.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

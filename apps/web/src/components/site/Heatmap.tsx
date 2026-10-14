"use client";

import { useEffect, useRef, useState } from "react";
import type { GithubActivity } from "@portfolio/shared";
import { cn } from "@/lib/cn";

const LEVEL_CLASS = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CELL = 12; // px, including 3px gap

const formatDay = (date: string, count: number): string =>
  `${count} contribution${count === 1 ? "" : "s"} on ${new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })}`;

export function Heatmap({ activity }: { activity: GithubActivity }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);

  // Start scrolled to the most recent weeks on narrow screens.
  useEffect(() => {
    scroller.current?.scrollTo({ left: scroller.current.scrollWidth });
  }, []);

  const monthLabels = activity.weeks.map((w, i) => {
    const first = w.days[0];
    if (!first) return null;
    const month = new Date(`${first.date}T00:00:00Z`).getUTCMonth();
    const prev = activity.weeks[i - 1]?.days[0];
    const prevMonth = prev ? new Date(`${prev.date}T00:00:00Z`).getUTCMonth() : -1;
    return month !== prevMonth ? MONTHS[month] : null;
  });

  return (
    <div className="relative" data-heat-root>
      <div ref={scroller} className="overflow-x-auto pb-2">
        <div
          role="img"
          aria-label={`${activity.total} contributions in the last year on GitHub`}
          className="mx-auto w-max"
        >
          <div className="mb-1 flex gap-[3px] pl-0 text-[10px] text-muted" aria-hidden="true">
            {monthLabels.map((m, i) => (
              <span key={i} className="block shrink-0 overflow-visible whitespace-nowrap" style={{ width: CELL - 3 }}>
                {m}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]" onMouseLeave={() => { setTip(null); }}>
            {activity.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.days.map((d) => (
                  <span
                    key={d.date}
                    title={formatDay(d.date, d.count)}
                    onMouseEnter={(e) => {
                      const box = e.currentTarget.getBoundingClientRect();
                      const parent = e.currentTarget.closest("[data-heat-root]")?.getBoundingClientRect();
                      setTip({
                        text: formatDay(d.date, d.count),
                        x: box.left + box.width / 2 - (parent?.left ?? 0),
                        y: box.top - (parent?.top ?? 0),
                      });
                    }}
                    className={cn("block size-[9px] rounded-[2px]", LEVEL_CLASS[d.level])}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted" aria-hidden="true">
        Less
        {LEVEL_CLASS.map((c) => (
          <span key={c} className={cn("block size-[10px] rounded-[2px]", c)} />
        ))}
        More
      </div>
      {tip ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-fg px-2.5 py-1.5 text-xs font-medium text-bg shadow-lg"
          style={{ left: tip.x, top: tip.y - 6 }}
        >
          {tip.text}
        </div>
      ) : null}
    </div>
  );
}

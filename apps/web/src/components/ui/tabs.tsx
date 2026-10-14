"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn("inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold text-muted transition hover:text-fg data-[state=active]:bg-brand-gradient data-[state=active]:text-on-primary",
        className,
      )}
      {...props}
    />
  );
}

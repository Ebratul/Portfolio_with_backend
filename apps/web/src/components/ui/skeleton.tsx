import { cn } from "@/lib/cn";

export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={cn("skeleton", className)} />
);

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

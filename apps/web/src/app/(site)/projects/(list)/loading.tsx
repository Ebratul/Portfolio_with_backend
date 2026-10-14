import { Skeleton } from "@/components/ui/skeleton";

// Only the list route has a skeleton. /projects/[slug] must not: a Suspense boundary there would
// flush a 200 status before notFound() runs, so unknown slugs would not return a real 404.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-36 sm:px-6" aria-busy="true" aria-label="Loading projects">
      <Skeleton className="mx-auto mb-12 h-12 w-72" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-96" />
        ))}
      </div>
    </div>
  );
}

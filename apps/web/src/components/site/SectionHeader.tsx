import { Reveal } from "./Reveal";

/** `level` is 1 on standalone pages (which have no other h1) and 2 for homepage sections. */
export function SectionHeader({ title, subtitle, level = 2 }: { title: string; subtitle?: string | null; level?: 1 | 2 }) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <Heading className="text-3xl font-bold sm:text-4xl md:text-5xl">{title}</Heading>
      <div className="bg-brand-gradient mx-auto mt-4 h-1 w-20 rounded-full" aria-hidden="true" />
      {subtitle ? <p className="mt-4 text-muted">{subtitle}</p> : null}
    </Reveal>
  );
}

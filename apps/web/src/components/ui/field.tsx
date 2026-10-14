import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Label + control + hint + inline error, wired together for assistive tech. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {required ? <span className="text-red-500" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p id={`${htmlFor}-hint`} className="text-xs text-muted">{hint}</p> : null}
      <p id={`${htmlFor}-err`} role="alert" className={cn("text-xs text-red-500", !error && "hidden")}>
        {error}
      </p>
    </div>
  );
}

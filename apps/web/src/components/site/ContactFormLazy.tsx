"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// react-hook-form + zod are only needed once the visitor reaches the form, so they are split out
// of the initial bundle. The placeholder reserves the form's height to avoid layout shift.
const ContactForm = dynamic(() => import("./ContactForm").then((m) => m.ContactForm), {
  ssr: false,
  loading: () => <Skeleton className="card min-h-[36rem] w-full" />,
});

export function ContactFormLazy() {
  return <ContactForm />;
}

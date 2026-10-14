"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { contactInputSchema, type ApiResponse, type ContactInput } from "@portfolio/shared";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-fg placeholder:text-muted/70 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-red-500";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactInputSchema),
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  });

  async function onSubmit(values: ContactInput): Promise<void> {
    try {
      const res = await fetch("/api/v1/public/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!body.success) {
        toast.error(res.status === 429 ? "Too many messages. Please try again later." : body.error.message);
        return;
      }
      toast.success("Message sent! I'll get back to you soon.");
      reset();
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  const err = (name: keyof ContactInput): string | undefined => errors[name]?.message;

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="card space-y-5 p-6 sm:p-8">
      <h3 className="text-2xl font-bold">Send a Message</h3>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input id="c-name" autoComplete="name" placeholder="Your name" aria-invalid={!!errors.name} aria-describedby="c-name-err" className={field} {...register("name")} />
          <p id="c-name-err" role="alert" className="mt-1 min-h-4 text-xs text-red-500">{err("name")}</p>
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input id="c-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby="c-email-err" className={field} {...register("email")} />
          <p id="c-email-err" role="alert" className="mt-1 min-h-4 text-xs text-red-500">{err("email")}</p>
        </div>
      </div>

      <div>
        <label htmlFor="c-subject" className="mb-1.5 block text-sm font-medium">
          Subject
        </label>
        <input id="c-subject" placeholder="What's this about?" aria-invalid={!!errors.subject} aria-describedby="c-subject-err" className={field} {...register("subject")} />
        <p id="c-subject-err" role="alert" className="mt-1 min-h-4 text-xs text-red-500">{err("subject")}</p>
      </div>

      <div>
        <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea id="c-message" rows={5} placeholder="Tell me about your project…" aria-invalid={!!errors.message} aria-describedby="c-message-err" className={cn(field, "resize-y")} {...register("message")} />
        <p id="c-message-err" role="alert" className="mt-1 min-h-4 text-xs text-red-500">{err("message")}</p>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots fill it and are silently dropped. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
        {isSubmitting ? "Sending…" : "Send Message"}
      </button>
      <p className="text-center text-xs text-muted">Your details are only used to reply to this message and are never shared.</p>
    </form>
  );
}

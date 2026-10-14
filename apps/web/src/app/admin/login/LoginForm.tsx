"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@portfolio/shared";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AdminApiError, adminFetch } from "@/lib/admin/client";

/** Only same-site admin paths are allowed as a post-login target (prevents open redirects). */
const safeNext = (value: string | null): string => (value?.startsWith("/admin") && !value.startsWith("//") ? value : "/admin");

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: LoginInput): Promise<void> {
    setFormError(null);
    try {
      await adminFetch("/auth/login", { method: "POST", body: values });
      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 429) {
        setFormError("Too many failed attempts. Please wait 15 minutes before trying again.");
      } else if (err instanceof AdminApiError && err.status === 401) {
        setFormError("Invalid email or password.");
      } else {
        setFormError("Could not reach the server. Check your connection and try again.");
      }
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="card w-full max-w-sm space-y-5 p-8 shadow-xl">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">
          Admin<span className="text-ink">.panel</span>
        </h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage your portfolio</p>
      </div>

      {formError ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {formError}
        </p>
      ) : null}

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="username" aria-invalid={!!errors.email} aria-describedby="email-err" {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby="password-err" {...register("password")} />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

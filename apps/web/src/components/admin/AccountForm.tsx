"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { changePasswordSchema } from "@portfolio/shared";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AdminApiError, adminFetch } from "@/lib/admin/client";
import { errorMessage } from "@/lib/admin/resources";
import { PageHeader } from "./PageHeader";

// The API schema plus a confirmation field that never leaves the browser.
const formSchema = z
  .object({ currentPassword: z.string().min(1, "Current password is required"), newPassword: z.string(), confirm: z.string() })
  .superRefine((v, ctx) => {
    const r = changePasswordSchema.safeParse({ currentPassword: v.currentPassword, newPassword: v.newPassword });
    if (!r.success) for (const i of r.error.issues) ctx.addIssue({ code: "custom", path: i.path, message: i.message });
    if (v.confirm !== v.newPassword) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Passwords do not match" });
  });
type Values = z.infer<typeof formSchema>;

export function AccountForm() {
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });

  const change = useMutation({
    mutationFn: (v: Values) => adminFetch("/auth/password", { method: "PATCH", body: { currentPassword: v.currentPassword, newPassword: v.newPassword } }),
    onSuccess: () => { toast.success("Password changed"); reset(); },
    onError: (err) => {
      if (err instanceof AdminApiError && err.fieldErrors.currentPassword?.[0]) setError("currentPassword", { message: err.fieldErrors.currentPassword[0] });
      else toast.error(errorMessage(err));
    },
  });

  return (
    <>
      <PageHeader title="Account" description="Change the password you use to sign in." />
      <form onSubmit={(e) => void handleSubmit((v) => change.mutateAsync(v))(e)} noValidate className="card max-w-lg space-y-5 p-6">
        <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message} required>
          <Input id="currentPassword" type="password" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...register("currentPassword")} />
        </Field>
        <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message} hint="At least 10 characters with upper- and lowercase letters and a number." required>
          <Input id="newPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.newPassword} {...register("newPassword")} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message} required>
          <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register("confirm")} />
        </Field>
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
          Update password
        </Button>
      </form>
    </>
  );
}

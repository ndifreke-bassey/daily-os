"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email().trim().max(254),
  password: z.string().min(8).max(128),
});

function redirectWith(key: "error" | "message", value: string): never {
  redirect(`/login?${key}=${encodeURIComponent(value)}`);
}

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirectWith("error", "invalid");

  const supabase = await createClient();
  if (!supabase) redirectWith("error", "Supabase is not configured yet.");

  const result = await supabase.auth.signInWithPassword(parsed.data).catch(() => null);
  if (!result) redirectWith("error", "connection");
  if (result.error) redirectWith("error", "signin");

  redirect("/");
}

export async function signUp(formData: FormData) {
  const parsed = credentialsSchema.extend({
    displayName: z.string().trim().min(1).max(80),
  }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) redirectWith("error", "invalid-signup");

  const supabase = await createClient();
  if (!supabase) redirectWith("error", "Supabase is not configured yet.");

  const result = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  }).catch(() => null);

  if (!result) redirectWith("error", "connection");
  if (result.error) redirectWith("error", "signup");
  if (result.data.session) redirect("/");

  redirectWith("message", "check-email");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut().catch(() => undefined);
  redirect("/login");
}
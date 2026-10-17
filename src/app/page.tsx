import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DayOSDashboard } from "@/components/dayos-dashboard";
import { SetupNotice } from "@/components/setup-notice";
import type { UserPreferences } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export default function Home() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AuthenticatedDashboard />
    </Suspense>
  );
}

async function AuthenticatedDashboard() {
  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const authResult = await supabase.auth.getClaims().catch(() => null);
  const claims = authResult?.data?.claims;
  const userId = claims?.sub;
  if (!authResult) redirect("/login?error=connection");
  if (authResult.error) {
    if (authResult.error.name === "AuthSessionMissingError") redirect("/login");
    redirect("/login?error=connection");
  }
  if (!claims || typeof userId !== "string") redirect("/login");

  const [tasksResult, categoriesResult, notesResult, preferencesResult] = await Promise.all([
    safeQuery(supabase.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false })),
    safeQuery(supabase.from("categories").select("*").order("name", { ascending: true })),
    safeQuery(supabase.from("notes").select("*").order("updated_at", { ascending: false })),
    safeQuery(supabase.from("user_preferences").select("*").maybeSingle()),
  ]);

  const dataError = [
    tasksResult.error,
    categoriesResult.error,
    notesResult.error,
    preferencesResult.error,
  ].some(Boolean)
    ? "DayOS could not load all saved data. Confirm the database migration is applied and try refreshing."
    : "";

  const preferences: UserPreferences = preferencesResult.data ?? {
    user_id: userId,
    compact_tasks: false,
    date_format: "long",
    updated_at: "",
  };
  const email = typeof claims.email === "string" ? claims.email : "Personal workspace";

  return (
    <DayOSDashboard
      email={email}
      tasks={tasksResult.data ?? []}
      categories={categoriesResult.data ?? []}
      notes={notesResult.data ?? []}
      preferences={preferences}
      dataError={dataError}
    />
  );
}

async function safeQuery<TData, TError>(
  query: PromiseLike<{ data: TData; error: TError }>
): Promise<{ data: TData; error: TError } | { data: null; error: true }> {
  try {
    return await query;
  } catch {
    return { data: null, error: true };
  }
}

function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <p className="text-sm text-[#AAA]" role="status">Loading your workspace...</p>
    </main>
  );
}
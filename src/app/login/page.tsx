import { Activity } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { SetupNotice } from "@/components/setup-notice";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const authResult = await supabase.auth.getClaims().catch(() => null);
  if (authResult?.data?.claims?.sub) redirect("/");

  const params = await searchParams;
  const errorMessages: Record<string, string> = {
    signup: "We could not create your account. Check the details or try signing in.",
    signin: "Sign-in failed. Check your details and try again.",
    invalid: "Enter a valid email and password of at least 8 characters.",
    "invalid-signup": "Enter a name, valid email, and password of at least 8 characters.",
    connection: "Authentication is temporarily unavailable. Please try again.",
  };
  const error = authResult ? errorMessages[params.error ?? ""] : errorMessages.connection;
  const message = params.message === "check-email"
    ? "Check your email to confirm your account, then sign in."
    : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-12">
      <Link href="/" className="flex items-center gap-3" aria-label="DayOS home">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37] text-black"><Activity size={23} /></span>
        <span>
          <span className="block font-[Manrope] text-xl font-extrabold">DayOS</span>
          <span className="block text-[10px] tracking-[0.2em] text-[#D4AF37]">YOUR DAY. YOUR DIRECTION.</span>
        </span>
      </Link>
      <LoginForm error={error} message={message} />
    </main>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <p className="text-sm text-[#AAA]" role="status">Loading secure sign-in...</p>
    </main>
  );
}
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { signIn, signUp } from "@/app/actions/auth";

function SubmitButton({ signup }: { signup: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button className="gold-button flex w-full items-center justify-center gap-2 px-5 py-3 text-sm" disabled={pending}>
      {pending ? "Please wait..." : signup ? "Create account" : "Sign in"}
      {!pending && <ArrowRight size={16} />}
    </button>
  );
}

export function LoginForm({ error, message }: { error?: string; message?: string }) {
  const [signup, setSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className="premium-card w-full max-w-md p-6 sm:p-8">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">{signup ? "Start your workspace" : "Welcome back"}</p>
        <h2 className="mt-2 font-[Manrope] text-2xl font-bold">{signup ? "Create your account" : "Sign in to DayOS"}</h2>
      </div>

      {error && <p className="mb-5 rounded-lg border border-[#75453A] bg-[#251612] px-3 py-2 text-sm text-[#F0B5A5]" role="alert">{error}</p>}
      {message && <p className="mb-5 rounded-lg border border-[#495C42] bg-[#151D13] px-3 py-2 text-sm text-[#B8D5A9]" role="status">{message}</p>}

      <form action={signup ? signUp : signIn} className="space-y-4">
        {signup && (
          <label className="block text-sm text-[#C7C3B9]">
            Name
            <input name="displayName" autoComplete="name" required maxLength={80} className="form-input mt-2" />
          </label>
        )}
        <label className="block text-sm text-[#C7C3B9]">
          Email
          <input name="email" type="email" autoComplete="email" required maxLength={254} className="form-input mt-2" />
        </label>
        <label className="block text-sm text-[#C7C3B9]">
          Password
          <span className="relative mt-2 block">
            <input name="password" type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} required minLength={8} maxLength={128} className="form-input pr-12" />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 flex items-center px-3 text-[#888]" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
          {signup && <span className="mt-1 block text-xs text-[#777]">Use at least 8 characters.</span>}
        </label>
        <SubmitButton signup={signup} />
      </form>

      <p className="mt-6 text-center text-sm text-[#888]">
        {signup ? "Already have an account?" : "New to DayOS?"}{" "}
        <button type="button" className="font-semibold text-[#E8D58A] hover:text-white" onClick={() => setSignup((current) => !current)}>
          {signup ? "Sign in" : "Create an account"}
        </button>
      </p>
    </section>
  );
}
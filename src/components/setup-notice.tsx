import { Activity, ExternalLink } from "lucide-react";

export function SetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="premium-card w-full max-w-xl p-7 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37] text-black">
            <Activity size={23} />
          </span>
          <div>
            <h1 className="font-[Manrope] text-xl font-extrabold">DayOS</h1>
            <p className="text-xs text-[#D4AF37]">Secure setup required</p>
          </div>
        </div>
        <h2 className="font-[Manrope] text-2xl font-bold">Connect your Supabase project</h2>
        <p className="mt-3 text-sm leading-6 text-[#AAA]">
          DayOS does not use demo data. Add your project URL and publishable key to
          <code className="mx-1 text-[#E8D58A]">.env.local</code>, then apply the database migration.
        </p>
        <ol className="mt-6 space-y-3 text-sm text-[#C7C3B9]">
          <li><span className="mr-2 text-[#D4AF37]">01</span>Copy <code>.env.example</code> to <code>.env.local</code>.</li>
          <li><span className="mr-2 text-[#D4AF37]">02</span>Set the Supabase URL and publishable key.</li>
          <li><span className="mr-2 text-[#D4AF37]">03</span>Apply the SQL migration in <code>supabase/migrations</code>.</li>
        </ol>
        <a
          className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#E8D58A] hover:text-white"
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
        >
          Open Supabase dashboard <ExternalLink size={15} />
        </a>
      </section>
    </main>
  );
}
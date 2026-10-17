# DayOS

DayOS is a personal productivity dashboard built with Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Auth, and PostgreSQL. Private tasks, categories, notes, and preferences are stored per authenticated account. Without Supabase configuration, the app shows setup instructions and does not present demo data as saved data.

## Prerequisites

- Node.js 20.9 or later
- npm
- A Supabase project

## Install and run

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Add the Supabase values below to `.env.local`, then restart the dev server after changing environment variables.

Useful commands:

```powershell
npm run lint
npx tsc --noEmit
npm run build
npm start
```

## Supabase setup

1. Create a Supabase project and open **Project Settings → API** (or the project Connect dialog).
2. Copy the project URL and **publishable** key into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

3. Open **SQL Editor** in the Supabase dashboard and run `supabase/migrations/20261017000000_initial_schema.sql`. This creates profiles, default categories and preferences for new accounts, tasks, notes, indexes, constraints, triggers, and explicit row-level security policies.
4. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` for local development. Add `http://localhost:3000/**` to Redirect URLs. For deployment, set the production Site URL and add production and preview URLs you use.
5. In **Authentication → Providers → Email**, configure whether email confirmation is required. When enabled, new users must confirm their address before signing in.

The dashboard uses the signed-in user's cookie-backed Supabase client. Each server action verifies claims and scopes mutations by user ID; PostgreSQL RLS independently restricts access to owned rows. Never add a service-role key to this app. The publishable key is intended for client-facing applications and does not bypass RLS.

`.env.local` is ignored by Git. `.env.example` contains placeholders only. If configuration is missing, the app shows setup guidance instead of crashing.

## Database changes

The initial migration is for a new project and does not delete existing data. Review future migrations before applying them. The SQL can be run through the Supabase SQL Editor; no Supabase CLI is required.

## Features

- Email/password sign-up, sign-in, and sign-out with cookie-backed session refresh
- User-owned tasks with descriptions, due dates, priority, categories, completion, editing, and confirmed deletion
- Task search, status/priority/due-date filters, and due/priority/creation sorting
- Dashboard counts and overdue/upcoming indicators derived from stored tasks
- Date-grouped task agenda
- Private notes with create, edit, and confirmed delete
- Persisted compact-task and date-format preferences
- Responsive sidebar, mobile navigation, submission feedback, and empty/error states

## Deploy on Netlify

Netlify's maintained OpenNext adapter supports this project's Next.js App Router, Server Actions, streaming, and Cache Components without a pinned plugin or extra `netlify.toml` configuration.

1. Push the repository to GitHub and import it in Netlify using **Add new site → Import an existing project**.
2. Keep the detected Next.js framework and default build settings.
3. In Netlify's site environment variables, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the production and deploy-preview contexts you use. Do not upload `.env.local`.
4. Apply the SQL migration to Supabase if it has not already been applied.
5. Set Supabase Auth's Site URL to the production Netlify URL and add it to Redirect URLs. Add the relevant deploy-preview URL patterns if users should authenticate on previews.
6. Deploy, then verify sign-up, email confirmation if enabled, sign-in, task ownership, and sign-out with the configured project.

Netlify deploy previews use distinct URLs. Configure the required preview redirect patterns in Supabase before expecting email confirmation or OAuth redirects to work from previews.

Never expose secret or service-role credentials in `NEXT_PUBLIC_*` variables. External authentication and database flows are not verified until connected to a real Supabase project.
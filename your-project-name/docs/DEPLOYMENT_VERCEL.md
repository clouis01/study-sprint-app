# Deploying to Vercel (Sprint creation checklist)

Sprint creation can fail on Vercel if the Supabase project or auth isn't set up for the deployed URL. Use this checklist.

## 1. Environment variables

In **Vercel** → Project → **Settings** → **Environment Variables**, set (for **Production** and **Preview** if you use preview deploys):

- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key  

**Redeploy** after adding or changing these so the client bundle picks them up.

## 2. Same Supabase project

Use the **same** Supabase project for Vercel as you do locally (same URL in env). If you use a separate "production" Supabase project, run the migration there too (step 3).

## 3. Run the migration on that project

If you see errors like **"table 'public.sprints' does not exist"** or **"Could not find the table 'public.sprints' in the schema cache"**:

- Open **Supabase Dashboard** → the project that matches `NEXT_PUBLIC_SUPABASE_URL` → **SQL Editor**.
- Paste and run the contents of **`supabase/apply-sprints-migration.sql`** (it's idempotent).
- The script ends with `NOTIFY pgrst, 'reload schema';` so the API sees the new tables.

## 4. Supabase Auth URL configuration

In Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: your deployed app URL (e.g. `https://your-app.vercel.app`).
- **Redirect URLs**: add:
  - `https://your-app.vercel.app/**`
  - `https://your-app.vercel.app/auth/confirm`
  - (and your custom domain if you use one)

This allows sign-in and email confirmation to work on the deployed site and sets cookies for that domain.

## 5. Log in on the deployed site

Create a sprint only **after** logging in on the **deployed** URL. If you only ever logged in on localhost, the session is for localhost; the deployed site needs its own session — **log in again on the Vercel URL**.

## Quick check

Open:

`https://your-app.vercel.app/api/debug-supabase-sprints`

- It returns `ok: true` and `projectRef` if env vars are set and the `sprints` table is visible.
- If you see **"Permission denied"** or RLS errors when starting a sprint, fix auth (steps 4 and 5).

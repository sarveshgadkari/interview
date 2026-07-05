# Panel

Internal interview management tool for a training institute — mock/final interview scheduling, a type-tagged question bank, scoring, verdicts, and manager reporting with PDF export.

## Stack

React + Vite + TypeScript, Tailwind CSS, Supabase (Postgres, Auth, JS client), React Router, react-hook-form, jsPDF.

## Setup

1. `npm install`
2. Create a Supabase project, then run the SQL in `supabase/migrations/0001_init.sql` in the Supabase SQL editor (or via the CLI).
3. Copy `.env.example` to `.env` and fill in your project's `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Create user accounts in Supabase Auth (dashboard → Authentication → Users). A `profiles` row is auto-created for each new user via a trigger, defaulting to `role = 'admin_interviewer'`. Update `role` to `'manager'` for manager accounts directly in the `profiles` table.
5. `npm run dev`

## Deployment

Deploy-ready for Vercel or Netlify. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in your hosting provider, build command `npm run build`, output directory `dist`.

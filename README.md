# PoriKolpona, Dynamic Supabase Edition

This package uses the latest uploaded PoriKolpona tracker files as its base and preserves the existing chapter, lecture, deadline, search, focus timer, profile, theme and backup workflows. It adds Supabase authentication/cloud sync, Professor Panda, Detailed Progress, print reports, a Developer page and an admin account panel.

## Before deploying

1. Keep an export of any existing PoriKolpona data (`Settings → Your data → Export backup`).
2. In Supabase Dashboard → SQL Editor, run `supabase/schema.sql`. If you already ran the earlier PoriKolpona schema, this updated script adds the chapter status column safely with `ADD COLUMN IF NOT EXISTS`.
3. In `config.js`, replace the project URL and public publishable/anon key. Never place the `service_role` key in the frontend.
4. Add your developer portrait as `assets/developer.jpg` if you want it displayed on the Developer page. The page has a fallback if the file is absent.

## Deploy Supabase Edge Functions

Install Supabase CLI, log in, link your project, and set the server secrets:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Deploy the functions:

```bash
supabase functions deploy bootstrap-admin
supabase functions deploy admin-create-user
supabase functions deploy admin-list-users
supabase functions deploy admin-manage-user
```

Create the first admin once, using the bootstrap function and a strong one-time `BOOTSTRAP_SECRET`. Follow the existing bootstrap function's request format in `supabase/functions/bootstrap-admin/index.ts`. Remove the bootstrap secret after the first admin is created. Do not send the service-role key or database password to anyone.

The first admin Login ID can be `wadi`, but choose a unique strong password, not the temporary password used in earlier setup examples. Student accounts are created from Admin Panel and require passwords of at least 12 characters. Public registration is disabled.

## Deploy the website to Netlify

1. Upload the complete contents of this folder to a Git repository, or drag the folder into Netlify Drop.
2. Netlify publishes the project root (`netlify.toml`). Keep `assets/`, `config.js`, `index.html`, `script.js` and `style.css` together.
3. Open the deployed URL and sign in with the admin account.
4. Test student creation, sign out, and student login in a private browser window.

## Added features

- Detailed Progress page with Ongoing / Unfinished, Untouched, Need Revision and Completed groups.
- Chapter status selector. Marking a chapter Completed also marks its four lecture tasks complete. A chapter can be moved to Need Revision without erasing its task history. Chapter completion percentage on Detailed Progress follows these chapter statuses.
- Clearly visible print controls for unfinished, untouched and all chapter reports.
- Developer page with futuristic styling, cursor-following decorative birds, and optional `assets/developer.jpg` portrait.
- Professor Panda animated companion, study tips, progress updates, celebration and hidden nickname setting in Settings → Appearance (small star).
- Admin Panel for creating student accounts, listing accounts, activating/deactivating, resetting student passwords and deleting student accounts.
- Existing browser backup is retained and can be imported to a cloud account on first login when that account has no chapters.

## Data and security

- Supabase Auth handles passwords and sessions. Login IDs are mapped to internal non-mailbox aliases ending in `@login.porikolpona.app`.
- Only the Project URL and publishable/anon key are used in the browser.
- The service-role key is only used by Edge Functions.
- Row Level Security restricts student data to its owner. Admin-only account actions are checked in Edge Functions using the authenticated user and the server-side `profiles` role.
- Student accounts cannot self-register. Students cannot edit their own role, active state or Login ID.
- Cloud saves are debounced. Browser local storage remains as a local safety copy, but Supabase is the cross-device source of truth.

## Important checks before inviting students

- Run the SQL schema and deploy all four Edge Functions.
- Bootstrap the administrator and remove `BOOTSTRAP_SECRET`.
- Configure `config.js` with the correct Supabase project values.
- Verify RLS and test with a separate student account. Confirm that student A cannot read student B's rows.
- Test account deactivation, password reset, account deletion and cloud sync from two devices before inviting students broadly.

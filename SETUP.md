# BLACKSITE v1.0.0

Private two-member cyber-themed workspace: secure sign-in, safe browser terminal simulator, and private case files.

## Before you start

- This is a static GitHub Pages frontend connected to Supabase.
- GitHub Pages does not provide a private backend; database access is protected by Supabase Auth + Row Level Security (RLS).
- Supabase publishable/anon key is designed for browser use when RLS is configured. **Never place a `service_role` or secret key in `app.js`.**
- Do not run the SQL against an existing project until you confirm it is the intended project and review the schema. The script creates new tables and policies but does not drop tables.
- This starter does not create users, change billing, enable paid features, or deploy anything.

## 1. Create or choose a Supabase project

Use an existing project only if you have confirmed it is the intended BLACKSITE project; otherwise create a separate project only after checking the free-project quota and asking before any paid action.

The Supabase Free plan is listed at $0/month, with quotas and inactivity pausing. Current limits can change; check the official pricing page before relying on them:
https://supabase.com/pricing

## 2. Create exactly two user accounts

In Supabase Dashboard → Authentication → Users, create the two accounts manually and assign strong, unique passwords. Keep public sign-up disabled. Do not use the same password for both members.

Copy each account's UUID from the Auth users list.

## 3. Apply the database schema

Review `supabase-schema.sql`, then run it in the SQL Editor of the confirmed project. Replace the UUID placeholders in the commented `insert into public.members` example and run that statement to allowlist only the two accounts. The allowlist is the authorization boundary: being authenticated alone is not sufficient to read case files.

If you add or change policies later, test as each member and as a non-member before publishing.

## 4. Configure the frontend

Open `app.js` and replace:
- `https://YOUR-PROJECT-REF.supabase.co` with the project's API URL.
- `YOUR_SUPABASE_PUBLISHABLE_KEY` with the project's publishable key (or legacy anon key if that is what the dashboard provides).

Never use a secret key or `service_role` key in this file. The URL and publishable key are public configuration; RLS is what protects data.

## 5. Publish on GitHub Pages

Upload `index.html`, `style.css`, `app.js`, and `supabase-schema.sql` to a new repository. In GitHub repository Settings → Pages, choose deployment from the `main` branch and root directory (or configure the appropriate workflow). GitHub Pages serves static assets; Supabase handles authentication and data.

For project sites, the URL format is `https://OWNER.github.io/REPOSITORY/`. Verify the actual URL in Settings → Pages after deployment.

## 6. Verification checklist

- [ ] Correct Supabase project selected; no paid upgrade or add-on enabled.
- [ ] Only two Auth users are allowlisted in `public.members`.
- [ ] `members`, `case_files`, and `audit_logs` have RLS enabled.
- [ ] A member can sign in and read case files.
- [ ] A third/non-member account cannot read case files, even if authenticated.
- [ ] No service-role or secret key appears in browser files or Git history.
- [ ] Mobile layout works.
- [ ] GitHub Pages URL loads over HTTPS.

## Terminal commands

`help`, `status`, `profile`, `files`, `missions`, `clear`, `logout`

The terminal is intentionally a browser simulator and does not run arbitrary shell commands or connect to external machines.
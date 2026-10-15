# BLACKSITE

**Version:** 1.0.0  
**Purpose:** private two-member cyber terminal and case-file workspace.

## Included
- Dark neon terminal-inspired responsive UI
- Supabase email/password sign-in
- Browser-only safe command simulator
- Private case-file listing protected by Row Level Security
- Database schema starter and deployment instructions

## Setup
Read [SETUP.md](./SETUP.md) before configuring Supabase or publishing.

**Security note:** the frontend must use only a Supabase publishable/anon key. Never expose a service-role or secret key. The application is not secure until the two intended accounts are allowlisted and RLS is tested.
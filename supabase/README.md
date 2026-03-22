# Supabase Setup

1. Create a new Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Run the SQL in [`schema.sql`](/d:/Workspace/hrm-system-codex/supabase/schema.sql) inside the Supabase SQL editor.
5. In Supabase Auth, create at least one email/password user.
6. Update that user's row in `public.profiles` if you want `role = 'manager'` or `role = 'admin'`.
7. Create a public Storage bucket named `attendance-selfies` for selfie uploads.
8. Optionally run [`seed.sql`](/d:/Workspace/hrm-system-codex/supabase/seed.sql) after updating the demo emails inside it.

Next implementation step:
- run the demo data seed
- build leave and overtime flows

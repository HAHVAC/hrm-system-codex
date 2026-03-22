# Demo Runbook

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Run [`supabase/schema.sql`](/d:/Workspace/hrm-system-codex/supabase/schema.sql) in Supabase SQL Editor.
4. Create a public bucket named `attendance-selfies`.
5. Create 3 users in Supabase Auth:
   - `worker@fieldops.vn`
   - `manager@fieldops.vn`
   - `admin@fieldops.vn`
6. In `public.profiles`, set:
   - worker -> `employee`
   - manager -> `manager`
   - admin -> `admin`
7. Update emails inside [`supabase/seed.sql`](/d:/Workspace/hrm-system-codex/supabase/seed.sql) if you used different accounts.
8. Run [`supabase/seed.sql`](/d:/Workspace/hrm-system-codex/supabase/seed.sql).

## Demo Flow

1. Sign in as `worker@fieldops.vn`.
2. Go to [`/today`](/d:/Workspace/hrm-system-codex/app/today/page.tsx) and perform check-in.
3. Go to [`/history`](/d:/Workspace/hrm-system-codex/app/history/page.tsx) to verify the record.
4. Create one leave request in [`/leave`](/d:/Workspace/hrm-system-codex/app/leave/page.tsx).
5. Create one overtime request in [`/overtime`](/d:/Workspace/hrm-system-codex/app/overtime/page.tsx).
6. Create one correction request in [`/corrections`](/d:/Workspace/hrm-system-codex/app/corrections/page.tsx).
7. Sign in as `manager@fieldops.vn`.
8. Review pending requests in:
   - [`/leave-approvals`](/d:/Workspace/hrm-system-codex/app/leave-approvals/page.tsx)
   - [`/overtime-approvals`](/d:/Workspace/hrm-system-codex/app/overtime-approvals/page.tsx)
   - [`/correction-approvals`](/d:/Workspace/hrm-system-codex/app/correction-approvals/page.tsx)
9. Sign in as `admin@fieldops.vn`.
10. Open [`/admin`](/d:/Workspace/hrm-system-codex/app/admin/page.tsx) and:
   - create a worksite
   - change user roles
   - assign employees to worksites
11. Open [`/dashboard`](/d:/Workspace/hrm-system-codex/app/dashboard/page.tsx) to show live counts.

## Notes

- `/dashboard` now uses live Supabase data instead of mock values.
- The worker flow depends on `employee_worksites` existing.
- The attendance flow depends on the `attendance-selfies` bucket existing.
- Manager/admin approval screens require role changes in `public.profiles`.

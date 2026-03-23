# Merge And Smoke Checklist

## Before Merge

1. Confirm CI is green on PR (`bun run check`).
2. Confirm Supabase target project is ready:
   - `supabase/schema.sql` applied
   - bucket `attendance-selfies` exists (public)
   - admin/manager/worker users exist
   - `public.profiles.role` is set correctly
   - optional: `supabase/seed.sql` applied
3. Confirm Vercel env vars are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Merge

1. Merge PR to `main`.
2. Wait for Vercel production deploy to finish.
3. Open deployed URL and `/demo`.

## Smoke Test (Production)

1. Login as worker and open `/today`.
2. Do one check-in with GPS + selfie.
3. Open `/history` and verify new attendance row.
4. Create one leave request in `/leave`.
5. Create one overtime request in `/overtime`.
6. Create one correction request in `/corrections`.
7. Login as manager:
   - approve/reject in `/leave-approvals`
   - approve/reject in `/overtime-approvals`
   - approve/reject in `/correction-approvals`
8. Login as admin and verify `/admin` works.
9. Open `/dashboard` and confirm counters match actions above.

## Rollback Trigger

Rollback or hotfix immediately if any of these happens:
- Worker cannot check in due to bucket/upload failures
- Manager approval actions fail with permission errors
- Dashboard counters do not reflect recent transactions
- Login/session fails for valid users

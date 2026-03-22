# Deploy Checklist

## Recommended stack

- Frontend hosting: Vercel
- Backend/Auth/DB/Storage: Supabase

## Before deploy

1. Confirm `bun run lint` passes.
2. Confirm `bun run build` passes.
3. Make sure `supabase/schema.sql` has been applied to the target Supabase project.
4. Create the public storage bucket `attendance-selfies`.
5. Create at least one admin user in Supabase Auth.
6. In `public.profiles`, set that admin user's role to `admin`.
7. Create initial worksites and assignments manually or run `supabase/seed.sql`.

## Vercel environment variables

Set these in the Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use [`.env.production.example`](/d:/Workspace/hrm-system-codex/.env.production.example) as the template.

## Vercel deploy steps

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Keep the default Next.js framework detection.
4. Add the production environment variables.
5. Trigger the first deployment.
6. Open the deployed URL and visit `/demo`.

## Post-deploy smoke test

1. Sign in as worker and open `/today`.
2. Verify GPS + selfie attendance submission works.
3. Open `/history` and confirm the attendance record is visible.
4. Create one leave request in `/leave`.
5. Create one overtime request in `/overtime`.
6. Create one correction request in `/corrections`.
7. Sign in as manager and approve each request.
8. Sign in as admin and verify `/admin` works.
9. Open `/dashboard` and confirm live counts reflect real data.

## Production notes

- Attendance uploads depend on the `attendance-selfies` bucket existing.
- Employee flows depend on `employee_worksites` assignments existing.
- Admin-only actions depend on `public.profiles.role = 'admin'`.
- Manager approval screens depend on `public.profiles.role = 'manager'` or `admin`.

## Nice-to-have next

- Add stricter server-side validation for request overlap and duplicate approvals.
- Add loading states and success toasts for forms.
- Add audit detail pages for attendance exceptions.
- Add separate staging and production Supabase projects.

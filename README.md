# FieldOps HRM

Mobile-first construction attendance app built with Next.js and Supabase.

## Included in this repo

- GPS + selfie attendance
- Attendance history
- Leave requests + approvals
- Overtime requests + approvals
- Correction requests + approvals
- Admin screens for worksites, roles, and assignments
- Live dashboard powered by Supabase data

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Run [`supabase/schema.sql`](/d:/Workspace/hrm-system-codex/supabase/schema.sql) in Supabase SQL Editor.
4. Create a public bucket named `attendance-selfies`.
5. Create demo users in Supabase Auth.
6. Optionally run [`supabase/seed.sql`](/d:/Workspace/hrm-system-codex/supabase/seed.sql).

## Commands

```bash
bun install
bun run dev
bun run lint
bun run build
bun run check
```

## Demo

- In-app checklist: [`/demo`](/d:/Workspace/hrm-system-codex/app/demo/page.tsx)
- Runbook: [`docs/demo-runbook.md`](/d:/Workspace/hrm-system-codex/docs/demo-runbook.md)
- Product/engineering plan: [`docs/attendance-app-plan.md`](/d:/Workspace/hrm-system-codex/docs/attendance-app-plan.md)

## Deployment

Use Vercel for the Next.js app and Supabase for backend services.

- Deployment checklist: [`docs/deploy-checklist.md`](/d:/Workspace/hrm-system-codex/docs/deploy-checklist.md)
- Production env template: [`.env.production.example`](/d:/Workspace/hrm-system-codex/.env.production.example)

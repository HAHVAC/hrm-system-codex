# Runbook Deploy Chi Tiet (Supabase + Vercel)

Cap nhat: 2026-03-23  
Muc tieu: Dua `HAHVAC/hrm-system-codex` len production va xac nhan app chay on.

## 1. Chuan bi truoc khi thao tac

1. Mo san 3 tab:
   - GitHub repo: `https://github.com/HAHVAC/hrm-system-codex`
   - Supabase Dashboard: `https://supabase.com/dashboard`
   - Vercel Dashboard: `https://vercel.com/dashboard`
2. Xac nhan branch `main` da co commit moi nhat `cd9fdfb`.
3. Xac nhan CI xanh tren GitHub Actions.

## 2. Setup Supabase (click-by-click)

### 2.1 Tao project (neu chua co)

1. Vao Supabase Dashboard -> `New project`.
2. Chon organization.
3. Nhap:
   - `Name`: `fieldops-hrm-prod` (goi y)
   - `Database Password`: dat mat khau manh
   - `Region`: gan nguoi dung nhat
4. Bam `Create new project`.
5. Cho project provision xong.

### 2.2 Lay env public key cho app

1. Trong project -> `Project Settings` -> `API`.
2. Copy 2 gia tri:
   - `Project URL` -> dung cho `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key -> dung cho `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Tam luu vao notepad an toan.

### 2.3 Apply schema SQL

1. Vao `SQL Editor` -> `New query`.
2. Mo file local [schema.sql](d:\OneDrive\WORKSPACE\hrm-system\hrm-system-codex\supabase\schema.sql).
3. Copy toan bo noi dung vao SQL Editor.
4. Bam `Run`.
5. Ky vong: query chay thanh cong, khong loi syntax.

### 2.4 Tao storage bucket selfie

1. Vao `Storage` -> `Buckets`.
2. Bam `Create bucket`.
3. Nhap:
   - `Name`: `attendance-selfies`
   - `Public bucket`: bat `ON`
4. Bam `Create bucket`.

### 2.5 Tao user demo va role

1. Vao `Authentication` -> `Users` -> `Add user`.
2. Tao 3 user:
   - `worker@fieldops.vn`
   - `manager@fieldops.vn`
   - `admin@fieldops.vn`
3. Dat password de dang test (sau do doi lai neu can).
4. Vao `SQL Editor` -> `New query`, chay:

```sql
update public.profiles set role = 'employee' where email = 'worker@fieldops.vn';
update public.profiles set role = 'manager' where email = 'manager@fieldops.vn';
update public.profiles set role = 'admin' where email = 'admin@fieldops.vn';
```

5. Kiem tra nhanh:

```sql
select email, role from public.profiles
where email in ('worker@fieldops.vn', 'manager@fieldops.vn', 'admin@fieldops.vn');
```

### 2.6 Seed du lieu ban dau

1. Vao `SQL Editor` -> `New query`.
2. Mo file [seed.sql](d:\OneDrive\WORKSPACE\hrm-system\hrm-system-codex\supabase\seed.sql).
3. Neu email demo khac 3 email tren, sua email trong script truoc khi run.
4. Paste script va bam `Run`.

## 3. Setup Vercel (click-by-click)

### 3.1 Import GitHub repo

1. Vao Vercel Dashboard -> `Add New...` -> `Project`.
2. Chon repo `HAHVAC/hrm-system-codex`.
3. Framework se auto-detect `Next.js`.
4. Khong can sua Build Command neu Vercel da nhan dien mac dinh.

### 3.2 Them environment variables

1. Trong trang tao project -> `Environment Variables`.
2. Them:
   - `NEXT_PUBLIC_SUPABASE_URL` = gia tri Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = gia tri anon public key
3. Scope: ap dung it nhat cho `Production` (co the them `Preview`).
4. Bam `Deploy`.

### 3.3 Xac nhan deploy thanh cong

1. Cho build xong.
2. Bam vao production URL.
3. Mo `.../demo` de xem checklist in-app.

## 4. Smoke test production

Lam theo file [merge-and-smoke-checklist.md](d:\OneDrive\WORKSPACE\hrm-system\hrm-system-codex\docs\merge-and-smoke-checklist.md):

1. Dang nhap worker -> `/today` -> check-in GPS + selfie.
2. Vao `/history` xac nhan co dong cham cong moi.
3. Tao 3 request: `/leave`, `/overtime`, `/corrections`.
4. Dang nhap manager -> duyet 3 queue approvals.
5. Dang nhap admin -> vao `/admin`.
6. Vao `/dashboard` -> doi chieu so lieu.

## 5. Loi thuong gap va cach xu ly nhanh

1. Loi upload selfie:
   - Nguyen nhan: thieu bucket `attendance-selfies` hoac bucket khong public.
   - Xu ly: tao bucket dung ten va bat public.
2. Khong vao duoc `/admin`:
   - Nguyen nhan: user chua co role `admin`.
   - Xu ly: update `public.profiles.role = 'admin'`.
3. Worker khong check-in duoc:
   - Nguyen nhan: chua co assignment trong `employee_worksites`.
   - Xu ly: chay seed hoac tao assignment thu cong.
4. Dashboard khong co so lieu:
   - Nguyen nhan: chua co giao dich that trong production DB.
   - Xu ly: chay lai smoke flow worker/manager.

## 6. Definition of Done (Production)

Hoan tat khi dap ung du 4 dieu kien:

1. Vercel deployment `Ready`.
2. Worker check-in + selfie thanh cong.
3. Manager duyet duoc leave/overtime/correction.
4. Dashboard cap nhat dung so lieu sau cac thao tac test.

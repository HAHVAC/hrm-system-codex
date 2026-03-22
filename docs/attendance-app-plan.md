# Attendance App Plan

## Product scope

MVP v1 focuses on worksite attendance verification and lightweight HR approvals.

Core features:
- Employee sign in
- Worksite-based check-in and check-out with GPS
- Selfie capture during attendance
- Leave request submission
- Overtime request submission
- Manager approval flows
- Daily attendance overview for managers and admins
- Attendance exception flagging
- Manual correction request

Out of scope for v1:
- Payroll calculation
- Face recognition
- Offline-first sync
- Shift scheduling engine
- Deep analytics
- Multi-company tenant architecture

## Recommended stack

- Frontend: Next.js App Router
- UI: Tailwind CSS + shadcn/ui
- Backend: Supabase
- Database: Postgres on Supabase
- Auth: Supabase Auth
- File storage: Supabase Storage for selfie images
- Hosting: Vercel

Why this stack:
- Fast for a beginner to ship
- Auth, DB, and storage are integrated
- Easy to evolve into a real product
- Good fit for mobile-friendly web before native apps

## User roles

### Employee
- Sign in
- View assigned worksite
- Check in
- Check out
- Submit leave requests
- Submit overtime requests
- Submit attendance correction requests

### Manager
- View team attendance
- Review check-in evidence
- Approve or reject leave
- Approve or reject overtime
- Review attendance exceptions
- Approve correction requests

### Admin
- Manage employees
- Manage worksites
- Assign employees to worksites
- View cross-site attendance summary

## Main screens

### Employee screens
- Login
- My attendance today
- Check-in flow
- Check-out flow
- Leave requests
- Overtime requests
- Correction requests
- Attendance history

### Manager screens
- Dashboard
- Attendance list by date
- Employee attendance detail
- Leave approval queue
- Overtime approval queue
- Correction approval queue

### Admin screens
- Employee management
- Worksite management
- Assignment management

## Core data model

### profiles
- id
- email
- full_name
- role (`employee`, `manager`, `admin`)
- employee_code
- phone
- is_active
- created_at

### worksites
- id
- name
- address
- latitude
- longitude
- allowed_radius_meters
- is_active
- created_at

### employee_worksites
- id
- employee_id
- worksite_id
- start_date
- end_date
- is_primary

### attendance_records
- id
- employee_id
- worksite_id
- attendance_date
- check_in_at
- check_out_at
- check_in_latitude
- check_in_longitude
- check_out_latitude
- check_out_longitude
- check_in_distance_meters
- check_out_distance_meters
- check_in_selfie_url
- check_out_selfie_url
- status (`present`, `late`, `incomplete`, `exception`)
- exception_reason
- created_at
- updated_at

### leave_requests
- id
- employee_id
- leave_type
- start_date
- end_date
- reason
- status (`pending`, `approved`, `rejected`)
- reviewed_by
- reviewed_at
- review_note
- created_at

### overtime_requests
- id
- employee_id
- worksite_id
- request_date
- start_time
- end_time
- total_hours
- reason
- status (`pending`, `approved`, `rejected`)
- reviewed_by
- reviewed_at
- review_note
- created_at

### correction_requests
- id
- employee_id
- attendance_record_id
- request_type (`missed_check_in`, `missed_check_out`, `gps_issue`, `other`)
- requested_value
- reason
- status (`pending`, `approved`, `rejected`)
- reviewed_by
- reviewed_at
- review_note
- created_at

### approval_logs
- id
- entity_type
- entity_id
- action
- actor_id
- note
- created_at

## Key business rules

- An employee can only check in if assigned to the worksite.
- Check-in is valid only if current GPS is within the worksite radius.
- A selfie is required for check-in and check-out.
- Each employee can have only one open attendance record per day.
- Check-out requires an existing check-in.
- Requests for leave, overtime, and corrections must go through approval status transitions.
- Managers can only review employees assigned to them or their worksite scope.
- Admin can view and manage all data.

## Critical edge cases

- Employee is outside the valid GPS radius
- Employee denies camera permission
- Employee denies location permission
- Employee forgets to check out
- Employee submits duplicate check-in
- Selfie upload succeeds but attendance write fails
- Attendance write succeeds but selfie upload fails
- Manager approval happens twice in separate tabs
- Employee is reassigned to another worksite mid-period

## Suggested architecture

### App layers
- Presentation layer: Next.js pages and UI components
- Server actions / route handlers: validate requests and enforce permissions
- Domain layer: attendance, leave, overtime, and approval logic
- Data layer: Supabase queries and storage access

### Functional modules
- auth
- profiles
- worksites
- attendance
- leave
- overtime
- approvals
- dashboard

## API and workflow outline

### Attendance flow
1. Employee opens "today" screen
2. App fetches assigned worksite and today's record
3. User grants GPS and camera permissions
4. App captures selfie and current location
5. Server validates assignment and distance to worksite
6. Server uploads selfie, creates or updates attendance record
7. UI returns success or an exception warning

### Leave flow
1. Employee submits leave form
2. Server validates date range and overlaps
3. Request saved as `pending`
4. Manager reviews and updates status
5. Action written to approval log

### Overtime flow
1. Employee submits overtime request
2. Server validates time range and duration
3. Request saved as `pending`
4. Manager approves or rejects
5. Action written to approval log

## Security and permissions

- Use row-level security in Supabase
- Employees can only read and write their own requests and attendance
- Managers can only read employees in their scope
- Admin has full access
- Storage bucket paths should be namespaced by employee and date
- Never trust GPS distance checks from the client only; re-validate on the server

## Testing strategy

### Unit tests
- GPS radius calculation
- Attendance status calculation
- Request approval transitions
- Permission checks

### Integration tests
- Check-in success path
- Check-in outside allowed radius
- Leave approval flow
- Overtime approval flow
- Correction approval flow

### Manual QA
- Mobile viewport check-in flow
- Camera permission denied
- Location permission denied
- Poor network during selfie upload

## Build order

### Phase 1: foundation
- Initialize Next.js app
- Set up Supabase project
- Configure auth
- Create database schema
- Seed roles and demo users

### Phase 2: attendance core
- Employee home screen
- Worksite assignment lookup
- Check-in
- Check-out
- Attendance history

### Phase 3: approval workflows
- Leave requests
- Overtime requests
- Correction requests
- Manager approval queues

### Phase 4: admin and hardening
- Employee management
- Worksite management
- Exception handling
- Tests and QA

## Delivery estimate

- Human team: about 2 to 3 weeks for a careful MVP
- CC plus gstack: about 1 to 2 days for a working MVP skeleton, then another 1 to 2 days for cleanup and QA

## Recommendation

Build this as a mobile-first web app first.

Do not start with React Native or Flutter. The main risk is validating the workflow and business rules, not app-store packaging. Once the web flow is stable, a native wrapper or dedicated mobile app becomes much safer.

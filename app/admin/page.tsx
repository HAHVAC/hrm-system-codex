import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

import {
  assignEmployeeWorksiteAction,
  createWorksiteAction,
  updateEmployeeRoleAction,
} from "./actions";

type AdminPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const message = params?.message;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <section className="rounded-[2rem] border border-dashed border-alert/30 bg-[#fff4ec] p-8 text-sm leading-8 text-alert">
          Supabase chua duoc cau hinh. Hay tao <code>.env.local</code> va chay
          SQL truoc khi dung admin screens.
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+vao+admin");
  }

  const profileQuery = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileQuery.error ||
    !profileQuery.data ||
    profileQuery.data.role !== "admin"
  ) {
    redirect("/dashboard?message=Ban+khong+co+quyen+vao+admin");
  }

  const [worksitesQuery, employeesQuery, assignmentsQuery] = await Promise.all([
    supabase
      .from("worksites")
      .select("id, name, address, latitude, longitude, allowed_radius_meters, is_active")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, employee_code, is_active")
      .order("created_at", { ascending: false }),
    supabase
      .from("employee_worksites")
      .select("id, employee_id, worksite_id, start_date, end_date, is_primary")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const worksites = worksitesQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  const worksiteMap = new Map(worksites.map((worksite) => [worksite.id, worksite]));
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_70px_rgba(24,35,15,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              Admin Console
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              Quan ly cong truong va nhan su
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
              Trang admin nay cho phep tao cong truong, cap role nhan vien, va gan
              nhan vien vao cong truong de mo khoa toan bo workflow cham cong.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
              {profileQuery.data.full_name}
            </span>
            <Link
              href="/dashboard"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Ve dashboard
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
              >
                Dang xuat
              </button>
            </form>
          </div>
        </div>

        {message ? (
          <div className="mt-6 rounded-[1.4rem] border border-dashed border-accent/40 bg-[#f6f1e5] p-4 text-sm leading-7 text-foreground">
            {message}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-line bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Worksites
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Tao cong truong</h2>
          <form action={createWorksiteAction} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Ten cong truong</span>
              <input
                name="name"
                type="text"
                required
                placeholder="Cong truong Binh Tan"
                className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Dia chi</span>
              <input
                name="address"
                type="text"
                required
                placeholder="Quoc lo 1A, Binh Tan, TP HCM"
                className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Latitude</span>
                <input
                  name="latitude"
                  type="number"
                  step="0.000001"
                  required
                  className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Longitude</span>
                <input
                  name="longitude"
                  type="number"
                  step="0.000001"
                  required
                  className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Ban kinh hop le (m)</span>
              <input
                name="allowed_radius_meters"
                type="number"
                min="10"
                defaultValue="150"
                required
                className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
            >
              Tao cong truong
            </button>
          </form>

          <div className="mt-8 space-y-4">
            {worksites.map((worksite) => (
              <article
                key={worksite.id}
                className="rounded-[1.25rem] border border-line bg-[#faf7f0] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{worksite.name}</h3>
                  <span className="rounded-full bg-[#efe6d6] px-3 py-1 font-mono text-xs text-foreground">
                    {worksite.allowed_radius_meters}m
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {worksite.address}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {worksite.latitude}, {worksite.longitude}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[2rem] border border-line bg-card p-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              Employees
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Cap role nhan vien</h2>
            <div className="mt-6 space-y-4">
              {employees.map((employee) => (
                <article
                  key={employee.id}
                  className="rounded-[1.25rem] border border-line bg-[#faf7f0] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{employee.full_name}</h3>
                      <p className="mt-1 text-sm text-muted">{employee.email}</p>
                      <p className="mt-1 text-sm text-muted">
                        Code: {employee.employee_code ?? "chua co"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#efe6d6] px-3 py-1 font-mono text-xs text-foreground">
                      {employee.role}
                    </span>
                  </div>
                  <form
                    action={updateEmployeeRoleAction}
                    className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"
                  >
                    <input type="hidden" name="profile_id" value={employee.id} />
                    <select
                      name="role"
                      defaultValue={employee.role}
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    >
                      <option value="employee">employee</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
                    >
                      Cap nhat role
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-card p-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              Assignments
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Gan nhan vien vao cong truong</h2>
            <form action={assignEmployeeWorksiteAction} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_180px_180px_auto]">
              <select
                name="employee_id"
                defaultValue=""
                className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
                required
              >
                <option value="" disabled>
                  Chon nhan vien
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} | {employee.email}
                  </option>
                ))}
              </select>
              <select
                name="worksite_id"
                defaultValue=""
                className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
                required
              >
                <option value="" disabled>
                  Chon cong truong
                </option>
                {worksites.map((worksite) => (
                  <option key={worksite.id} value={worksite.id}>
                    {worksite.name}
                  </option>
                ))}
              </select>
              <input
                name="start_date"
                type="date"
                required
                className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
              />
              <select
                name="is_primary"
                defaultValue="true"
                className="w-full rounded-2xl border border-line bg-[#faf7f0] px-4 py-3 outline-none transition focus:border-accent"
              >
                <option value="true">primary</option>
                <option value="false">secondary</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
              >
                Gan
              </button>
            </form>

            <div className="mt-6 space-y-4">
              {assignments.map((assignment) => {
                const employee = employeeMap.get(assignment.employee_id);
                const worksite = worksiteMap.get(assignment.worksite_id);

                return (
                  <article
                    key={assignment.id}
                    className="rounded-[1.25rem] border border-line bg-[#faf7f0] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {employee?.full_name ?? assignment.employee_id}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {worksite?.name ?? assignment.worksite_id}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#efe6d6] px-3 py-1 font-mono text-xs text-foreground">
                        {assignment.is_primary ? "primary" : "secondary"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Tu {assignment.start_date}
                      {assignment.end_date ? ` den ${assignment.end_date}` : ""}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

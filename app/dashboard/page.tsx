import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

type SummaryCard = {
  label: string;
  value: number;
  tone: string;
};

type QueueCard = {
  title: string;
  count: number;
  note: string;
  href: string;
};

type LiveAttendanceItem = {
  id: string;
  name: string;
  site: string;
  status: string;
  time: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const authResult = supabase ? await supabase.auth.getClaims() : null;
  const user = authResult?.data?.claims;

  if (supabase && !user) {
    redirect("/login?message=Hay+dang+nhap+de+vao+dashboard");
  }

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <section className="rounded-[2rem] border border-dashed border-alert/30 bg-[#fff4ec] p-6 text-sm leading-8 text-alert">
          Supabase chua duoc cau hinh. Hay tao <code>.env.local</code> tu{" "}
          <code>.env.example</code>, sau do tao project Supabase va chay SQL trong{" "}
          <code>supabase/schema.sql</code>.
        </section>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const profileQuery = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", String(user?.sub ?? ""))
    .maybeSingle();

  const role = profileQuery.data?.role ?? "employee";
  const isManagerView = role === "manager" || role === "admin";

  const attendanceBaseQuery = () =>
    supabase.from("attendance_records").select(
      `
        id,
        employee_id,
        attendance_date,
        check_in_at,
        check_out_at,
        status,
        check_in_distance_meters,
        profiles (
          full_name
        ),
        worksites (
          name
        )
      `,
    );

  const pendingLeaveCountQuery = supabase
    .from("leave_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const pendingOvertimeCountQuery = supabase
    .from("overtime_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const pendingCorrectionCountQuery = supabase
    .from("correction_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const checkedInCountQuery = supabase
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("attendance_date", today)
    .not("check_in_at", "is", null);

  const openAttendanceCountQuery = supabase
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("attendance_date", today)
    .not("check_in_at", "is", null)
    .is("check_out_at", null);

  const exceptionCountQuery = supabase
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("attendance_date", today)
    .eq("status", "exception");

  const liveAttendanceQuery = attendanceBaseQuery()
    .eq("attendance_date", today)
    .order("check_in_at", { ascending: false })
    .limit(8);

  const [
    checkedInCountResult,
    openAttendanceCountResult,
    exceptionCountResult,
    pendingLeaveCountResult,
    pendingOvertimeCountResult,
    pendingCorrectionCountResult,
    liveAttendanceResult,
  ] = await Promise.all([
    isManagerView
      ? checkedInCountQuery
      : checkedInCountQuery.eq("employee_id", String(user?.sub ?? "")),
    isManagerView
      ? openAttendanceCountQuery
      : openAttendanceCountQuery.eq("employee_id", String(user?.sub ?? "")),
    isManagerView
      ? exceptionCountQuery
      : exceptionCountQuery.eq("employee_id", String(user?.sub ?? "")),
    isManagerView
      ? pendingLeaveCountQuery
      : pendingLeaveCountQuery.eq("employee_id", String(user?.sub ?? "")),
    isManagerView
      ? pendingOvertimeCountQuery
      : pendingOvertimeCountQuery.eq("employee_id", String(user?.sub ?? "")),
    isManagerView
      ? pendingCorrectionCountQuery
      : pendingCorrectionCountQuery.eq("employee_id", String(user?.sub ?? "")),
    isManagerView
      ? liveAttendanceQuery
      : liveAttendanceQuery.eq("employee_id", String(user?.sub ?? "")),
  ]);

  const summaryCards: SummaryCard[] = [
    {
      label: "Da check-in",
      value: checkedInCountResult.count ?? 0,
      tone: "text-accent",
    },
    {
      label: "Chua checkout",
      value: openAttendanceCountResult.count ?? 0,
      tone: "text-alert",
    },
    {
      label: isManagerView ? "Ca bat thuong" : "Yeu cau cua ban",
      value: isManagerView
        ? exceptionCountResult.count ?? 0
        : (pendingLeaveCountResult.count ?? 0) +
          (pendingOvertimeCountResult.count ?? 0) +
          (pendingCorrectionCountResult.count ?? 0),
      tone: "text-foreground",
    },
  ];

  const queueCards: QueueCard[] = [
    {
      title: "Xin nghi phep",
      count: pendingLeaveCountResult.count ?? 0,
      note: isManagerView
        ? "So don nghi dang cho manager/admin duyet."
        : "So don nghi cua ban dang cho xu ly.",
      href: isManagerView ? "/leave-approvals" : "/leave",
    },
    {
      title: "Tang ca",
      count: pendingOvertimeCountResult.count ?? 0,
      note: isManagerView
        ? "So don tang ca dang cho manager/admin duyet."
        : "So don tang ca cua ban dang cho xu ly.",
      href: isManagerView ? "/overtime-approvals" : "/overtime",
    },
    {
      title: "Chinh cong",
      count: pendingCorrectionCountResult.count ?? 0,
      note: isManagerView
        ? "So yeu cau chinh cong dang cho manager/admin duyet."
        : "So yeu cau chinh cong cua ban dang cho xu ly.",
      href: isManagerView ? "/correction-approvals" : "/corrections",
    },
  ];

  const liveAttendance: LiveAttendanceItem[] = (liveAttendanceResult.data ?? []).map(
    (row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const worksite = Array.isArray(row.worksites)
        ? row.worksites[0]
        : row.worksites;

      const timeSource = row.check_out_at ?? row.check_in_at;
      const time = timeSource
        ? new Date(timeSource).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--";

      let status = "Chua check-in";
      if (row.check_in_at && !row.check_out_at) {
        status = "Dang trong ca";
      } else if (row.check_in_at && row.check_out_at) {
        status = "Da checkout";
      }
      if (row.status === "exception") {
        status = "Can kiem tra";
      }

      return {
        id: row.id,
        name: profile?.full_name ?? "Chua ro nhan vien",
        site: worksite?.name ?? "Khong ro cong truong",
        status,
        time,
      };
    },
  );

  const dashboardLabel = isManagerView ? "Manager Dashboard" : "Employee Dashboard";
  const dashboardTitle = isManagerView
    ? "Tinh hinh cham cong hom nay"
    : "Tong quan cong viec hom nay";
  const dashboardDescription = isManagerView
    ? "Dashboard nay da doc du lieu that tu Supabase cho attendance, approvals va live queue."
    : "Dashboard nay hien thi du lieu that cua ban tu Supabase, gom cham cong va cac yeu cau dang cho xu ly.";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_70px_rgba(24,35,15,0.08)] md:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            {dashboardLabel}
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            {dashboardTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
            {dashboardDescription}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
              Signed in{user?.email ? `: ${user.email}` : ""}
            </span>
            <span className="rounded-full bg-[#efe6d6] px-3 py-2 font-mono text-xs text-foreground">
              role: {role}
            </span>
            <a
              href="/today"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Mo man hinh hom nay
            </a>
            <a
              href="/history"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Xem lich su
            </a>
            <a
              href="/leave"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Don nghi
            </a>
            <a
              href="/overtime"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Don tang ca
            </a>
            <a
              href="/corrections"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Chinh cong
            </a>
            {isManagerView ? (
              <>
                <a
                  href="/leave-approvals"
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
                >
                  Queue duyet
                </a>
                <a
                  href="/overtime-approvals"
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
                >
                  Queue tang ca
                </a>
                <a
                  href="/correction-approvals"
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
                >
                  Queue chinh cong
                </a>
              </>
            ) : null}
            {role === "admin" ? (
              <a
                href="/admin"
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
              >
                Admin screens
              </a>
            ) : null}
            <a
              href="/demo"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Demo checklist
            </a>
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
        <div className="rounded-[1.5rem] bg-[#eee4d3] p-5">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Today
          </p>
          <div className="mt-4 grid gap-4">
            {summaryCards.map((item) => (
              <div
                key={item.label}
                className="flex items-end justify-between rounded-[1.25rem] border border-white/70 bg-card/80 px-4 py-4"
              >
                <span className="text-sm text-muted">{item.label}</span>
                <span className={`text-3xl font-semibold ${item.tone}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                Approval Queues
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Hang cho xu ly</h2>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
              {isManagerView ? "Manager" : "Employee"}
            </span>
          </div>
          <div className="mt-6 grid gap-4">
            {queueCards.map((queue) => (
              <article
                key={queue.title}
                className="rounded-[1.4rem] border border-line bg-[#faf7f0] p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{queue.title}</h3>
                  <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">
                    {queue.count}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">{queue.note}</p>
                <a
                  href={queue.href}
                  className="mt-4 inline-flex text-sm font-semibold text-accent"
                >
                  Mo chi tiet
                </a>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Live attendance
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {isManagerView ? "Cham cong dang dien ra" : "Ban ghi hom nay cua ban"}
          </h2>
          <div className="mt-6 space-y-4">
            {liveAttendance.length === 0 ? (
              <article className="rounded-[1.4rem] border border-dashed border-line bg-[#faf7f0] p-5 text-sm leading-7 text-muted">
                Chua co ban ghi attendance nao cho hom nay.
              </article>
            ) : (
              liveAttendance.map((employee) => (
                <article
                  key={employee.id}
                  className="rounded-[1.4rem] border border-line bg-[#faf7f0] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{employee.name}</h3>
                      <p className="mt-1 text-sm text-muted">{employee.site}</p>
                    </div>
                    <span className="font-mono text-sm text-accent">
                      {employee.time}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    {employee.status}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

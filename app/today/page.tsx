import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { ToastMessage } from "@/components/ui/toast-message";
import { detectAttendanceMode } from "@/lib/attendance";
import { createClient } from "@/lib/supabase/server";

import { AttendanceForm } from "./attendance-form";

type TodayPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const params = await searchParams;
  const message = params?.message;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <section className="rounded-[2rem] border border-dashed border-alert/30 bg-[#fff4ec] p-8 text-sm leading-8 text-alert">
          Supabase chua duoc cau hinh. Hay tao <code>.env.local</code>, dien key,
          va chay SQL trong <code>supabase/schema.sql</code> truoc khi cham cong.
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+vao+man+hinh+hom+nay");
  }

  const today = new Date().toISOString().slice(0, 10);

  const [profileQuery, assignmentQuery, recordQuery] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("employee_worksites")
      .select(
        `
          is_primary,
          worksites (
            id,
            name,
            address,
            allowed_radius_meters
          )
        `,
      )
      .eq("employee_id", user.id)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("attendance_records")
      .select(
        "attendance_date, check_in_at, check_out_at, check_in_distance_meters, check_out_distance_meters, check_in_selfie_url, check_out_selfie_url",
      )
      .eq("employee_id", user.id)
      .eq("attendance_date", today)
      .maybeSingle(),
  ]);

  const worksite = assignmentQuery.data?.worksites
    ? Array.isArray(assignmentQuery.data.worksites)
      ? assignmentQuery.data.worksites[0]
      : assignmentQuery.data.worksites
    : null;

  const expectedMode = detectAttendanceMode(recordQuery.data ?? null);
  const expectedActionLabel =
    expectedMode === "check_in" ? "Check-in ngay" : "Check-out ngay";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_70px_rgba(24,35,15,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Employee Today
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Cham cong hom nay
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
            Man hinh nay la luong MVP dau tien: lay GPS, chup selfie, va gui
            check-in hoac check-out vao attendance_records.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
              {profileQuery.data?.full_name ?? user.email}
            </span>
            <span className="rounded-full bg-[#efe6d6] px-3 py-2 font-mono text-xs text-foreground">
              {worksite ? worksite.name : "Chua gan cong truong"}
            </span>
            <Link
              href="/history"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Xem lich su
            </Link>
            <Link
              href="/leave"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Xin nghi phep
            </Link>
            <Link
              href="/overtime"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Xin tang ca
            </Link>
            <Link
              href="/corrections"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Chinh cong
            </Link>
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

          {message ? <ToastMessage message={message} /> : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.4rem] border border-line bg-[#faf7f0] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Cong truong
              </p>
              <h2 className="mt-3 text-xl font-semibold">
                {worksite?.name ?? "Chua co assignment"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                {worksite?.address ?? "Admin can gan cong truong truoc khi check-in."}
              </p>
              {worksite ? (
                <p className="mt-3 text-sm text-muted">
                  Ban kinh hop le: {worksite.allowed_radius_meters}m
                </p>
              ) : null}
            </article>

            <article className="rounded-[1.4rem] border border-line bg-[#faf7f0] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Trang thai
              </p>
              <h2 className="mt-3 text-xl font-semibold">
                {expectedMode === "check_in"
                  ? "San sang check-in"
                  : "San sang check-out"}
              </h2>
              <div className="mt-3 space-y-2 text-sm leading-7 text-muted">
                <p>Check-in: {recordQuery.data?.check_in_at ?? "Chua co"}</p>
                <p>Check-out: {recordQuery.data?.check_out_at ?? "Chua co"}</p>
                <p>
                  Lich su:{" "}
                  <Link href="/history" className="font-semibold text-accent">
                    Mo 14 ban ghi gan nhat
                  </Link>
                </p>
              </div>
            </article>
          </div>
        </div>

        <section className="rounded-[1.6rem] border border-line bg-[#f3ecdf] p-5">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            {expectedActionLabel}
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            GPS + selfie + server action
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Form se tu dong quyet dinh check-in hay check-out dua tren ban ghi
            hom nay. Selfie duoc upload len bucket <code>attendance-selfies</code>.
          </p>
          <div className="mt-6">
            <AttendanceForm
              canSubmit={Boolean(worksite)}
              expectedActionLabel={expectedActionLabel}
            />
          </div>
        </section>
      </section>
    </main>
  );
}

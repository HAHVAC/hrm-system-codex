import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

import { submitCorrectionRequestAction } from "./actions";

type CorrectionsPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function CorrectionsPage({
  searchParams,
}: CorrectionsPageProps) {
  const params = await searchParams;
  const message = params?.message;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <section className="rounded-[2rem] border border-dashed border-alert/30 bg-[#fff4ec] p-8 text-sm leading-8 text-alert">
          Supabase chua duoc cau hinh. Hay tao <code>.env.local</code> va chay
          SQL truoc khi dung module chinh cong.
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+gui+yeu+cau+chinh+cong");
  }

  const [profileQuery, attendanceQuery, requestsQuery] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("attendance_records")
      .select("id, attendance_date, check_in_at, check_out_at, status")
      .eq("employee_id", user.id)
      .order("attendance_date", { ascending: false })
      .limit(14),
    supabase
      .from("correction_requests")
      .select(
        `
          id,
          attendance_record_id,
          request_type,
          requested_value,
          reason,
          status,
          review_note,
          attendance_records (
            attendance_date
          )
        `,
      )
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const attendanceRows = attendanceQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_70px_rgba(24,35,15,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Employee Corrections
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Yeu cau chinh cong
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
            Nhan vien co the xin sua check-in, check-out hoac van de GPS cho mot
            ban ghi cham cong cu the.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
              {profileQuery.data?.full_name ?? user.email}
            </span>
            <Link
              href="/today"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Ve hom nay
            </Link>
            <Link
              href="/history"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Xem lich su
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

          {message ? (
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-accent/40 bg-[#f6f1e5] p-4 text-sm leading-7 text-foreground">
              {message}
            </div>
          ) : null}
        </div>

        <section className="rounded-[1.6rem] border border-line bg-[#f3ecdf] p-5">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            New request
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Tao yeu cau chinh cong</h2>
          <form action={submitCorrectionRequestAction} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Ban ghi cham cong</span>
              <select
                name="attendance_record_id"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Chon mot ban ghi gan day
                </option>
                {attendanceRows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.attendance_date} | in: {row.check_in_at ?? "chua co"} | out:{" "}
                    {row.check_out_at ?? "chua co"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Loai yeu cau</span>
              <select
                name="request_type"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                defaultValue="missed_check_out"
              >
                <option value="missed_check_in">Thieu check-in</option>
                <option value="missed_check_out">Thieu check-out</option>
                <option value="gps_issue">Sai GPS</option>
                <option value="other">Khac</option>
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Gia tri de nghi</span>
              <input
                name="requested_value"
                type="text"
                placeholder="VD: Checkout luc 18:15, GPS dung o cong A."
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Ly do</span>
              <textarea
                name="reason"
                rows={4}
                required
                placeholder="Mo ta tai sao can chinh cong."
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
            >
              Gui yeu cau chinh cong
            </button>
          </form>
        </section>
      </section>

      <section className="grid gap-4">
        {requests.length === 0 ? (
          <article className="rounded-[1.5rem] border border-dashed border-line bg-[#faf7f0] p-6 text-sm leading-7 text-muted">
            Chua co yeu cau chinh cong nao. Gui thu mot yeu cau de test workflow.
          </article>
        ) : (
          requests.map((request) => {
            const attendanceRecord = Array.isArray(request.attendance_records)
              ? request.attendance_records[0]
              : request.attendance_records;
            const requestedValue =
              request.requested_value &&
              typeof request.requested_value === "object" &&
              "requested_value" in request.requested_value
                ? String(request.requested_value.requested_value ?? "")
                : "";

            return (
              <article
                key={request.id}
                className="rounded-[1.5rem] border border-line bg-card p-6 shadow-[0_10px_35px_rgba(24,35,15,0.06)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                      {request.request_type}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {attendanceRecord?.attendance_date ?? "Khong ro ngay cham cong"}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#efe6d6] px-3 py-2 font-mono text-xs text-foreground">
                    {request.status}
                  </span>
                </div>
                {requestedValue ? (
                  <p className="mt-4 text-sm leading-7 text-muted">
                    De nghi: {requestedValue}
                  </p>
                ) : null}
                <p className="mt-3 text-sm leading-7 text-muted">{request.reason}</p>
                {request.review_note ? (
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Ghi chu duyet: {request.review_note}
                  </p>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

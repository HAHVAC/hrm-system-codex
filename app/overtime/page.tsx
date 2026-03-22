import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

import { submitOvertimeRequestAction } from "./actions";

type OvertimePageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function OvertimePage({
  searchParams,
}: OvertimePageProps) {
  const params = await searchParams;
  const message = params?.message;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <section className="rounded-[2rem] border border-dashed border-alert/30 bg-[#fff4ec] p-8 text-sm leading-8 text-alert">
          Supabase chua duoc cau hinh. Hay tao <code>.env.local</code> va chay
          SQL truoc khi dung module tang ca.
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+gui+don+tang+ca");
  }

  const [profileQuery, requestsQuery] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("overtime_requests")
      .select(
        "id, request_date, start_time, end_time, total_hours, reason, status, review_note",
      )
      .eq("employee_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const requests = requestsQuery.data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_70px_rgba(24,35,15,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Employee Overtime
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Xin tang ca
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
            Nhan vien gui don tang ca theo ngay, khung gio va ly do. Du lieu duoc
            luu vao <code>overtime_requests</code> de cho manager duyet.
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
              href="/leave"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Don nghi
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
          <h2 className="mt-3 text-2xl font-semibold">Tao don tang ca</h2>
          <form action={submitOvertimeRequestAction} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Ngay tang ca</span>
              <input
                name="request_date"
                type="date"
                required
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Bat dau luc</span>
                <input
                  name="start_time"
                  type="time"
                  required
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Ket thuc luc</span>
                <input
                  name="end_time"
                  type="time"
                  required
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Ly do</span>
              <textarea
                name="reason"
                rows={4}
                required
                placeholder="Mo ta vi sao can tang ca."
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
            >
              Gui don tang ca
            </button>
          </form>
        </section>
      </section>

      <section className="grid gap-4">
        {requests.length === 0 ? (
          <article className="rounded-[1.5rem] border border-dashed border-line bg-[#faf7f0] p-6 text-sm leading-7 text-muted">
            Chua co don tang ca nao. Gui thu mot don de test workflow.
          </article>
        ) : (
          requests.map((request) => (
            <article
              key={request.id}
              className="rounded-[1.5rem] border border-line bg-card p-6 shadow-[0_10px_35px_rgba(24,35,15,0.06)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                    {request.request_date}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {request.start_time} den {request.end_time}
                  </h2>
                </div>
                <span className="rounded-full bg-[#efe6d6] px-3 py-2 font-mono text-xs text-foreground">
                  {request.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">{request.reason}</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Tong gio: {request.total_hours}
              </p>
              {request.review_note ? (
                <p className="mt-3 text-sm leading-7 text-muted">
                  Ghi chu duyet: {request.review_note}
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}

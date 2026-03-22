import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

import { submitLeaveRequestAction } from "./actions";

type LeavePageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function LeavePage({ searchParams }: LeavePageProps) {
  const params = await searchParams;
  const message = params?.message;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <section className="rounded-[2rem] border border-dashed border-alert/30 bg-[#fff4ec] p-8 text-sm leading-8 text-alert">
          Supabase chua duoc cau hinh. Hay tao <code>.env.local</code> va chay
          SQL truoc khi dung module nghi phep.
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+gui+don+nghi");
  }

  const [profileQuery, requestsQuery] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("leave_requests")
      .select(
        "id, leave_type, start_date, end_date, reason, status, review_note, reviewed_at",
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
            Employee Leave
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Xin nghi phep
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
            Nhan vien gui don nghi phep tu app. Du lieu duoc luu vao
            <code> leave_requests </code> va cho quan ly duyet.
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
          <h2 className="mt-3 text-2xl font-semibold">Tao don nghi phep</h2>
          <form action={submitLeaveRequestAction} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Loai nghi</span>
              <select
                name="leave_type"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                defaultValue="annual"
              >
                <option value="annual">Nghi phep nam</option>
                <option value="sick">Nghi om</option>
                <option value="personal">Nghi viec rieng</option>
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Tu ngay</span>
                <input
                  name="start_date"
                  type="date"
                  required
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Den ngay</span>
                <input
                  name="end_date"
                  type="date"
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
                placeholder="Mo ta ly do nghi de quan ly xem xet."
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
            >
              Gui don nghi
            </button>
          </form>
        </section>
      </section>

      <section className="grid gap-4">
        {requests.length === 0 ? (
          <article className="rounded-[1.5rem] border border-dashed border-line bg-[#faf7f0] p-6 text-sm leading-7 text-muted">
            Chua co don nghi nao. Gui thu mot don de test workflow.
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
                    {request.leave_type}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {request.start_date} den {request.end_date}
                  </h2>
                </div>
                <span className="rounded-full bg-[#efe6d6] px-3 py-2 font-mono text-xs text-foreground">
                  {request.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">{request.reason}</p>
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

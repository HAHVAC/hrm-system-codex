import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastMessage } from "@/components/ui/toast-message";
import { createClient } from "@/lib/supabase/server";

import { reviewLeaveRequestAction } from "@/app/leave/actions";

type LeaveApprovalsPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function LeaveApprovalsPage({
  searchParams,
}: LeaveApprovalsPageProps) {
  const params = await searchParams;
  const message = params?.message;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <section className="rounded-[2rem] border border-dashed border-alert/30 bg-[#fff4ec] p-8 text-sm leading-8 text-alert">
          Supabase chua duoc cau hinh. Hay tao <code>.env.local</code> va chay
          SQL truoc khi dung queue duyet nghi phep.
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+duyet+don");
  }

  const profileQuery = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileQuery.error ||
    !profileQuery.data ||
    !["manager", "admin"].includes(profileQuery.data.role)
  ) {
    redirect("/dashboard?message=Ban+khong+co+quyen+vao+queue+duyet");
  }

  const requestsQuery = await supabase
    .from("leave_requests")
    .select(
      "id, employee_id, leave_type, start_date, end_date, reason, status, created_at, review_note",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const requests = requestsQuery.data ?? [];
  const employeeIds = [...new Set(requests.map((request) => request.employee_id))];

  const profilesQuery =
    employeeIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", employeeIds)
      : { data: [], error: null };

  const profileMap = new Map(
    (profilesQuery.data ?? []).map((profile) => [profile.id, profile]),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_70px_rgba(24,35,15,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              Manager Queue
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              Duyet don nghi phep
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
              Queue nay cho manager/admin xem leave_requests va approve/reject
              ngay trong app.
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

        {message ? <ToastMessage message={message} /> : null}
      </section>

      <section className="grid gap-4">
        {requests.length === 0 ? (
          <article className="rounded-[1.5rem] border border-dashed border-line bg-[#faf7f0] p-6 text-sm leading-7 text-muted">
            Chua co leave request nao. Hay vao trang /leave de tao du lieu test,
            hoac chay seed demo.
          </article>
        ) : (
          requests.map((request) => {
            const employee = profileMap.get(request.employee_id);

            return (
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
                      {employee?.full_name ?? employee?.email ?? request.employee_id}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {request.start_date} den {request.end_date}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#efe6d6] px-3 py-2 font-mono text-xs text-foreground">
                    {request.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-muted">{request.reason}</p>
                {request.review_note ? (
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Ghi chu hien tai: {request.review_note}
                  </p>
                ) : null}

                <form
                  action={reviewLeaveRequestAction}
                  className="mt-5 grid gap-4 rounded-[1.25rem] border border-line bg-[#faf7f0] p-4 md:grid-cols-[1fr_auto_auto]"
                >
                  <input type="hidden" name="request_id" value={request.id} />
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Ghi chu duyet</span>
                    <input
                      name="review_note"
                      type="text"
                      placeholder="VD: Da duyet, bo sung nguoi thay ca."
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                    />
                  </label>
                  <SubmitButton
                    label="Approve"
                    pendingLabel="Dang xu ly..."
                    name="decision"
                    value="approved"
                    className="rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
                  />
                  <SubmitButton
                    label="Reject"
                    pendingLabel="Dang xu ly..."
                    name="decision"
                    value="rejected"
                    className="rounded-full bg-alert px-5 py-3 font-semibold text-white transition hover:opacity-90"
                  />
                </form>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

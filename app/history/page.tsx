import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <section className="rounded-[2rem] border border-dashed border-alert/30 bg-[#fff4ec] p-8 text-sm leading-8 text-alert">
          Supabase chua duoc cau hinh. Hay tao <code>.env.local</code> va chay
          SQL truoc khi xem lich su.
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+xem+lich+su");
  }

  const [profileQuery, historyQuery] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("attendance_records")
      .select(
        `
          id,
          attendance_date,
          check_in_at,
          check_out_at,
          check_in_distance_meters,
          check_out_distance_meters,
          check_in_selfie_url,
          check_out_selfie_url,
          status,
          worksites (
            name
          )
        `,
      )
      .eq("employee_id", user.id)
      .order("attendance_date", { ascending: false })
      .limit(14),
  ]);

  const rows = historyQuery.data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_70px_rgba(24,35,15,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              Attendance History
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              Lich su cham cong
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
              Trang nay cho nhan vien xem 14 ban ghi gan nhat, kiem tra check-in,
              check-out, khoang cach GPS va anh selfie da luu.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
              {profileQuery.data?.full_name ?? user.email}
            </span>
            <Link
              href="/today"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              Ve hom nay
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
      </section>

      <section className="grid gap-4">
        {rows.length === 0 ? (
          <article className="rounded-[1.5rem] border border-dashed border-line bg-[#faf7f0] p-6 text-sm leading-7 text-muted">
            Chua co ban ghi nao. Hay vao man hinh hom nay de check-in/check-out,
            hoac chay <code>supabase/seed.sql</code> de tao du lieu demo.
          </article>
        ) : (
          rows.map((row) => {
            const worksite = Array.isArray(row.worksites)
              ? row.worksites[0]
              : row.worksites;

            return (
              <article
                key={row.id}
                className="rounded-[1.5rem] border border-line bg-card p-6 shadow-[0_10px_35px_rgba(24,35,15,0.06)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                      {row.attendance_date}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {worksite?.name ?? "Khong ro cong truong"}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#efe6d6] px-3 py-2 font-mono text-xs text-foreground">
                    {row.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.25rem] border border-line bg-[#faf7f0] p-4">
                    <p className="font-mono text-xs text-accent">Check-in</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {row.check_in_at ?? "Chua co"}
                    </p>
                    <p className="text-sm leading-7 text-muted">
                      GPS: {row.check_in_distance_meters ?? "-"}m
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-line bg-[#faf7f0] p-4">
                    <p className="font-mono text-xs text-accent">Check-out</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {row.check_out_at ?? "Chua co"}
                    </p>
                    <p className="text-sm leading-7 text-muted">
                      GPS: {row.check_out_distance_meters ?? "-"}m
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-line bg-[#faf7f0] p-4">
                    <p className="font-mono text-xs text-accent">Anh check-in</p>
                    {row.check_in_selfie_url ? (
                      <a
                        href={row.check_in_selfie_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm font-semibold text-accent"
                      >
                        Mo anh
                      </a>
                    ) : (
                      <p className="mt-2 text-sm leading-7 text-muted">Chua co</p>
                    )}
                  </div>
                  <div className="rounded-[1.25rem] border border-line bg-[#faf7f0] p-4">
                    <p className="font-mono text-xs text-accent">Anh check-out</p>
                    {row.check_out_selfie_url ? (
                      <a
                        href={row.check_out_selfie_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm font-semibold text-accent"
                      >
                        Mo anh
                      </a>
                    ) : (
                      <p className="mt-2 text-sm leading-7 text-muted">Chua co</p>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

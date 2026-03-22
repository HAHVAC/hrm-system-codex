import Link from "next/link";

import { signInAction } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message = params?.message;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 md:px-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_420px]">
        <section className="rounded-[2rem] border border-line bg-[#e7dfcf] p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Employee Entry
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
            Dang nhap de bat dau check-in tai cong truong.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">
            Skeleton nay da noi san server action cho Supabase Auth. Chi can them
            env va tao user la co the dang nhap that.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Nhan vien mo app tren dien thoai",
              "He thong kiem tra tai khoan va cong truong",
              "Chuyen den man hinh cham cong hom nay",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-[1.25rem] border border-white/70 bg-card/80 p-4"
              >
                <p className="font-mono text-xs text-accent">0{index + 1}</p>
                <p className="mt-3 text-sm leading-7 text-muted">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-card p-8 shadow-[0_18px_60px_rgba(24,35,15,0.08)]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              Sign in
            </p>
            <h2 className="mt-3 text-2xl font-semibold">FieldOps HRM</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Dung email va mat khau nhan vien. Form nay submit thang vao Supabase
              Auth bang server action.
            </p>
          </div>

          {message ? (
            <div className="mt-6 rounded-[1.25rem] border border-dashed border-alert/40 bg-[#fff2eb] p-4 text-sm leading-7 text-alert">
              {message}
            </div>
          ) : null}

          <form action={signInAction} className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Email</span>
              <input
                name="email"
                type="email"
                placeholder="worker@fieldops.vn"
                required
                className="w-full rounded-2xl border border-line bg-[#fbf8f1] px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Mat khau</span>
              <input
                name="password"
                type="password"
                placeholder="********"
                required
                className="w-full rounded-2xl border border-line bg-[#fbf8f1] px-4 py-3 outline-none transition focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-strong"
            >
              Dang nhap
            </button>
          </form>

          <div className="mt-6 rounded-[1.25rem] border border-dashed border-accent/30 bg-[#f8f3e8] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              Next step
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Sau khi noi auth va profile, dieu huong nguoi dung sang trang hom
              nay hoac dashboard theo role.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex text-sm font-semibold text-accent"
          >
            Xem dashboard mau
          </Link>
        </section>
      </div>
    </main>
  );
}

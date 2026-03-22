import Link from "next/link";

const features = [
  {
    title: "Check-in GPS + selfie",
    description:
      "Xac minh nhan vien co mat dung cong truong va luu bang chung cham cong theo ngay.",
  },
  {
    title: "Xin nghi va tang ca",
    description:
      "Nhan vien gui don nhanh tren dien thoai, quan ly duyet ngay trong mot hang cho ro rang.",
  },
  {
    title: "Bang cong thuc chien",
    description:
      "Quan ly xem ai da vao ca, ai quen checkout, ai dang co ca bat thuong can xu ly.",
  },
];

const phases = [
  "Khoi tao auth, employee, worksite",
  "Dung check-in/check-out co GPS va selfie",
  "Them nghi phep, tang ca, chinh cong",
  "Hoan thien duyet va bang cong cho quan ly",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-6 py-8 md:px-10 lg:px-12">
      <section className="rounded-[2rem] border border-line/80 bg-card/95 p-8 shadow-[0_18px_70px_rgba(24,35,15,0.08)] md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="font-mono text-sm uppercase tracking-[0.22em] text-accent">
              FieldOps HRM
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                App cham cong cong truong, mobile-first, du ro de bat dau build
                ngay.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted md:text-lg">
                Repo nay da co plan san pham, plan ky thuat, khung Next.js, va
                luong MVP dau tien cho bai toan cham cong bang GPS, selfie, nghi
                phep va tang ca.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/today"
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Mo man hinh cham cong hom nay
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
              >
                Xem dashboard live
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
              >
                Mo demo checklist
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] border border-line bg-[#f0eadf] p-5">
            <div className="rounded-[1.25rem] bg-accent-strong p-5 text-white">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/70">
                MVP Scope
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-white/90">
                <p>Employee, Manager, Admin</p>
                <p>GPS radius validation + selfie evidence</p>
                <p>Leave, overtime, correction approval flow</p>
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-dashed border-accent/30 bg-card p-5">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
                Build Order
              </p>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-muted">
                {phases.map((phase, index) => (
                  <li key={phase}>
                    <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 font-mono text-xs text-accent">
                      {index + 1}
                    </span>
                    {phase}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[1.5rem] border border-line bg-card/90 p-6 shadow-[0_10px_35px_rgba(24,35,15,0.06)]"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Core capability
            </p>
            <h2 className="mt-4 text-2xl font-semibold">{feature.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {feature.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

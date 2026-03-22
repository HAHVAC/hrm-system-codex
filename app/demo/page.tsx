import Link from "next/link";

import { getSupabaseEnv } from "@/lib/supabase/env";

const setupSteps = [
  "Tao file .env.local tu .env.example",
  "Dien NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "Chay supabase/schema.sql trong Supabase SQL Editor",
  "Tao bucket public attendance-selfies",
  "Tao user worker, manager, admin trong Supabase Auth",
  "Chay supabase/seed.sql sau khi sua email demo neu can",
];

const demoScript = [
  "Dang nhap worker va vao /today de check-in bang GPS + selfie",
  "Mo /history de xem ban ghi cham cong va anh selfie",
  "Tao don nghi tai /leave",
  "Tao don tang ca tai /overtime",
  "Tao yeu cau chinh cong tai /corrections",
  "Dang nhap manager va vao cac queue duyet",
  "Dang nhap admin va vao /admin de them cong truong, cap role, gan nhan vien",
  "Mo /dashboard de xem so lieu that da thay doi theo du lieu vua tao",
];

const quickLinks = [
  { href: "/login", label: "Dang nhap" },
  { href: "/today", label: "Cham cong hom nay" },
  { href: "/history", label: "Lich su attendance" },
  { href: "/leave", label: "Don nghi" },
  { href: "/overtime", label: "Don tang ca" },
  { href: "/corrections", label: "Chinh cong" },
  { href: "/leave-approvals", label: "Queue nghi phep" },
  { href: "/overtime-approvals", label: "Queue tang ca" },
  { href: "/correction-approvals", label: "Queue chinh cong" },
  { href: "/admin", label: "Admin screens" },
  { href: "/dashboard", label: "Dashboard live" },
];

export default function DemoPage() {
  const env = getSupabaseEnv();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="rounded-[2rem] border border-line bg-card p-8 shadow-[0_18px_70px_rgba(24,35,15,0.08)]">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
          Demo Readiness
        </p>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
          Checklist de demo app nay muot hon
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
          Trang nay gom checklist setup, thu tu demo, va cac link nhanh den tung
          module. Neu ban muon handoff cho nguoi khac test, chi can dua link nay.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
            Supabase env: {env.isConfigured ? "configured" : "missing"}
          </span>
          <Link
            href="/dashboard"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Mo dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Ve trang chu
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-line bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Setup checklist
          </p>
          <ol className="mt-5 space-y-4 text-sm leading-7 text-muted">
            {setupSteps.map((step, index) => (
              <li key={step}>
                <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 font-mono text-xs text-accent">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-[1.25rem] border border-dashed border-accent/30 bg-[#f8f3e8] p-4 text-sm leading-7 text-muted">
            File huong dan chi tiet nam trong repo tai{" "}
            <code>docs/demo-runbook.md</code>.
          </div>
        </article>

        <article className="rounded-[2rem] border border-line bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
            Demo script
          </p>
          <ol className="mt-5 space-y-4 text-sm leading-7 text-muted">
            {demoScript.map((step, index) => (
              <li key={step}>
                <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 font-mono text-xs text-accent">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="rounded-[2rem] border border-line bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
          Quick links
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[1.25rem] border border-line bg-[#faf7f0] px-4 py-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

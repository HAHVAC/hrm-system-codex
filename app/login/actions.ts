"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function toLoginMessage(message: string) {
  return `/login?message=${encodeURIComponent(message)}`;
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  if (!supabase) {
    redirect(
      toLoginMessage(
        "Chua cau hinh Supabase. Hay tao .env.local tu .env.example truoc.",
      ),
    );
  }

  if (!email || !password) {
    redirect(toLoginMessage("Hay nhap day du email va mat khau."));
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(toLoginMessage("Dang nhap that bai. Kiem tra lai tai khoan."));
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login?message=Da+dang+xuat");
}

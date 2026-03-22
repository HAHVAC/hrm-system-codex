"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function toAdminMessage(message: string) {
  return `/admin?message=${encodeURIComponent(message)}`;
}

async function requireAdmin() {
  const supabase = await createClient();

  if (!supabase) {
    redirect(toAdminMessage("Supabase chua duoc cau hinh."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+vao+admin");
  }

  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error || profileResult.data?.role !== "admin") {
    redirect("/dashboard?message=Ban+khong+co+quyen+vao+admin");
  }

  return { supabase, user };
}

export async function createWorksiteAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const radius = Number(formData.get("allowed_radius_meters"));

  if (
    !name ||
    !address ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(radius)
  ) {
    redirect(toAdminMessage("Hay nhap day du thong tin cong truong."));
  }

  const insertResult = await supabase.from("worksites").insert({
    name,
    address,
    latitude,
    longitude,
    allowed_radius_meters: radius,
  });

  if (insertResult.error) {
    redirect(toAdminMessage("Tao cong truong that bai. Hay thu lai."));
  }

  redirect(toAdminMessage("Tao cong truong thanh cong."));
}

export async function updateEmployeeRoleAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const profileId = String(formData.get("profile_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!profileId || !["employee", "manager", "admin"].includes(role)) {
    redirect(toAdminMessage("Du lieu cap nhat role khong hop le."));
  }

  const updateResult = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (updateResult.error) {
    redirect(toAdminMessage("Cap nhat role that bai."));
  }

  redirect(toAdminMessage("Cap nhat role thanh cong."));
}

export async function assignEmployeeWorksiteAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const worksiteId = String(formData.get("worksite_id") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const isPrimary = String(formData.get("is_primary") ?? "").trim() === "true";

  if (!employeeId || !worksiteId || !startDate) {
    redirect(toAdminMessage("Hay nhap day du thong tin gan cong truong."));
  }

  if (isPrimary) {
    const resetPrimaryResult = await supabase
      .from("employee_worksites")
      .update({ is_primary: false })
      .eq("employee_id", employeeId)
      .eq("is_primary", true);

    if (resetPrimaryResult.error) {
      redirect(toAdminMessage("Khong reset duoc assignment primary cu."));
    }
  }

  const insertResult = await supabase.from("employee_worksites").insert({
    employee_id: employeeId,
    worksite_id: worksiteId,
    start_date: startDate,
    is_primary: isPrimary,
  });

  if (insertResult.error) {
    redirect(toAdminMessage("Gan nhan vien vao cong truong that bai."));
  }

  redirect(toAdminMessage("Gan nhan vien vao cong truong thanh cong."));
}

"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";

import {
  detectAttendanceMode,
  isWithinWorksiteRadius,
} from "@/lib/attendance";
import { createClient } from "@/lib/supabase/server";

function toTodayMessage(message: string) {
  return `/today?message=${encodeURIComponent(message)}`;
}

export async function submitAttendanceAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      toTodayMessage(
        "Chua cau hinh Supabase. Hay them .env.local truoc khi cham cong.",
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+cham+cong");
  }

  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const selfie = formData.get("selfie");

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    redirect(toTodayMessage("Khong lay duoc vi tri GPS. Hay thu lai."));
  }

  if (!(selfie instanceof File) || selfie.size === 0) {
    redirect(toTodayMessage("Can chup hoac chon anh selfie de cham cong."));
  }

  const today = new Date().toISOString().slice(0, 10);

  const assignmentQuery = await supabase
    .from("employee_worksites")
    .select(
      `
        worksite_id,
        worksites (
          id,
          name,
          address,
          latitude,
          longitude,
          allowed_radius_meters
        )
      `,
    )
    .eq("employee_id", user.id)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentQuery.error || !assignmentQuery.data?.worksites) {
    redirect(toTodayMessage("Ban chua duoc gan cong truong de cham cong."));
  }

  const worksite = Array.isArray(assignmentQuery.data.worksites)
    ? assignmentQuery.data.worksites[0]
    : assignmentQuery.data.worksites;

  const radiusCheck = isWithinWorksiteRadius(
    { latitude, longitude },
    worksite,
  );

  if (!radiusCheck.isWithinRadius) {
    redirect(
      toTodayMessage(
        `Ban dang cach cong truong ${radiusCheck.distanceMeters}m, vuot qua ban kinh cho phep ${worksite.allowed_radius_meters}m.`,
      ),
    );
  }

  const existingRecordQuery = await supabase
    .from("attendance_records")
    .select("id, check_in_at, check_out_at")
    .eq("employee_id", user.id)
    .eq("attendance_date", today)
    .maybeSingle();

  if (existingRecordQuery.error) {
    redirect(toTodayMessage("Khong doc duoc ban ghi cham cong hom nay."));
  }

  const mode = detectAttendanceMode(existingRecordQuery.data);

  if (
    mode === "check_in" &&
    existingRecordQuery.data?.check_in_at &&
    existingRecordQuery.data?.check_out_at
  ) {
    redirect(
      toTodayMessage("Hom nay ban da check-in va check-out day du roi."),
    );
  }

  const fileExt = selfie.name.split(".").pop() || "jpg";
  const fileName = `${user.id}/${today}/${mode}-${randomUUID()}.${fileExt}`;

  const uploadResult = await supabase.storage
    .from("attendance-selfies")
    .upload(fileName, selfie, {
      cacheControl: "3600",
      upsert: false,
      contentType: selfie.type || "image/jpeg",
    });

  if (uploadResult.error) {
    redirect(
      toTodayMessage(
        "Tai anh selfie that bai. Hay tao bucket attendance-selfies trong Supabase Storage.",
      ),
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("attendance-selfies")
    .getPublicUrl(fileName);

  const nowIso = new Date().toISOString();

  if (mode === "check_in") {
    const upsertResult = await supabase.from("attendance_records").upsert(
      {
        employee_id: user.id,
        worksite_id: worksite.id,
        attendance_date: today,
        check_in_at: nowIso,
        check_in_latitude: latitude,
        check_in_longitude: longitude,
        check_in_distance_meters: radiusCheck.distanceMeters,
        check_in_selfie_url: publicUrlData.publicUrl,
        status: "present",
      },
      {
        onConflict: "employee_id,attendance_date",
      },
    );

    if (upsertResult.error) {
      redirect(toTodayMessage("Luu check-in that bai. Hay thu lai."));
    }

    redirect(toTodayMessage("Check-in thanh cong."));
  }

  const updateResult = await supabase
    .from("attendance_records")
    .update({
      check_out_at: nowIso,
      check_out_latitude: latitude,
      check_out_longitude: longitude,
      check_out_distance_meters: radiusCheck.distanceMeters,
      check_out_selfie_url: publicUrlData.publicUrl,
      status: "present",
    })
    .eq("id", existingRecordQuery.data?.id ?? "");

  if (updateResult.error) {
    redirect(toTodayMessage("Luu check-out that bai. Hay thu lai."));
  }

  redirect(toTodayMessage("Check-out thanh cong."));
}

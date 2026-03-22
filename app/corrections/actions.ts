"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function toCorrectionsMessage(message: string) {
  return `/corrections?message=${encodeURIComponent(message)}`;
}

function toApprovalsMessage(message: string) {
  return `/correction-approvals?message=${encodeURIComponent(message)}`;
}

export async function submitCorrectionRequestAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      toCorrectionsMessage(
        "Chua cau hinh Supabase. Hay tao .env.local truoc khi gui yeu cau chinh cong.",
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+gui+yeu+cau");
  }

  const attendanceRecordId = String(formData.get("attendance_record_id") ?? "").trim();
  const requestType = String(formData.get("request_type") ?? "").trim();
  const requestedValue = String(formData.get("requested_value") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!attendanceRecordId || !requestType || !reason) {
    redirect(toCorrectionsMessage("Hay nhap day du thong tin yeu cau chinh cong."));
  }

  const recordResult = await supabase
    .from("attendance_records")
    .select("id")
    .eq("id", attendanceRecordId)
    .eq("employee_id", user.id)
    .maybeSingle();

  if (recordResult.error || !recordResult.data) {
    redirect(toCorrectionsMessage("Ban ghi cham cong khong hop le."));
  }

  const duplicatePendingQuery = await supabase
    .from("correction_requests")
    .select("id")
    .eq("employee_id", user.id)
    .eq("attendance_record_id", attendanceRecordId)
    .eq("request_type", requestType)
    .eq("status", "pending")
    .limit(1);

  if (duplicatePendingQuery.error) {
    redirect(toCorrectionsMessage("Khong the kiem tra yeu cau trung. Hay thu lai."));
  }

  if ((duplicatePendingQuery.data?.length ?? 0) > 0) {
    redirect(
      toCorrectionsMessage(
        "Da co yeu cau chinh cong cung loai dang pending cho ban ghi nay.",
      ),
    );
  }

  const insertResult = await supabase.from("correction_requests").insert({
    employee_id: user.id,
    attendance_record_id: attendanceRecordId,
    request_type: requestType,
    requested_value: requestedValue ? { requested_value: requestedValue } : null,
    reason,
  });

  if (insertResult.error) {
    redirect(toCorrectionsMessage("Gui yeu cau chinh cong that bai. Hay thu lai."));
  }

  redirect(toCorrectionsMessage("Gui yeu cau chinh cong thanh cong."));
}

export async function reviewCorrectionRequestAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(toApprovalsMessage("Supabase chua duoc cau hinh."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+duyet+yeu+cau");
  }

  const requestId = String(formData.get("request_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reviewNote = String(formData.get("review_note") ?? "").trim();

  if (!requestId || !["approved", "rejected"].includes(decision)) {
    redirect(toApprovalsMessage("Du lieu duyet chinh cong khong hop le."));
  }

  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileResult.error ||
    !profileResult.data ||
    !["manager", "admin"].includes(profileResult.data.role)
  ) {
    redirect("/dashboard?message=Ban+khong+co+quyen+duyet+don");
  }

  const updateResult = await supabase
    .from("correction_requests")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote || null,
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateResult.error) {
    redirect(toApprovalsMessage("Cap nhat trang thai yeu cau chinh cong that bai."));
  }

  if (!updateResult.data) {
    redirect(
      toApprovalsMessage("Yeu cau chinh cong da duoc duyet truoc do hoac khong ton tai."),
    );
  }

  const logResult = await supabase.from("approval_logs").insert({
    entity_type: "correction_request",
    entity_id: requestId,
    action: decision,
    actor_id: user.id,
    note: reviewNote || null,
  });

  if (logResult.error) {
    redirect(
      toApprovalsMessage(
        "Yeu cau da duoc cap nhat nhung ghi log approval bi loi. Kiem tra lai RLS.",
      ),
    );
  }

  redirect(
    toApprovalsMessage(
      decision === "approved"
        ? "Da duyet yeu cau chinh cong."
        : "Da tu choi yeu cau chinh cong.",
    ),
  );
}

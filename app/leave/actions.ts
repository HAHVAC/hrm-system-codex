"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function toLeaveMessage(message: string) {
  return `/leave?message=${encodeURIComponent(message)}`;
}

function toApprovalsMessage(message: string) {
  return `/leave-approvals?message=${encodeURIComponent(message)}`;
}

export async function submitLeaveRequestAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      toLeaveMessage(
        "Chua cau hinh Supabase. Hay tao .env.local truoc khi gui don nghi.",
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+gui+don");
  }

  const leaveType = String(formData.get("leave_type") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!leaveType || !startDate || !endDate || !reason) {
    redirect(toLeaveMessage("Hay nhap day du thong tin don nghi."));
  }

  if (startDate > endDate) {
    redirect(toLeaveMessage("Ngay bat dau khong duoc sau ngay ket thuc."));
  }

  const insertResult = await supabase.from("leave_requests").insert({
    employee_id: user.id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    reason,
  });

  if (insertResult.error) {
    redirect(toLeaveMessage("Gui don nghi that bai. Hay thu lai."));
  }

  redirect(toLeaveMessage("Gui don nghi thanh cong."));
}

export async function reviewLeaveRequestAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(toApprovalsMessage("Supabase chua duoc cau hinh."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+duyet+don");
  }

  const requestId = String(formData.get("request_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reviewNote = String(formData.get("review_note") ?? "").trim();

  if (!requestId || !["approved", "rejected"].includes(decision)) {
    redirect(toApprovalsMessage("Du lieu duyet don khong hop le."));
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
    .from("leave_requests")
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote || null,
    })
    .eq("id", requestId);

  if (updateResult.error) {
    redirect(toApprovalsMessage("Cap nhat trang thai don nghi that bai."));
  }

  const logResult = await supabase.from("approval_logs").insert({
    entity_type: "leave_request",
    entity_id: requestId,
    action: decision,
    actor_id: user.id,
    note: reviewNote || null,
  });

  if (logResult.error) {
    redirect(
      toApprovalsMessage(
        "Don da duoc cap nhat nhung ghi log approval bi loi. Kiem tra lai RLS.",
      ),
    );
  }

  redirect(
    toApprovalsMessage(
      decision === "approved" ? "Da duyet don nghi." : "Da tu choi don nghi.",
    ),
  );
}

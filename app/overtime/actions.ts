"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function toOvertimeMessage(message: string) {
  return `/overtime?message=${encodeURIComponent(message)}`;
}

function toApprovalsMessage(message: string) {
  return `/overtime-approvals?message=${encodeURIComponent(message)}`;
}

function buildIsoTimestamp(date: string, time: string) {
  return `${date}T${time}:00`;
}

function computeHours(startDateTime: Date, endDateTime: Date) {
  return Number(
    ((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)).toFixed(
      2,
    ),
  );
}

export async function submitOvertimeRequestAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      toOvertimeMessage(
        "Chua cau hinh Supabase. Hay tao .env.local truoc khi gui don tang ca.",
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+gui+don+tang+ca");
  }

  const requestDate = String(formData.get("request_date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!requestDate || !startTime || !endTime || !reason) {
    redirect(toOvertimeMessage("Hay nhap day du thong tin don tang ca."));
  }

  const startIso = buildIsoTimestamp(requestDate, startTime);
  const endIso = buildIsoTimestamp(requestDate, endTime);
  const startDateTime = new Date(startIso);
  const endDateTime = new Date(endIso);

  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    redirect(toOvertimeMessage("Thoi gian tang ca khong hop le."));
  }

  if (endDateTime <= startDateTime) {
    redirect(toOvertimeMessage("Gio ket thuc phai sau gio bat dau."));
  }

  const totalHours = computeHours(startDateTime, endDateTime);

  const assignmentQuery = await supabase
    .from("employee_worksites")
    .select("worksite_id")
    .eq("employee_id", user.id)
    .or(`end_date.is.null,end_date.gte.${requestDate}`)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentQuery.error || !assignmentQuery.data?.worksite_id) {
    redirect(toOvertimeMessage("Ban chua duoc gan cong truong de xin tang ca."));
  }

  const overlapQuery = await supabase
    .from("overtime_requests")
    .select("id")
    .eq("employee_id", user.id)
    .eq("request_date", requestDate)
    .in("status", ["pending", "approved"])
    .lt("start_time", endIso)
    .gt("end_time", startIso)
    .limit(1);

  if (overlapQuery.error) {
    redirect(toOvertimeMessage("Khong the kiem tra don tang ca trung gio. Hay thu lai."));
  }

  if ((overlapQuery.data?.length ?? 0) > 0) {
    redirect(toOvertimeMessage("Da ton tai don tang ca trung khung gio (pending/approved)."));
  }

  const insertResult = await supabase.from("overtime_requests").insert({
    employee_id: user.id,
    worksite_id: assignmentQuery.data.worksite_id,
    request_date: requestDate,
    start_time: startIso,
    end_time: endIso,
    total_hours: totalHours,
    reason,
  });

  if (insertResult.error) {
    redirect(toOvertimeMessage("Gui don tang ca that bai. Hay thu lai."));
  }

  redirect(toOvertimeMessage("Gui don tang ca thanh cong."));
}

export async function reviewOvertimeRequestAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(toApprovalsMessage("Supabase chua duoc cau hinh."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Hay+dang+nhap+truoc+khi+duyet+don+tang+ca");
  }

  const requestId = String(formData.get("request_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reviewNote = String(formData.get("review_note") ?? "").trim();

  if (!requestId || !["approved", "rejected"].includes(decision)) {
    redirect(toApprovalsMessage("Du lieu duyet don tang ca khong hop le."));
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
    .from("overtime_requests")
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
    redirect(toApprovalsMessage("Cap nhat trang thai don tang ca that bai."));
  }

  if (!updateResult.data) {
    redirect(
      toApprovalsMessage("Don tang ca da duoc duyet truoc do hoac khong ton tai."),
    );
  }

  const logResult = await supabase.from("approval_logs").insert({
    entity_type: "overtime_request",
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
      decision === "approved" ? "Da duyet don tang ca." : "Da tu choi don tang ca.",
    ),
  );
}

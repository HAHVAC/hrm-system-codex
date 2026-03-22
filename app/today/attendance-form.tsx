"use client";

import { useMemo, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";

import { submitAttendanceAction } from "./actions";

type AttendanceFormProps = {
  canSubmit: boolean;
  expectedActionLabel: string;
};

type LocationState = {
  latitude: number | null;
  longitude: number | null;
  status: "idle" | "loading" | "ready" | "error";
  message: string;
};

export function AttendanceForm({
  canSubmit,
  expectedActionLabel,
}: AttendanceFormProps) {
  const [location, setLocation] = useState<LocationState>(() => {
    if (typeof navigator !== "undefined" && !("geolocation" in navigator)) {
      return {
        latitude: null,
        longitude: null,
        status: "error",
        message: "Trinh duyet nay khong ho tro GPS.",
      };
    }

    return {
      latitude: null,
      longitude: null,
      status: "idle",
      message: "Nhan 'Lay GPS hien tai' de xac minh vi tri.",
    };
  });
  const [selfieReady, setSelfieReady] = useState(false);

  const canSubmitForm = useMemo(() => {
    return (
      canSubmit &&
      location.status === "ready" &&
      location.latitude !== null &&
      location.longitude !== null &&
      selfieReady
    );
  }, [canSubmit, location, selfieReady]);

  function handleGetLocation() {
    if (!("geolocation" in navigator)) {
      return;
    }

    setLocation({
      latitude: null,
      longitude: null,
      status: "loading",
      message: "Dang lay vi tri GPS...",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          status: "ready",
          message: `Da lay GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        });
      },
      () => {
        setLocation({
          latitude: null,
          longitude: null,
          status: "error",
          message: "Khong lay duoc GPS. Hay cap quyen vi tri va thu lai.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  return (
    <form action={submitAttendanceAction} className="space-y-5">
      <input name="latitude" type="hidden" value={location.latitude ?? ""} />
      <input name="longitude" type="hidden" value={location.longitude ?? ""} />

      <div className="rounded-[1.4rem] border border-line bg-[#faf7f0] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              GPS
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">{location.message}</p>
          </div>
          <button
            type="button"
            onClick={handleGetLocation}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Lay GPS hien tai
          </button>
        </div>
      </div>

      <label className="block rounded-[1.4rem] border border-line bg-[#faf7f0] p-5">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Selfie
        </span>
        <p className="mt-2 text-sm leading-7 text-muted">
          Dung camera truoc tren dien thoai neu co. Anh nay duoc dung lam bang
          chung check-in/check-out.
        </p>
        <input
          name="selfie"
          type="file"
          accept="image/*"
          capture="user"
          required
          className="mt-4 block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-semibold file:text-white"
          onChange={(event) => setSelfieReady(Boolean(event.target.files?.[0]))}
        />
      </label>

      <SubmitButton
        disabled={!canSubmitForm}
        label={expectedActionLabel}
        pendingLabel="Dang gui cham cong..."
        className="w-full rounded-full bg-accent px-5 py-3 font-semibold text-white transition enabled:hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-accent/40"
      />

      {!canSubmit ? (
        <p className="text-sm leading-7 text-alert">
          Khong the cham cong luc nay. Ban can duoc gan vao mot cong truong dang
          hoat dong.
        </p>
      ) : (
        <p className="text-sm leading-7 text-muted">
          Nut se sang len khi da co GPS hop le va anh selfie.
        </p>
      )}
    </form>
  );
}

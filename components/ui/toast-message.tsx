"use client";

import { useEffect, useState } from "react";

type ToastMessageProps = {
  message: string;
};

function isErrorMessage(message: string) {
  return /(that bai|khong the|khong hop le|khong co quyen|chua cau hinh|loi)/i.test(
    message,
  );
}

export function ToastMessage({ message }: ToastMessageProps) {
  const [visible, setVisible] = useState(true);
  const error = isErrorMessage(message);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(92vw,420px)]">
      <div
        className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_14px_40px_rgba(24,35,15,0.18)] ${
          error
            ? "border-alert/40 bg-[#fff2eb] text-alert"
            : "border-accent/35 bg-[#f6f1e5] text-foreground"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm leading-6">{message}</p>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-full border border-current/20 px-2 py-1 text-xs"
          >
            Dong
          </button>
        </div>
      </div>
    </div>
  );
}

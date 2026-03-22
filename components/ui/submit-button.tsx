"use client";

import clsx from "clsx";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  className?: string;
  disabled?: boolean;
  label: string;
  name?: string;
  pendingLabel?: string;
  value?: string;
};

export function SubmitButton({
  className,
  disabled = false,
  label,
  name,
  pendingLabel = "Dang xu ly...",
  value,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={isDisabled}
      className={clsx(className, isDisabled && "cursor-not-allowed opacity-70")}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

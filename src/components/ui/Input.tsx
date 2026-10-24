import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cx } from "./styles.ts";
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft ${className}`}
      {...props}
    />
  );
});

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    revealLabel?: string;
  }
>(function PasswordInput(
  {
    className,
    revealLabel = "password",
    autoComplete = "current-password",
    ...props
  },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        className={cx("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-neutral-400 transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
        aria-label={`${visible ? "Hide" : "Show"} ${revealLabel}`}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

export const PinInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode">
>(function PinInput(props, ref) {
  return (
    <PasswordInput
      ref={ref}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
      revealLabel="PIN"
      {...props}
    />
  );
});

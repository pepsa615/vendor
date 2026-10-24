import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { controlSizes, cx, focusRing, type UiSize } from "./styles.ts";
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
const variants: Record<ButtonVariant, string> = {
  primary:
    "border-brand-600 bg-brand-600 text-white shadow-sm hover:bg-brand-700",
  secondary:
    "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800",
  outline:
    "border-border bg-panel text-foreground hover:border-neutral-400 hover:bg-neutral-50",
  ghost:
    "border-transparent bg-transparent text-foreground hover:bg-neutral-100",
  danger: "border-danger-600 bg-danger-600 text-white hover:bg-danger-700",
};
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: UiSize;
  loading?: boolean;
  iconOnly?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      iconOnly = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cx(
          "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition disabled:pointer-events-none disabled:opacity-50",
          focusRing,
          controlSizes[size],
          variants[variant],
          iconOnly && "aspect-square px-0",
          className,
        )}
        {...props}
      >
        {loading && (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        )}
        {children}
      </button>
    );
  },
);

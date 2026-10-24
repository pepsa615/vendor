import type { ReactNode } from "react";
import { cx, toneStyles, type UiSize, type UiTone } from "./styles.ts";
const sizes: Record<UiSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};
export function Badge({
  children,
  tone = "brand",
  size = "md",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: UiTone;
  size?: UiSize;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-md border font-semibold",
        toneStyles[tone],
        sizes[size],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

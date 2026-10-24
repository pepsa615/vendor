import type { ReactNode } from "react";
import { cx, toneStyles, type UiSize, type UiTone } from "./styles.ts";
const sizes: Record<UiSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};
export function Pill({
  children,
  tone = "neutral",
  size = "md",
  className,
}: {
  children: ReactNode;
  tone?: UiTone;
  size?: UiSize;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border font-medium",
        toneStyles[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

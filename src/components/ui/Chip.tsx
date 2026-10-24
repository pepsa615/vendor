import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cx, focusRing, type UiSize } from "./styles.ts";
const sizes: Record<UiSize, string> = {
  sm: "min-h-7 px-2 text-xs",
  md: "min-h-8 px-2.5 text-sm",
  lg: "min-h-10 px-3 text-base",
};
export function Chip({
  children,
  size = "md",
  selected = false,
  onRemove,
  className,
}: {
  children: ReactNode;
  size?: UiSize;
  selected?: boolean;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        selected
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-border bg-panel text-neutral-700",
        sizes[size],
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          className={cx("rounded-full p-0.5 hover:bg-black/5", focusRing)}
          onClick={onRemove}
          aria-label={`Remove ${String(children)}`}
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}

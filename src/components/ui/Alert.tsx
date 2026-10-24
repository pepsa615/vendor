import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { cx, toneStyles, type UiTone } from "./styles.ts";
const icons = {
  brand: Info,
  neutral: Info,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};
export function Alert({
  title,
  children,
  tone = "info",
  onDismiss,
  className,
}: {
  title?: string;
  children: ReactNode;
  tone?: UiTone;
  onDismiss?: () => void;
  className?: string;
}) {
  const Glyph = icons[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "flex gap-3 rounded-xl border p-4",
        toneStyles[tone],
        className,
      )}
    >
      <Glyph className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cx("text-sm", title && "mt-1")}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="self-start rounded p-1 hover:bg-black/5"
          aria-label="Dismiss alert"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

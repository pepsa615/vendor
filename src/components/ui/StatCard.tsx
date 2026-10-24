import type { ReactNode } from "react";
import { Card } from "./Card.tsx";
import { cx, type UiTone } from "./styles.ts";

const accents: Record<UiTone, string> = {
  brand: "before:bg-brand",
  neutral: "before:bg-neutral-400",
  success: "before:bg-success-600",
  warning: "before:bg-warning-700",
  danger: "before:bg-danger-600",
  info: "before:bg-info-700",
};

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "brand",
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  tone?: UiTone;
  className?: string;
}) {
  return (
    <Card
      className={cx(
        "relative min-h-24 overflow-hidden p-4 before:absolute before:inset-y-0 before:left-0 before:w-1",
        accents[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
          {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
        </div>
        {icon && (
          <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cx } from "./styles.ts";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid min-h-48 place-items-center px-6 py-10 text-center",
        className,
      )}
    >
      <div className="max-w-sm">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-50 text-brand">
          {icon ?? <Inbox className="size-5" />}
        </span>
        <h3 className="mt-3 text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

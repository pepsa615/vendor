import type { ReactNode } from "react";
import { cx } from "./styles.ts";
export function ButtonGroup({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        "inline-flex [&>*]:rounded-none [&>*:first-child]:rounded-l-lg [&>*:last-child]:rounded-r-lg [&>*+*]:-ml-px",
        className,
      )}
    >
      {children}
    </div>
  );
}

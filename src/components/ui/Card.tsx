import type { HTMLAttributes, ReactNode } from "react";
import { cx, type UiSize } from "./styles.ts";
const padding: Record<UiSize, string> = { sm: "p-4", md: "p-5", lg: "p-7" };
export function Card({
  children,
  size = "md",
  interactive = false,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  size?: UiSize;
  interactive?: boolean;
}) {
  return (
    <section
      className={cx(
        "rounded-xl border border-border bg-panel shadow-card",
        padding[size],
        interactive &&
          "transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
export function CardHeader({
  children,
  className,
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("mb-4 flex items-start justify-between gap-4", className)}
    >
      {children}
    </div>
  );
}
export function CardTitle({
  children,
  className,
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cx("font-semibold text-foreground", className)}>
      {children}
    </h3>
  );
}

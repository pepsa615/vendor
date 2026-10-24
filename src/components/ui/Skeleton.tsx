import type { HTMLAttributes } from "react";
import { cx } from "./styles.ts";
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-md bg-neutral-200 motion-reduce:animate-none",
        className,
      )}
      aria-hidden
      {...props}
    />
  );
}
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading content">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cx("h-3", index === lines - 1 && "w-2/3")}
        />
      ))}
    </div>
  );
}

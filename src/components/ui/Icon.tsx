import { LoaderCircle, type LucideIcon } from "lucide-react";
import { cx, type UiSize } from "./styles.ts";
const sizes: Record<UiSize, string> = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-6",
};
export function Icon({
  icon: Glyph,
  label,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  label?: string;
  size?: UiSize;
  className?: string;
}) {
  return (
    <Glyph
      className={cx(sizes[size], className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  );
}
export function IconLoader({
  label = "Loading",
  size = "md",
  className,
}: {
  label?: string;
  size?: UiSize;
  className?: string;
}) {
  return (
    <span role="status" aria-label={label}>
      <LoaderCircle
        className={cx(
          "animate-spin motion-reduce:animate-none",
          sizes[size],
          className,
        )}
        aria-hidden
      />
    </span>
  );
}

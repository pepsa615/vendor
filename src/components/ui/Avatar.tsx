import { UserRound } from "lucide-react";
import { useState } from "react";
import { cx, type UiSize } from "./styles.ts";
const sizes: Record<UiSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};
export function Avatar({
  src,
  alt,
  name,
  size = "md",
  status,
  className,
}: {
  src?: string;
  alt?: string;
  name?: string;
  size?: UiSize;
  status?: "online" | "offline" | "busy";
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(src && failedSrc === src);
  const initials = name
    ?.split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={cx(
        "relative inline-grid shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700",
        sizes[size],
        className,
      )}
    >
      {src && !failed ? (
        <img
          key={src}
          src={src}
          alt={alt ?? name ?? ""}
          className="size-full rounded-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initials || <UserRound className="size-1/2" aria-hidden />
      )}
      {status && (
        <span
          className={cx(
            "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white",
            status === "online"
              ? "bg-success-600"
              : status === "busy"
                ? "bg-danger-600"
                : "bg-neutral-400",
          )}
        >
          <span className="sr-only">{status}</span>
        </span>
      )}
    </span>
  );
}

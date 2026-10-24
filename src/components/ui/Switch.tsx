import { Switch as AriaSwitch, type SwitchProps } from "react-aria-components";
import type { ReactNode } from "react";
import { cx, type UiSize } from "./styles.ts";
const track: Record<UiSize, string> = {
  sm: "h-5 w-9",
  md: "h-6 w-11",
  lg: "h-7 w-13",
};
const thumb: Record<UiSize, string> = {
  sm: "size-4 group-data-[selected]:translate-x-4",
  md: "size-5 group-data-[selected]:translate-x-5",
  lg: "size-6 group-data-[selected]:translate-x-6",
};
export function Switch({
  size = "md",
  className,
  children,
  ...props
}: Omit<SwitchProps, "children"> & { size?: UiSize; children?: ReactNode }) {
  return (
    <AriaSwitch
      className={cx(
        "group inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      <span
        className={cx(
          "flex shrink-0 items-center rounded-full bg-neutral-300 p-0.5 transition group-data-[selected]:bg-brand-600 group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-brand-500 group-data-[focus-visible]:ring-offset-2",
          track[size],
        )}
      >
        <span
          className={cx(
            "rounded-full bg-white shadow-sm transition",
            thumb[size],
          )}
        />
      </span>
      {children}
    </AriaSwitch>
  );
}

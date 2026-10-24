import { Check, Minus } from "lucide-react";
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps,
} from "react-aria-components";
import { cx, type UiSize } from "./styles.ts";
const sizes: Record<UiSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};
export function Checkbox({
  size = "md",
  className,
  children,
  ...props
}: CheckboxProps & { size?: UiSize }) {
  return (
    <AriaCheckbox
      className={cx(
        "group inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      {({ isSelected, isIndeterminate }) => (
        <>
          <span
            className={cx(
              "grid place-items-center rounded border border-neutral-400 bg-panel text-white group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-brand-500 group-data-[selected]:border-brand-600 group-data-[selected]:bg-brand-600 group-data-[indeterminate]:border-brand-600 group-data-[indeterminate]:bg-brand-600",
              sizes[size],
            )}
          >
            {isIndeterminate ? (
              <Minus className="size-3/4" />
            ) : isSelected ? (
              <Check className="size-3/4" />
            ) : null}
          </span>
          {children}
        </>
      )}
    </AriaCheckbox>
  );
}

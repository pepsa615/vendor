import { Check } from "lucide-react";
import {
  ListBox as AriaListBox,
  ListBoxItem,
  type ListBoxProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx, type UiSize } from "./styles.ts";
export interface ListBoxOption {
  key: string | number;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
}
const sizes: Record<UiSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};
export function ListBox({
  options,
  size = "md",
  className,
  ...props
}: Omit<ListBoxProps<ListBoxOption>, "children" | "items"> & {
  options: ListBoxOption[];
  size?: UiSize;
}) {
  return (
    <AriaListBox
      items={options}
      className={cx(
        "max-h-72 overflow-auto rounded-xl border border-border bg-panel p-1 outline-none",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      {(item) => (
        <ListBoxItem
          id={item.key}
          textValue={String(item.label)}
          isDisabled={item.disabled}
          className={({ isFocused, isSelected }) =>
            cx(
              "group flex cursor-default items-center justify-between gap-3 rounded-lg outline-none",
              sizes[size],
              isFocused && "bg-neutral-100",
              isSelected && "bg-brand-50 text-brand-700",
              item.disabled && "opacity-50",
            )
          }
        >
          <span>
            <span className="block font-medium">{item.label}</span>
            {item.description && (
              <span className="block text-xs text-muted">
                {item.description}
              </span>
            )}
          </span>
          <Check className="hidden size-4 group-data-[selected]:block" />
        </ListBoxItem>
      )}
    </AriaListBox>
  );
}

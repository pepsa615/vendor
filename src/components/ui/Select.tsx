import { Check, ChevronDown } from "lucide-react";
import {
  Select as AriaSelect,
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  SelectValue,
  type SelectProps,
} from "react-aria-components";
import { controlSizes, cx, focusRing, type UiSize } from "./styles.ts";
export interface SelectOption {
  key: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}
export function Select({
  label,
  options,
  size = "md",
  placeholder = "Select an option",
  className,
  ...props
}: Omit<SelectProps<SelectOption>, "children"> & {
  label: string;
  options: SelectOption[];
  size?: UiSize;
  placeholder?: string;
}) {
  return (
    <AriaSelect
      className={cx(
        "group grid gap-1.5",
        typeof className === "string" ? className : undefined,
      )}
      placeholder={placeholder}
      {...props}
    >
      <Label className="text-sm font-medium">{label}</Label>
      <Button
        className={cx(
          "flex w-full items-center justify-between rounded-lg border border-border bg-panel text-left",
          controlSizes[size],
          focusRing,
        )}
      >
        <SelectValue className="truncate data-[placeholder]:text-neutral-400" />
        <ChevronDown className="size-4 text-muted" />
      </Button>
      <Popover className="z-50 w-[var(--trigger-width)] rounded-xl border border-border bg-panel p-1 shadow-overlay">
        <ListBox
          items={options}
          className="max-h-72 overflow-auto outline-none"
        >
          {(item) => (
            <ListBoxItem
              id={item.key}
              textValue={item.label}
              isDisabled={item.disabled}
              className={({ isFocused, isSelected }) =>
                cx(
                  "group flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm outline-none",
                  isFocused && "bg-neutral-100",
                  isSelected && "text-brand-700",
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
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

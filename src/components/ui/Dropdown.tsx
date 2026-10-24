import { Check, ChevronDown } from "lucide-react";
import {
  Button as AriaButton,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import type { ReactNode } from "react";
import { controlSizes, cx, focusRing, type UiSize } from "./styles.ts";
export interface DropdownItem {
  key: string | number;
  label: ReactNode;
  description?: string;
  danger?: boolean;
  tone?: "neutral" | "brand" | "info" | "success" | "warning" | "danger";
  disabled?: boolean;
}
export function Dropdown({
  label,
  items,
  onAction,
  size = "md",
  align = "start",
}: {
  label: ReactNode;
  items: DropdownItem[];
  onAction?: (key: string | number) => void;
  size?: UiSize;
  align?: "start" | "end";
}) {
  return (
    <MenuTrigger>
      <AriaButton
        className={cx(
          "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-panel font-semibold text-foreground shadow-sm transition hover:bg-neutral-50",
          controlSizes[size],
          focusRing,
        )}
      >
        {label}
        <ChevronDown className="size-4" />
      </AriaButton>
      <Popover
        placement={align === "end" ? "bottom end" : "bottom start"}
        className="z-50 min-w-48 rounded-xl border border-border bg-panel p-1 shadow-overlay data-[entering]:animate-in data-[exiting]:animate-out"
      >
        <Menu items={items} onAction={onAction} className="outline-none">
          {(item) => (
            <MenuItem
              id={item.key}
              isDisabled={item.disabled}
              textValue={String(item.label)}
              className={({ isFocused }) =>
                cx(
                  "group flex cursor-default items-center justify-between gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm outline-none",
                  isFocused && "bg-neutral-100",
                  (item.danger || item.tone === "danger") &&
                    "border-l-danger-500 text-danger-700",
                  item.tone === "brand" && "border-l-brand text-brand",
                  item.tone === "info" && "border-l-info-500 text-info-700",
                  item.tone === "success" &&
                    "border-l-success-500 text-success-700",
                  item.tone === "warning" &&
                    "border-l-warning-500 text-warning-700",
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
            </MenuItem>
          )}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

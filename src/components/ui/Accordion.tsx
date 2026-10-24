import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./styles.ts";
export interface AccordionItem {
  key: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}
export function Accordion({
  items,
  multiple = false,
  className,
}: {
  items: AccordionItem[];
  multiple?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "divide-y divide-border overflow-hidden rounded-xl border border-border bg-panel",
        className,
      )}
    >
      {items.map((item) => (
        <details
          key={item.key}
          name={multiple ? undefined : "accordion"}
          className="group"
          data-disabled={item.disabled || undefined}
        >
          <summary
            className={cx(
              "flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500",
              item.disabled && "pointer-events-none opacity-50",
            )}
          >
            <span>{item.title}</span>
            <ChevronDown
              className="size-4 transition group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="px-4 pb-4 text-sm text-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}

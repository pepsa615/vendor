import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Button,
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  type CalendarProps,
  Text,
} from "react-aria-components";
import type { DateValue } from "@internationalized/date";
import { cx } from "./styles.ts";
export function Calendar<T extends DateValue>({
  className,
  ...props
}: CalendarProps<T>) {
  return (
    <AriaCalendar
      className={cx(
        "w-fit rounded-xl border border-border bg-panel p-4 shadow-card",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      <header className="mb-3 flex items-center justify-between">
        <Button
          slot="previous"
          className="rounded-lg p-2 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <Heading className="text-sm font-semibold" />
        <Button
          slot="next"
          className="rounded-lg p-2 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </header>
      <CalendarGrid className="border-separate border-spacing-1">
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className="size-9 text-xs font-medium text-muted">
              {day}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className={({
                isSelected,
                isOutsideMonth,
                isDisabled,
                isUnavailable,
                isFocusVisible,
              }) =>
                cx(
                  "grid size-9 cursor-default place-items-center rounded-lg text-sm outline-none hover:bg-neutral-100",
                  isSelected &&
                    "bg-brand-600 font-semibold text-white hover:bg-brand-700",
                  isOutsideMonth && "text-neutral-300",
                  (isDisabled || isUnavailable) && "line-through opacity-40",
                  isFocusVisible && "ring-2 ring-brand-500 ring-offset-1",
                )
              }
            />
          )}
        </CalendarGridBody>
      </CalendarGrid>
      <Text slot="errorMessage" className="mt-2 text-xs text-danger-700" />
    </AriaCalendar>
  );
}

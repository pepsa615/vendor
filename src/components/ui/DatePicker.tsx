import { CalendarDays } from "lucide-react";
import {
  Button,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  Group,
  Label,
  Popover,
  Text,
  type DatePickerProps,
} from "react-aria-components";
import type { DateValue } from "@internationalized/date";
import { Calendar } from "./Calendar.tsx";
import { cx, type UiSize } from "./styles.ts";
const sizes: Record<UiSize, string> = {
  sm: "min-h-8 pl-2.5 text-xs",
  md: "min-h-10 pl-3.5 text-sm",
  lg: "min-h-12 pl-4 text-base",
};
export function DatePicker<T extends DateValue>({
  label,
  size = "md",
  description,
  errorMessage,
  className,
  ...props
}: DatePickerProps<T> & {
  label: string;
  size?: UiSize;
  description?: string;
  errorMessage?: string;
}) {
  return (
    <AriaDatePicker
      className={cx(
        "grid gap-1.5",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      <Label className="text-sm font-medium">{label}</Label>
      <Group
        className={cx(
          "flex items-center rounded-lg border border-border bg-panel focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100",
          sizes[size],
        )}
      >
        <DateInput className="flex flex-1 items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded px-0.5 outline-none data-[focused]:bg-brand-100 data-[placeholder]:text-neutral-400"
            />
          )}
        </DateInput>
        <Button
          className="self-stretch border-l border-border px-3 text-muted outline-none hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
          aria-label="Open calendar"
        >
          <CalendarDays className="size-4" />
        </Button>
      </Group>
      {description && (
        <Text slot="description" className="text-xs text-muted">
          {description}
        </Text>
      )}
      <Text slot="errorMessage" className="text-xs text-danger-700">
        {errorMessage}
      </Text>
      <Popover className="z-50">
        <Dialog className="outline-none">
          <Calendar />
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}

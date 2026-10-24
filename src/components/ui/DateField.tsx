import {
  DateField as AriaDateField,
  DateInput,
  DateSegment,
  Label,
  Text,
  type DateFieldProps,
} from "react-aria-components";
import type { DateValue } from "@internationalized/date";
import { cx, type UiSize } from "./styles.ts";
const sizes: Record<UiSize, string> = {
  sm: "min-h-8 px-2.5 text-xs",
  md: "min-h-10 px-3.5 text-sm",
  lg: "min-h-12 px-4 text-base",
};
export function DateField<T extends DateValue>({
  label,
  size = "md",
  description,
  errorMessage,
  className,
  ...props
}: DateFieldProps<T> & {
  label: string;
  size?: UiSize;
  description?: string;
  errorMessage?: string;
}) {
  return (
    <AriaDateField
      className={cx(
        "grid gap-1.5",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      <Label className="text-sm font-medium">{label}</Label>
      <DateInput
        className={cx(
          "flex items-center rounded-lg border border-border bg-panel focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100",
          sizes[size],
        )}
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className="rounded px-0.5 outline-none data-[focused]:bg-brand-100 data-[placeholder]:text-neutral-400"
          />
        )}
      </DateInput>
      {description && (
        <Text slot="description" className="text-xs text-muted">
          {description}
        </Text>
      )}
      <Text slot="errorMessage" className="text-xs text-danger-700">
        {errorMessage}
      </Text>
    </AriaDateField>
  );
}

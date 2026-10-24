import { Radio, RadioGroup, Label } from "react-aria-components";
import { cx } from "./styles.ts";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
}

const countTone = {
  neutral: "text-muted",
  brand: "text-brand",
  success: "text-success-700",
  warning: "text-warning-700",
  danger: "text-danger-700",
};

export function FilterGroup({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <RadioGroup
      value={value}
      onChange={onChange}
      orientation="horizontal"
      className={cx("flex flex-wrap items-center gap-x-5 gap-y-2", className)}
    >
      <Label className="text-sm font-semibold">{label}</Label>
      {options.map((option) => (
        <Radio
          key={option.value || "all"}
          value={option.value}
          className="group flex cursor-pointer items-center gap-2 text-sm outline-none"
        >
          <span className="size-4 rounded-full border border-neutral-400 bg-panel p-[3px] group-data-[selected]:border-brand group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-brand-200">
            <span className="block size-full rounded-full bg-brand opacity-0 group-data-[selected]:opacity-100" />
          </span>
          <span>{option.label}</span>
          {option.count !== undefined && (
            <span className={countTone[option.tone ?? "neutral"]}>
              {option.count.toLocaleString()}
            </span>
          )}
        </Radio>
      ))}
    </RadioGroup>
  );
}

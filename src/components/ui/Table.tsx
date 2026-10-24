import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cx, type UiSize } from "./styles.ts";
const cellSizes: Record<UiSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-4 text-base",
};
export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table
        className={cx("w-full border-collapse text-left", className)}
        {...props}
      />
    </div>
  );
}
export function THead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cx("bg-neutral-50 text-muted", className)} {...props} />
  );
}
export function TBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cx("divide-y divide-border bg-panel", className)}
      {...props}
    />
  );
}
export function Tr({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cx("transition hover:bg-neutral-50", className)}
      {...props}
    />
  );
}
export function Th({
  size = "md",
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { size?: UiSize }) {
  return (
    <th
      className={cx(
        "border-b border-border font-semibold",
        cellSizes[size],
        className,
      )}
      {...props}
    />
  );
}
export function Td({
  size = "md",
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { size?: UiSize }) {
  return <td className={cx(cellSizes[size], className)} {...props} />;
}

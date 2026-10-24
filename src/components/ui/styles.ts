export type UiSize = "sm" | "md" | "lg";
export type UiTone =
  | "brand"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";
export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";
export const controlSizes: Record<UiSize, string> = {
  sm: "min-h-8 px-2.5 text-xs",
  md: "min-h-10 px-3.5 text-sm",
  lg: "min-h-12 px-4 text-base",
};
export const toneStyles: Record<UiTone, string> = {
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  neutral: "border-border bg-neutral-100 text-neutral-700",
  success: "border-success-200 bg-success-50 text-success-700",
  warning: "border-warning-200 bg-warning-50 text-warning-700",
  danger: "border-danger-200 bg-danger-50 text-danger-700",
  info: "border-info-200 bg-info-50 text-info-700",
};

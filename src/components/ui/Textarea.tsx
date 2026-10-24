import { forwardRef, type TextareaHTMLAttributes } from "react";
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`min-h-28 w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft ${className}`}
      {...props}
    />
  );
});

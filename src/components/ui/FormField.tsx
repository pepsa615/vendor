import type { ReactNode } from "react";
export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <span className="mt-1 block">{children}</span>
      {error && (
        <span className="mt-1 block text-xs text-red-700" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

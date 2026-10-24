import { FileCheck2, Upload } from "lucide-react";
import {
  forwardRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { cx, focusRing } from "./styles.ts";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function describeFiles(files: FileList | null) {
  if (!files?.length) return null;
  if (files.length === 1) {
    const file = files[0]!;
    return {
      title: file.name,
      detail: formatBytes(file.size),
    };
  }
  const total = Array.from(files).reduce((sum, file) => sum + file.size, 0);
  return {
    title: `${files.length} files selected`,
    detail: formatBytes(total),
  };
}

export const FileInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { helperText?: string }
>(function FileInput(
  {
    className,
    accept = ".jpg,.jpeg,.png,.pdf",
    helperText = "JPG, PNG or PDF",
    onChange,
    ...props
  },
  ref,
) {
  const [selection, setSelection] = useState<{
    title: string;
    detail: string;
  } | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setSelection(describeFiles(event.target.files));
    onChange?.(event);
  }

  return (
    <label
      className={cx(
        "group flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3 text-sm transition",
        selection
          ? "border-brand-300 bg-brand-50 hover:border-brand-400"
          : "border-neutral-300 bg-neutral-50 hover:border-brand-300 hover:bg-brand-50",
        focusRing,
        className,
      )}
    >
      <span
        className={cx(
          "grid size-8 place-items-center rounded-md bg-panel shadow-sm",
          selection ? "text-success-600" : "text-brand",
        )}
      >
        {selection ? (
          <FileCheck2 className="size-4" />
        ) : (
          <Upload className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        {selection ? (
          <>
            <strong className="block truncate font-semibold text-foreground">
              {selection.title}
            </strong>
            <span className="mt-0.5 block text-xs text-muted">
              {selection.detail} · Click to change
            </span>
          </>
        ) : (
          <span className="text-muted">
            <strong className="font-semibold text-foreground">
              Choose file
            </strong>
            <span className="ml-2">{helperText}</span>
          </span>
        )}
      </span>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
        {...props}
      />
    </label>
  );
});

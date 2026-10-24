import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cx, type UiTone } from "./styles.ts";

/* Provider and its hook intentionally share one typed context module. */
/* oxlint-disable react/only-export-components */
interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: Exclude<UiTone, "brand" | "neutral">;
}
interface ToastApi {
  show: (toast: Omit<ToastItem, "id"> & { duration?: number }) => string;
  dismiss: (id: string) => void;
}
const ToastContext = createContext<ToastApi | null>(null);
const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  danger: AlertCircle,
  info: Info,
};
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback(
    (id: string) =>
      setToasts((items) => items.filter((item) => item.id !== id)),
    [],
  );
  const show = useCallback(
    (toast: Omit<ToastItem, "id"> & { duration?: number }) => {
      const id = crypto.randomUUID();
      setToasts((items) => [...items, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.duration ?? 5000);
      return id;
    },
    [dismiss],
  );
  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Glyph = icons[toast.tone];
          return (
            <div
              key={toast.id}
              className={cx(
                "pointer-events-auto flex gap-3 rounded-xl border bg-panel p-4 shadow-overlay",
                toast.tone === "success" && "border-success-200",
                toast.tone === "warning" && "border-warning-200",
                toast.tone === "danger" && "border-danger-200",
                toast.tone === "info" && "border-info-200",
              )}
            >
              <Glyph className="mt-0.5 size-5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs text-muted">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded p-1 hover:bg-neutral-100"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used within ToastProvider");
  return value;
}

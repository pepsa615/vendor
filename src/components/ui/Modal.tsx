import { X } from "lucide-react";
import {
  Button,
  Dialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx, type UiSize } from "./styles.ts";
const widths: Record<UiSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};
const modalWidths = { ...widths, xl: "max-w-5xl" };
export function Modal({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: UiSize | "xl";
  dismissible?: boolean;
}) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={dismissible}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-neutral-950/55 p-4 backdrop-blur-[2px] data-[entering]:animate-in data-[exiting]:animate-out"
    >
      <AriaModal
        className={cx(
          "max-h-[calc(100dvh-2rem)] w-full overflow-hidden rounded-2xl border border-white/20 bg-panel shadow-overlay outline-none",
          modalWidths[size],
        )}
      >
        <Dialog className="flex max-h-[calc(100dvh-2rem)] flex-col outline-none">
          {({ close }) => (
            <>
              <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-panel p-5">
                <div>
                  <Heading slot="title" className="text-lg font-semibold">
                    {title}
                  </Heading>
                  {description && (
                    <p className="mt-1 text-sm text-muted">{description}</p>
                  )}
                </div>
                {dismissible && (
                  <Button
                    onPress={close}
                    className="rounded-lg p-2 text-muted hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label="Close modal"
                  >
                    <X className="size-5" />
                  </Button>
                )}
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                {children}
              </div>
              {footer && (
                <footer className="flex shrink-0 justify-end gap-2 border-t border-border bg-panel p-4">
                  {footer}
                </footer>
              )}
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}

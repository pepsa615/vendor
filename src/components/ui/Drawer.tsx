import { X } from "lucide-react";
import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "./styles.ts";
export function Drawer({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  size = "md",
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: "left" | "right";
  size?: "sm" | "md" | "lg";
}) {
  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" };
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className="fixed inset-0 z-50 bg-neutral-950/50 data-[entering]:animate-in data-[exiting]:animate-out"
    >
      <Modal
        className={cx(
          "fixed inset-y-0 w-full bg-panel shadow-overlay outline-none",
          widths[size],
          side === "right" ? "right-0" : "left-0",
        )}
      >
        <Dialog className="flex h-full flex-col outline-none">
          {({ close }) => (
            <>
              <header className="flex items-start justify-between border-b border-border p-5">
                <div>
                  <Heading slot="title" className="text-lg font-semibold">
                    {title}
                  </Heading>
                  {description && (
                    <p className="mt-1 text-sm text-muted">{description}</p>
                  )}
                </div>
                <Button
                  onPress={close}
                  className="rounded-lg p-2 text-muted hover:bg-neutral-100"
                  aria-label="Close drawer"
                >
                  <X className="size-5" />
                </Button>
              </header>
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

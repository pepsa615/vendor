import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button.tsx";
import { Modal } from "./Modal.tsx";
export function AlertDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  loading = false,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-50 text-danger-700">
          <TriangleAlert className="size-5" />
        </span>
        <div className="text-sm text-muted">
          {children ??
            "This action may affect existing data and cannot always be reversed."}
        </div>
      </div>
    </Modal>
  );
}

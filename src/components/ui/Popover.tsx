import {
  Button,
  Dialog,
  DialogTrigger,
  Popover as AriaPopover,
  type PopoverProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "./styles.ts";
export function Popover({
  trigger,
  children,
  placement = "bottom start",
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  placement?: PopoverProps["placement"];
  className?: string;
}) {
  return (
    <DialogTrigger>
      <Button className="outline-none">{trigger}</Button>
      <AriaPopover
        placement={placement}
        className={cx(
          "z-50 max-w-sm rounded-xl border border-border bg-panel p-4 shadow-overlay outline-none",
          className,
        )}
      >
        <Dialog className="outline-none">{children}</Dialog>
      </AriaPopover>
    </DialogTrigger>
  );
}

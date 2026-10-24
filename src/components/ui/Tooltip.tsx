import {
  Button,
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type TooltipProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "./styles.ts";
export function Tooltip({
  children,
  content,
  placement = "top",
  delay = 500,
}: {
  children: ReactNode;
  content: ReactNode;
  placement?: TooltipProps["placement"];
  delay?: number;
}) {
  return (
    <TooltipTrigger delay={delay}>
      <Button className="outline-none">{children}</Button>
      <AriaTooltip
        placement={placement}
        className={({ isEntering, isExiting }) =>
          cx(
            "z-50 max-w-xs rounded-md bg-neutral-950 px-2.5 py-1.5 text-xs text-white shadow-overlay",
            isEntering && "animate-in",
            isExiting && "animate-out",
          )
        }
      >
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}

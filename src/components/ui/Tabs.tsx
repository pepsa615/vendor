import {
  Tabs as AriaTabs,
  TabList,
  Tab,
  TabPanel,
  type TabsProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx, type UiSize } from "./styles.ts";
export interface TabItem {
  key: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}
const sizes: Record<UiSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};
export function Tabs({
  items,
  size = "md",
  className,
  ...props
}: Omit<TabsProps, "children"> & { items: TabItem[]; size?: UiSize }) {
  return (
    <AriaTabs
      className={typeof className === "string" ? className : undefined}
      {...props}
    >
      <TabList className="flex gap-1 overflow-x-auto border-b border-border">
        {items.map((item) => (
          <Tab
            key={item.key}
            id={item.key}
            isDisabled={item.disabled}
            className={({ isSelected, isFocusVisible }) =>
              cx(
                "-mb-px cursor-pointer border-b-2 font-semibold text-muted outline-none transition hover:text-foreground",
                sizes[size],
                isSelected
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent",
                isFocusVisible && "rounded-t ring-2 ring-brand-500",
              )
            }
          >
            {item.label}
          </Tab>
        ))}
      </TabList>
      {items.map((item) => (
        <TabPanel
          key={item.key}
          id={item.key}
          className="py-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {item.content}
        </TabPanel>
      ))}
    </AriaTabs>
  );
}

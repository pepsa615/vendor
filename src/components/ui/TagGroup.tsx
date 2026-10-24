import { X } from "lucide-react";
import {
  TagGroup as AriaTagGroup,
  TagList,
  Tag,
  Label,
  type TagGroupProps,
} from "react-aria-components";
type TagKey = string | number;
import { cx, type UiSize } from "./styles.ts";
export interface TagItem {
  key: TagKey;
  label: string;
}
const sizes: Record<UiSize, string> = {
  sm: "min-h-7 px-2 text-xs",
  md: "min-h-8 px-2.5 text-sm",
  lg: "min-h-10 px-3 text-base",
};
export function TagGroup({
  label,
  items,
  size = "md",
  onRemove,
  ...props
}: Omit<TagGroupProps, "children"> & {
  label: string;
  items: TagItem[];
  size?: UiSize;
  onRemove?: (keys: Set<TagKey>) => void;
}) {
  return (
    <AriaTagGroup onRemove={onRemove} {...props}>
      <Label className="mb-2 block text-sm font-medium">{label}</Label>
      <TagList items={items} className="flex flex-wrap gap-2">
        {(item) => (
          <Tag
            id={item.key}
            textValue={item.label}
            className={({ isSelected, isFocusVisible }) =>
              cx(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-panel font-medium outline-none",
                sizes[size],
                isSelected && "border-brand-300 bg-brand-50 text-brand-700",
                isFocusVisible && "ring-2 ring-brand-500 ring-offset-2",
              )
            }
          >
            {({ allowsRemoving }) => (
              <>
                {item.label}
                {allowsRemoving && <X className="size-3.5" aria-hidden />}
              </>
            )}
          </Tag>
        )}
      </TagList>
    </AriaTagGroup>
  );
}

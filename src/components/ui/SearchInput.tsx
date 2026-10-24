import { Search, X } from "lucide-react";
import {
  Button,
  Input,
  SearchField,
  type SearchFieldProps,
} from "react-aria-components";
import { controlSizes, cx, focusRing, type UiSize } from "./styles.ts";
export function SearchInput({
  size = "md",
  className,
  placeholder = "Search",
  ...props
}: SearchFieldProps & { size?: UiSize; placeholder?: string }) {
  return (
    <SearchField
      className={cx(
        "group relative",
        typeof className === "string" ? className : undefined,
      )}
      {...props}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <Input
        placeholder={placeholder}
        className={cx(
          "w-full rounded-lg border border-border bg-panel pl-9 pr-9 text-foreground placeholder:text-neutral-400",
          controlSizes[size],
          focusRing,
        )}
      />
      <Button
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded p-1 text-muted hover:bg-neutral-100 group-data-[empty]:hidden group-data-[invalid]:block"
        aria-label="Clear search"
      >
        <X className="size-4" />
      </Button>
    </SearchField>
  );
}

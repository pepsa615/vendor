import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button.tsx";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav className="flex items-center gap-2" aria-label="Pagination">
      <Button
        size="sm"
        variant="ghost"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-xs text-muted">
        Page <strong className="text-foreground">{page}</strong> of {pages}
      </span>
      <Button
        size="sm"
        variant="ghost"
        aria-label="Next page"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

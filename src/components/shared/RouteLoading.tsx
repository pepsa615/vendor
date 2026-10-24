export function RouteLoading() {
  return (
    <div className="grid min-h-64 place-items-center" role="status">
      <span className="animate-pulse text-sm text-muted">
        Loading workspace…
      </span>
    </div>
  );
}

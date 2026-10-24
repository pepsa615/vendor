import { isRouteErrorResponse, useRouteError } from "react-router-dom";
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : "The page could not be loaded.";
  return (
    <main className="grid min-h-64 place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted">{message}</p>
      </div>
    </main>
  );
}

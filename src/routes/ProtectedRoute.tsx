import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../contexts/SessionContext.tsx";
export function ProtectedRoute() {
  const { session, loading } = useSession();
  const location = useLocation();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        Restoring your session…
      </div>
    );
  return session ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
}

import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../contexts/SessionContext.tsx";
export function ApprovedRoute() {
  const { session } = useSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.vendor.status !== "APPROVED")
    return (
      <Navigate
        to={
          session.vendor.status === "IN_PROGRESS" ||
          session.vendor.status === "REJECTED"
            ? "/onboarding/details"
            : "/review-status"
        }
        replace
      />
    );
  return <Outlet />;
}

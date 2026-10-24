import { CircleX, FilePenLine } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/index.ts";
import { useSession } from "../contexts/SessionContext.tsx";
export default function ReviewStatusPage() {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  if (!session) return <Navigate to="/login" replace />;
  if (session.vendor.status === "APPROVED")
    return <Navigate to="/dashboard" replace />;
  const rejected = session.vendor.status === "REJECTED";
  return (
    <main className="grid min-h-screen place-items-center bg-white p-6">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-panel p-7 text-center shadow-soft sm:p-10">
        {rejected ? (
          <FilePenLine className="mx-auto size-20 text-brand" />
        ) : (
          <CircleX className="mx-auto size-20 text-brand" />
        )}
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          {rejected ? "Corrections required" : "Your account is under review"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
          {rejected
            ? "A reviewer requested updates to your application. Open onboarding to review the flagged sections and resubmit."
            : "Activation typically takes up to 12 hours. You will receive an email when the review is complete."}
        </p>
        {rejected && (
          <Button
            className="mt-8 w-full"
            onClick={() => navigate("/onboarding/details")}
          >
            Correct application
          </Button>
        )}
        <Button
          className="mt-4 w-full"
          variant={rejected ? "outline" : "primary"}
          onClick={() => void logout()}
        >
          Logout
        </Button>
      </section>
    </main>
  );
}

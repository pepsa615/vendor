import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.ts";
import { AuthShell, StepProgress } from "../components/shared/AuthShell.tsx";
import { Alert, Button, FormField, Input } from "../components/ui/index.ts";
export default function VerificationPage() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("pepsa-registration-email") ?? "";
  const totalSteps =
    sessionStorage.getItem("pepsa-registration-type") === "COMPANY" ? 5 : 4;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell>
      <StepProgress current={2} total={totalSteps} />
      <h1 className="text-3xl font-bold tracking-tight">Email Verification</h1>
      <p className="mt-2 text-muted">
        Activate your account with the six-digit code sent to{" "}
        {email || "your email"}.
      </p>
      {error && (
        <Alert className="mt-5" tone="danger">
          {error}
        </Alert>
      )}
      {message && (
        <Alert className="mt-5" tone="success">
          {message}
        </Alert>
      )}
      <form
        className="mt-8 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          const code = String(new FormData(event.currentTarget).get("code"));
          try {
            await apiRequest("/auth/verify-email", {
              method: "POST",
              body: JSON.stringify({ email, code }),
            });
            navigate("/login", { replace: true });
          } catch (value) {
            setError(
              (value as { message?: string }).message ?? "Verification failed",
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        <FormField label="Verification Code">
          <Input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="Enter code"
            required
          />
        </FormField>
        <Button className="w-full" loading={loading}>
          Continue
        </Button>
      </form>
      <Button
        variant="ghost"
        className="mt-5 w-full text-sm"
        type="button"
        onClick={async () => {
          await apiRequest("/auth/resend-code", {
            method: "POST",
            body: JSON.stringify({ email }),
          });
          setMessage("A new code has been queued for delivery.");
        }}
      >
        Resend code
      </Button>
    </AuthShell>
  );
}

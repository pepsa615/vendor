import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/shared/AuthShell.tsx";
import {
  Alert,
  Button,
  FormField,
  Input,
  PasswordInput,
} from "../components/ui/index.ts";
import { useSession } from "../contexts/SessionContext.tsx";
export default function LoginPage() {
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell>
      <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">
        Sign in to manage your logistics operation.
      </p>
      {error && (
        <Alert className="mt-5" tone="danger" title="Unable to sign in">
          {error}
        </Alert>
      )}
      <form
        className="mt-8 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          const data = new FormData(event.currentTarget);
          try {
            const session = await login(
              String(data.get("email")),
              String(data.get("password")),
            );
            const from = (location.state as { from?: string } | null)?.from;
            navigate(
              from ??
                (session.vendor.status === "APPROVED"
                  ? "/dashboard"
                  : session.vendor.status === "IN_PROGRESS" ||
                      session.vendor.status === "REJECTED"
                    ? "/onboarding/details"
                    : "/review-status"),
            );
          } catch (value) {
            setError(
              value instanceof Error
                ? value.message
                : ((value as { message?: string }).message ??
                    "Invalid email or password"),
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        <FormField label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Password">
          <PasswordInput
            name="password"
            autoComplete="current-password"
            required
          />
        </FormField>
        <Button className="w-full" loading={loading}>
          Login
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to Pepsa?{" "}
        <Link className="font-semibold text-brand" to="/register">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

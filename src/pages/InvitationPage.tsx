import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiRequest } from "../api/client.ts";
import { AuthShell } from "../components/shared/AuthShell.tsx";
import {
  Alert,
  Button,
  FormField,
  Input,
  PasswordInput,
} from "../components/ui/index.ts";
export default function InvitationPage() {
  const [params] = useSearchParams();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  return (
    <AuthShell>
      <h1 className="text-3xl font-bold tracking-tight">Join your team</h1>
      <p className="mt-2 text-muted">
        Complete your Pepsa Vendor staff account.
      </p>
      {done ? (
        <Alert className="mt-8" tone="success" title="Account ready">
          Your invitation was accepted.{" "}
          <Link className="underline" to="/login">
            Sign in now
          </Link>
          .
        </Alert>
      ) : (
        <form
          className="mt-8 grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const body = Object.fromEntries(new FormData(event.currentTarget));
            try {
              await apiRequest("/auth/invitations/complete", {
                method: "POST",
                body: JSON.stringify({ ...body, token: params.get("token") }),
              });
              setDone(true);
            } catch (value) {
              setError(
                (value as { message?: string }).message ?? "Invitation failed",
              );
            }
          }}
        >
          {error && (
            <div className="sm:col-span-2">
              <Alert tone="danger">{error}</Alert>
            </div>
          )}
          <FormField label="First name">
            <Input name="firstName" required />
          </FormField>
          <FormField label="Last name">
            <Input name="lastName" required />
          </FormField>
          <FormField label="Phone">
            <Input name="phone" required />
          </FormField>
          <FormField label="Password">
            <PasswordInput
              name="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </FormField>
          <Button className="sm:col-span-2">Create account</Button>
        </form>
      )}
    </AuthShell>
  );
}

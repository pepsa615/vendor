import { LockKeyhole, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.ts";
import { AuthShell, StepProgress } from "../components/shared/AuthShell.tsx";
import {
  Alert,
  Button,
  Checkbox,
  FormField,
  Input,
  PasswordInput,
  Select,
} from "../components/ui/index.ts";

type VendorType = "INDIVIDUAL" | "COMPANY";

const registrationTypes = [
  { key: "INDIVIDUAL", label: "Individual" },
  { key: "COMPANY", label: "Company" },
];

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<VendorType | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell>
      <StepProgress current={1} total={type === "COMPANY" ? 5 : 4} />
      <h1 className="text-[2rem] font-bold leading-tight">Registration</h1>
      <p className="mt-2 text-sm text-muted">
        Register to kickstart an efficient logistics business with Pepsa
        Dispatch.
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-md bg-[#eef0f3] px-4 py-3 text-xs text-neutral-700">
        <LockKeyhole className="size-4 shrink-0 text-neutral-400" />
        <span className="flex-1">
          You can be sure that your personal data is securely protected.
        </span>
        <X className="size-4 text-neutral-400" aria-hidden />
      </div>

      {error && (
        <Alert className="mt-4" tone="danger" title="Registration failed">
          {error}
        </Alert>
      )}

      <form
        className="mt-5 grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const password = String(data.get("password"));
          const confirmation = String(data.get("confirmPassword"));
          if (!type) {
            setError(
              "Select whether you are registering as an individual or company.",
            );
            return;
          }
          if (password !== confirmation) {
            setError("Passwords do not match.");
            return;
          }

          setLoading(true);
          setError("");
          const displayName = String(data.get("displayName")).trim();
          const words = displayName.split(/\s+/).filter(Boolean);
          try {
            await apiRequest("/auth/register", {
              method: "POST",
              body: JSON.stringify({
                vendorType: type,
                displayName,
                phone: data.get("phone"),
                email: data.get("email"),
                password,
                firstName: words[0] || "Vendor",
                lastName: words.slice(1).join(" ") || "Owner",
              }),
            });
            sessionStorage.setItem(
              "pepsa-registration-email",
              String(data.get("email")),
            );
            sessionStorage.setItem("pepsa-registration-type", type);
            navigate("/verify-email");
          } catch (value) {
            setError(
              (value as { message?: string }).message ?? "Registration failed",
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        <FormField label="Business/ Brand Name">
          <Input name="displayName" placeholder="ABC Logistics" required />
        </FormField>
        <FormField label="Business Phone Number">
          <Input name="phone" type="tel" placeholder="08023456789" required />
        </FormField>
        <Select
          label="Register as"
          placeholder="Select"
          options={registrationTypes}
          selectedKey={type}
          onSelectionChange={(key) => setType(String(key) as VendorType)}
          isRequired
        />
        <FormField label="Business Email">
          <Input
            name="email"
            type="email"
            placeholder="abc@example.com"
            autoComplete="email"
            required
          />
        </FormField>
        <FormField label="Password">
          <PasswordInput
            name="password"
            minLength={12}
            autoComplete="new-password"
            placeholder="At least 12 characters"
            required
          />
        </FormField>
        <FormField label="Confirm Password">
          <PasswordInput
            name="confirmPassword"
            minLength={12}
            autoComplete="new-password"
            placeholder="Confirm password"
            revealLabel="password confirmation"
            required
          />
        </FormField>
        <Checkbox
          name="terms"
          isRequired
          className="items-start text-xs text-muted"
        >
          <span>
            I agree to{" "}
            <Link className="text-sky-500" to="/terms">
              Terms &amp; Conditions
            </Link>
            ,{" "}
            <Link className="text-sky-500" to="/privacy">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link className="text-sky-500" to="/identity-terms">
              Indemnity Terms
            </Link>
            .
          </span>
        </Checkbox>
        <Button className="mx-auto mt-5 w-72" loading={loading}>
          Continue
        </Button>
        <p className="text-center text-sm text-muted">
          Already registered?{" "}
          <Link className="font-semibold text-brand" to="/login">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

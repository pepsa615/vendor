import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { apiRequest, setAccessToken } from "../api/client.ts";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  FormField,
  FileInput,
  Input,
  Modal,
  PasswordInput,
  PinInput,
  Skeleton,
  Textarea,
} from "../components/ui/index.ts";
import { useSession } from "../contexts/SessionContext.tsx";
import {
  useVendorProfile,
  vendorProfileQueryKey,
} from "../hooks/useVendorProfile.ts";
import { PublicOrderLinkCard } from "../components/shared/PublicOrderLinkCard.tsx";

type PinStatus = { enrolled: boolean; lockedUntil: string | null };

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient();
  const { refresh } = useSession();
  const profile = useVendorProfile();
  const pin = useQuery({
    queryKey: ["transaction-pin-status"],
    queryFn: () => apiRequest<PinStatus>("/account/pin"),
    retry: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [flow, setFlow] = useState<"pin" | "password" | null>(null);
  const [resetRequested, setResetRequested] = useState(false);
  if (profile.isLoading) return <Skeleton className="h-96" />;
  if (!profile.data)
    return <Alert tone="danger">Unable to load profile.</Alert>;

  async function syncProfileViews() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: vendorProfileQueryKey }),
      refresh(),
    ]);
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await apiRequest("/vendor/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMessage("Business details updated.");
      await syncProfileViews();
    } catch (value) {
      setError((value as { message?: string }).message ?? "Update failed");
    }
  }
  async function uploadLogo(file?: File) {
    if (!file) return;
    setError("");
    const body = new FormData();
    body.set("file", file);
    try {
      await apiRequest("/vendor/profile/logo", { method: "POST", body });
      setMessage("Business logo updated.");
      await syncProfileViews();
    } catch (value) {
      setError((value as { message?: string }).message ?? "Logo upload failed");
    }
  }
  async function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (pin.data?.enrolled && !resetRequested) {
        await apiRequest("/account/pin/reset/request", { method: "POST" });
        setResetRequested(true);
        setMessage("A six-digit reset code was sent to your email.");
        return;
      }
      await apiRequest(
        pin.data?.enrolled ? "/account/pin/reset" : "/account/pin",
        {
          method: "POST",
          body: JSON.stringify(
            pin.data?.enrolled
              ? { code: values.code, pin: values.pin }
              : { pin: values.pin },
          ),
        },
      );
      setMessage(
        pin.data?.enrolled ? "Transaction PIN reset." : "Transaction PIN set.",
      );
      setFlow(null);
      setResetRequested(false);
      await pin.refetch();
    } catch (value) {
      setError(
        (value as { message?: string }).message ?? "Unable to update PIN",
      );
    }
  }
  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.newPassword !== values.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      await apiRequest("/auth/logout", {
        method: "POST",
        retryAuth: false,
      }).catch(() => undefined);
      setAccessToken(null);
      window.location.assign("/login");
    } catch (value) {
      setError(
        (value as { message?: string }).message ?? "Unable to change password",
      );
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted">
            Manage public business information and account security.
          </p>
        </div>
        <Badge
          tone={profile.data.status === "APPROVED" ? "success" : "warning"}
        >
          {profile.data.status.replaceAll("_", " ")}
        </Badge>
      </div>
      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
      <PublicOrderLinkCard publicOrder={profile.data.publicOrder} />
      <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden p-0">
          <SectionHead
            title="Business Details"
            copy="Information shown to customers and business partners."
          />
          <form
            key={profile.dataUpdatedAt}
            className="grid gap-4 p-6 sm:grid-cols-2"
            onSubmit={submitProfile}
          >
            <div className="flex items-center gap-4 sm:col-span-2">
              <Avatar
                src={profile.data.logoUrl ?? undefined}
                name={profile.data.businessName}
                alt={`${profile.data.businessName} logo`}
                size="lg"
                className="size-16 rounded-2xl border border-border shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {profile.data.businessName}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Business identity · JPG or PNG, up to 5 MB
                </p>
              </div>
              <FileInput
                aria-label="Upload business logo"
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG"
                className="max-w-48"
                onChange={(event) =>
                  void uploadLogo(event.currentTarget.files?.[0])
                }
              />
            </div>
            <div className="sm:col-span-2">
              <FormField label="Business name">
                <Input
                  name="businessName"
                  defaultValue={profile.data.businessName}
                  required
                />
              </FormField>
            </div>
            <FormField label="Business phone number">
              <Input name="phone" defaultValue={profile.data.phone} required />
            </FormField>
            <FormField label="Business email">
              <Input
                name="email"
                type="email"
                defaultValue={profile.data.email}
                required
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Business tagline">
                <Input
                  name="tagline"
                  maxLength={36}
                  defaultValue={profile.data.tagline ?? ""}
                  placeholder="A short promise to your customers"
                />
              </FormField>
              <p className="mt-1 text-xs text-muted">Maximum 36 characters</p>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Business description">
                <Textarea
                  name="description"
                  maxLength={96}
                  defaultValue={profile.data.description ?? ""}
                  rows={4}
                  placeholder="Describe what your business does"
                />
              </FormField>
              <p className="mt-1 text-xs text-muted">Maximum 96 characters</p>
            </div>
            <div className="sm:col-span-2">
              <Button className="w-full sm:w-auto sm:min-w-48">
                Update details
              </Button>
            </div>
          </form>
        </Card>
        <Card className="overflow-hidden p-0">
          <SectionHead
            title="Security Settings"
            copy="Protect account access and financial actions."
          />
          <div className="space-y-4 p-6">
            <SecurityCard
              icon={<ShieldCheck />}
              title="Transaction PIN"
              description={
                pin.error
                  ? "PIN settings are unavailable for your role."
                  : pin.data?.enrolled
                    ? "A PIN protects transfers and withdrawals."
                    : "Set a PIN before making protected transactions."
              }
              status={pin.data?.enrolled ? "Enabled" : undefined}
            >
              <Button
                size="sm"
                disabled={pin.isLoading || Boolean(pin.error)}
                onClick={() => setFlow("pin")}
              >
                {pin.data?.enrolled
                  ? "Reset transaction PIN"
                  : "Set transaction PIN"}
              </Button>
            </SecurityCard>
            <SecurityCard
              icon={<LockKeyhole />}
              title="Password"
              description="Changing your password signs out every active session."
            >
              <Button size="sm" onClick={() => setFlow("password")}>
                Change password
              </Button>
            </SecurityCard>
            <div className="flex gap-3 rounded-xl border border-border bg-neutral-50 p-4 text-xs text-muted">
              <KeyRound className="size-4 shrink-0 text-brand" />
              PIN resets use a time-limited code sent to your verified email.
              Support will never ask for your PIN.
            </div>
          </div>
        </Card>
      </div>
      <Modal
        isOpen={flow === "pin"}
        onOpenChange={(open) => !open && setFlow(null)}
        title={
          pin.data?.enrolled ? "Reset transaction PIN" : "Set transaction PIN"
        }
        description={
          pin.data?.enrolled
            ? "Verify the reset through your email before choosing a new PIN."
            : "Choose a private 4–6 digit PIN."
        }
      >
        <form className="space-y-4" onSubmit={submitPin}>
          {pin.data?.enrolled && resetRequested && (
            <FormField label="Email verification code">
              <Input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </FormField>
          )}
          {(!pin.data?.enrolled || resetRequested) && (
            <FormField label="New transaction PIN">
              <PinInput name="pin" minLength={4} maxLength={6} required />
            </FormField>
          )}
          <Button className="w-full">
            {pin.data?.enrolled && !resetRequested
              ? "Send reset code"
              : "Save transaction PIN"}
          </Button>
        </form>
      </Modal>
      <Modal
        isOpen={flow === "password"}
        onOpenChange={(open) => !open && setFlow(null)}
        title="Change password"
        description="Use at least 12 characters. You will sign in again after this change."
      >
        <form className="space-y-4" onSubmit={submitPassword}>
          <FormField label="Current password">
            <PasswordInput name="currentPassword" required />
          </FormField>
          <FormField label="New password">
            <PasswordInput
              name="newPassword"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </FormField>
          <FormField label="Confirm new password">
            <PasswordInput
              name="confirmPassword"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </FormField>
          <Button className="w-full">Change password</Button>
        </form>
      </Modal>
    </section>
  );
}

function SectionHead({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="border-b border-border px-6 py-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted">{copy}</p>
    </div>
  );
}
function SecurityCard({
  icon,
  title,
  description,
  status,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm [&>svg]:size-5">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            {status && <Badge tone="success">{status}</Badge>}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

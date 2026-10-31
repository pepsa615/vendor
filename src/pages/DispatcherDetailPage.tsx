import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileCheck2, MapPin, Pencil, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Badge,
  Button,
  Card,
  Drawer,
  FileInput,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  Switch,
} from "../components/ui/index.ts";
import { NIGERIA_STATE_OPTIONS } from "../constants/nigeriaStates.ts";
import type {
  DispatcherDetail,
  DispatcherLocation,
  DispatcherRevision,
} from "../features/people/types.ts";

const detailRows = (profile: DispatcherRevision) => [
  ["Email", profile.email],
  ["Phone", profile.phone],
  ["Date of birth", new Date(profile.dateOfBirth).toLocaleDateString()],
  ["Gender", profile.gender],
  ["Identity", `${profile.identityType} ${profile.identityNumberMasked}`],
  ["Address", `${profile.homeAddress}, ${profile.city}, ${profile.state}`],
  ["Engagement", profile.engagementType],
  [
    "Vehicle",
    `${profile.vehicleType.replaceAll("_", " ")}${profile.vehicleBrand ? ` · ${profile.vehicleBrand}` : ""}${profile.plateNumber ? ` · ${profile.plateNumber}` : ""}`,
  ],
  [
    "Revenue share",
    `${profile.revenueSharePct}% rider / ${100 - Number(profile.revenueSharePct)}% vendor`,
  ],
  ["Guarantor", `${profile.guarantorName} · ${profile.guarantorPhone}`],
  ["Guarantor NIN", profile.guarantorNinMasked ?? "Not supplied"],
  ["Guarantor address", profile.guarantorAddress],
];

export default function DispatcherDetailPage() {
  const { id = "" } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [error, setError] = useState("");
  const [documentType, setDocumentType] = useState("PROOF_OF_ID");
  const [uploading, setUploading] = useState(false);
  const query = useQuery({
    queryKey: ["dispatcher", id],
    queryFn: () => apiRequest<DispatcherDetail>(`/people/dispatchers/${id}`),
    enabled: Boolean(id),
  });
  const locationQuery = useQuery({
    queryKey: ["dispatcher-location", id],
    queryFn: () =>
      apiRequest<DispatcherLocation | null>(
        `/people/dispatchers/${id}/location`,
      ),
    enabled: Boolean(id) && trackOpen,
    refetchInterval: trackOpen ? 15_000 : false,
  });
  if (query.isLoading) return <Skeleton className="h-96" />;
  if (!query.data)
    return <Alert tone="danger">Dispatcher could not be loaded.</Alert>;
  const dispatcher = query.data;
  const profile = dispatcher.approvedRevision ?? dispatcher.latestRevision;
  const pending =
    dispatcher.approvedRevision &&
    dispatcher.latestRevision.id !== dispatcher.approvedRevision.id
      ? dispatcher.latestRevision
      : null;
  const location = locationQuery.data;
  return (
    <section>
      <Link
        to="/people/dispatchers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to dispatchers
      </Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 ring-1 ring-border">
            {dispatcher.selfieUrl ? (
              <img
                src={dispatcher.selfieUrl}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="size-full object-cover"
              />
            ) : (
              <UserRound className="size-8 text-muted" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">
                {profile.firstName} {profile.lastName}
              </h2>
              <Badge
                tone={
                  dispatcher.status === "APPROVED"
                    ? "success"
                    : dispatcher.status === "REJECTED"
                      ? "danger"
                      : "warning"
                }
                dot
              >
                {dispatcher.status.replaceAll("_", " ")}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              Dispatcher profile version {profile.version}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setEditOpen(true)}
          disabled={dispatcher.latestRevision.status === "UNDER_REVIEW"}
        >
          <Pencil className="size-4" /> Edit profile
        </Button>
      </div>
      {error && (
        <Alert className="mt-5" tone="danger">
          {error}
        </Alert>
      )}
      {pending && (
        <Alert
          className="mt-5"
          tone={pending.status === "REJECTED" ? "danger" : "warning"}
        >
          Profile changes are{" "}
          {pending.status.toLowerCase().replaceAll("_", " ")}.
          {pending.decisionReason ? ` ${pending.decisionReason}` : ""}
        </Alert>
      )}
      {dispatcher.latestRevision.status === "REJECTED" &&
        dispatcher.latestRevision.correctionFields.length > 0 && (
          <Alert className="mt-5" tone="danger">
            Corrections requested:{" "}
            {dispatcher.latestRevision.correctionFields.join(", ")}
          </Alert>
        )}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <h3 className="text-lg font-semibold">Profile details</h3>
          <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {detailRows(profile).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">Availability</h3>
                <p className="mt-1 text-sm text-muted">
                  Online dispatchers can be selected by later dispatch
                  workflows.
                </p>
              </div>
              <Switch
                isSelected={dispatcher.availability}
                isDisabled={dispatcher.status !== "APPROVED"}
                onChange={async (available) => {
                  try {
                    await apiRequest(`/people/dispatchers/${id}/availability`, {
                      method: "PATCH",
                      body: JSON.stringify({ available }),
                    });
                    await query.refetch();
                  } catch (value) {
                    setError(
                      (value as { message?: string }).message ??
                        "Unable to change availability",
                    );
                  }
                }}
              >
                {dispatcher.availability ? "Online" : "Offline"}
              </Switch>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrackOpen(true)}
              >
                <MapPin className="size-4" /> Track live location
              </Button>
              {dispatcher.riderLocationObservedAt && (
                <p className="mt-2 text-xs text-muted">
                  Last seen{" "}
                  {new Date(
                    dispatcher.riderLocationObservedAt,
                  ).toLocaleString()}
                </p>
              )}
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold">Compliance documents</h3>
            <ul className="mt-4 space-y-3">
              {dispatcher.latestRevision.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3"
                >
                  <FileCheck2 className="size-5 text-success-700" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {document.documentType.replaceAll("_", " ")}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {document.originalName}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {dispatcher.latestRevision.status === "DRAFT" ||
            dispatcher.latestRevision.status === "REJECTED" ? (
              <div className="mt-5 space-y-4 border-t border-border pt-5">
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const file = new FormData(event.currentTarget).get("file");
                    if (!(file instanceof File) || !file.size) {
                      setError("Choose a document to upload.");
                      return;
                    }
                    setUploading(true);
                    setError("");
                    const body = new FormData();
                    body.set("documentType", documentType);
                    body.set("file", file);
                    try {
                      await apiRequest(`/people/dispatchers/${id}/documents`, {
                        method: "POST",
                        body,
                      });
                      event.currentTarget.reset();
                      await query.refetch();
                    } catch (value) {
                      setError(
                        (value as { message?: string }).message ??
                          "Unable to upload document",
                      );
                    } finally {
                      setUploading(false);
                    }
                  }}
                >
                  <Select
                    label="Document type"
                    selectedKey={documentType}
                    onSelectionChange={(key) => setDocumentType(String(key))}
                    options={documentTypes.map(([key, label]) => ({
                      key,
                      label,
                    }))}
                  />
                  <FormField label="Replacement document">
                    <FileInput
                      name="file"
                      required
                      accept="image/png,image/jpeg,application/pdf"
                    />
                  </FormField>
                  <Button
                    className="w-full"
                    variant="outline"
                    loading={uploading}
                  >
                    Upload document
                  </Button>
                </form>
                <Button
                  className="w-full"
                  onClick={async () => {
                    try {
                      await apiRequest(`/people/dispatchers/${id}/submit`, {
                        method: "POST",
                      });
                      await query.refetch();
                    } catch (value) {
                      setError(
                        (value as { message?: string }).message ??
                          "Unable to submit changes",
                      );
                    }
                  }}
                >
                  Submit changes for review
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
      <Modal
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        title="Edit dispatcher profile"
        description="Approved changes create a new review version while the current profile stays live."
        size="lg"
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            try {
              await apiRequest(`/people/dispatchers/${id}`, {
                method: "PATCH",
                body: JSON.stringify({
                  email: data.get("email"),
                  phone: data.get("phone"),
                  homeAddress: data.get("homeAddress"),
                  state: data.get("state"),
                  city: data.get("city"),
                  guarantorNin:
                    String(data.get("guarantorNin") || "").trim() || undefined,
                  guarantorAddress: data.get("guarantorAddress"),
                  revenueSharePct: Number(data.get("revenueSharePct")),
                }),
              });
              setEditOpen(false);
              await query.refetch();
            } catch (value) {
              setError(
                (value as { message?: string }).message ??
                  "Unable to update profile",
              );
            }
          }}
        >
          <EditField
            label="Email"
            name="email"
            type="email"
            defaultValue={profile.email}
          />
          <EditField label="Phone" name="phone" defaultValue={profile.phone} />
          <EditField
            label="Home address"
            name="homeAddress"
            defaultValue={profile.homeAddress}
          />
          <Select
            label="State"
            name="state"
            defaultSelectedKey={profile.state}
            options={NIGERIA_STATE_OPTIONS}
          />
          <EditField label="City" name="city" defaultValue={profile.city} />
          <EditField
            label="Guarantor NIN"
            name="guarantorNin"
            inputMode="numeric"
            pattern="[0-9]{11}"
            minLength={11}
            maxLength={11}
            required={!profile.guarantorNinMasked}
            placeholder={
              profile.guarantorNinMasked
                ? "Leave blank to keep the verified NIN"
                : "11-digit NIN"
            }
          />
          <EditField
            label="Guarantor address"
            name="guarantorAddress"
            defaultValue={profile.guarantorAddress}
          />
          <EditField
            label="Revenue share (%)"
            name="revenueSharePct"
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            defaultValue={profile.revenueSharePct}
          />
          <Button className="sm:col-span-2">Save review version</Button>
        </form>
      </Modal>
      <Drawer
        isOpen={trackOpen}
        onOpenChange={setTrackOpen}
        title={`${profile.firstName} ${profile.lastName}`}
        description="Live rider location from the rider app."
      >
        <div className="space-y-4 text-sm">
          {locationQuery.isLoading ? (
            <Skeleton className="h-56" />
          ) : location ? (
            <div className="rounded-xl border border-border bg-surface-subtle p-4">
              <p className="font-semibold">Live location</p>
              <iframe
                className="mt-3 h-56 w-full rounded-lg border-0"
                title="Rider live location"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?marker=${encodeURIComponent(String(location.latitude))}%2C${encodeURIComponent(String(location.longitude))}`}
              />
              <p className="mt-2">
                Latitude {location.latitude}, longitude {location.longitude}
              </p>
              <p className="text-xs text-muted">
                {location.online ? "Online" : "Offline"}
                {location.observedAt
                  ? ` · Updated ${new Date(location.observedAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="text-muted">
              Location unavailable. The rider may be offline or not linked by
              phone yet.
            </p>
          )}
        </div>
      </Drawer>
    </section>
  );
}

const documentTypes = [
  ["PROOF_OF_ID", "Proof of identity"],
  ["HEADSHOT", "Headshot"],
  ["PROOF_OF_ADDRESS", "Proof of address"],
  ["DRIVERS_LICENSE", "Driver's license"],
  ["INSURANCE", "Insurance"],
  ["ROADWORTHINESS_CERTIFICATE", "Roadworthiness certificate"],
  ["PROOF_OF_OWNERSHIP", "Proof of ownership"],
  ["VEHICLE_REGISTRATION", "Vehicle registration document"],
  ["PARKING_PERMIT", "Parking permit"],
] as const;

function EditField({
  label,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <FormField label={label}>
      <Input required {...props} />
    </FormField>
  );
}

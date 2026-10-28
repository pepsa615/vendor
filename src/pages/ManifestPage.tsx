import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MapPin, PackagePlus, Plus, Route } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiDownload, apiRequest } from "../api/client.ts";
import {
  Alert,
  Badge,
  Button,
  Card,
  FormField,
  FilterGroup,
  Input,
  Modal,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatCard,
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
} from "../components/ui/index.ts";
import type {
  BatchSummary,
  Manifest,
  Page,
  Validation,
  VendorSummary,
} from "../features/manifests/types.ts";
import { NIGERIA_STATE_OPTIONS } from "../constants/nigeriaStates.ts";
import { BatchBuilder } from "../features/manifests/BatchBuilder.tsx";
import type { DispatcherListResponse } from "../features/people/types.ts";
import { useSession } from "../contexts/SessionContext.tsx";

const errorMessage = (reason: unknown) =>
  (reason as { message?: string }).message ?? "Something went wrong";
const statusTone = (status: string) =>
  status === "DELIVERED" || status === "ACCEPTED"
    ? "success"
    : status === "DECLINED" || status === "REMOTE_LOCATION"
      ? "danger"
      : status === "CHANGE_REQUESTED" || status === "REROUTED"
        ? "warning"
        : "info";

export default function ManifestPage() {
  const [params, _setParams] = useSearchParams();
  const initialOrderReference = params.get("orderRef") ?? "";
  const view =
    params.get("view") === "travel-manifest" ? "travel-manifest" : "batching";
  return (
    <section>
      <h1 className="text-2xl font-bold">Manifest</h1>
      <p className="mt-1 text-sm text-muted">
        Validate shipments, create immutable batches, and send inter-vendor
        travel manifests.
      </p>
      {view === "batching" ? (
        <BatchingView initialOrderReference={initialOrderReference} />
      ) : (
        <TravelManifestView />
      )}
    </section>
  );
}

function BatchingView({
  initialOrderReference = "",
}: {
  initialOrderReference?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(Boolean(initialOrderReference));
  const query = useQuery({
    queryKey: ["batches", search],
    queryFn: () =>
      apiRequest<Page<BatchSummary>>(
        `/manifests/batches?search=${encodeURIComponent(search)}`,
      ),
  });
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          aria-label="Search batches"
          value={search}
          onChange={setSearch}
          placeholder="Search batch ID"
          className="max-w-md"
        />
        <Button onClick={() => setOpen(true)}>
          <PackagePlus className="size-4" /> Create batch
        </Button>
      </div>
      {query.isLoading ? (
        <Skeleton className="mt-5 h-64" />
      ) : (
        <div className="mt-5">
          <Table>
            <THead>
              <Tr>
                <Th>Batch ID</Th>
                <Th>Created</Th>
                <Th>Shipments</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {query.data?.items.map((batch) => (
                <Tr key={batch.id}>
                  <Td className="font-semibold">{batch.publicReference}</Td>
                  <Td>{new Date(batch.createdAt).toLocaleString()}</Td>
                  <Td>{batch._count.items}</Td>
                  <Td>
                    <Badge
                      tone={
                        batch.status === "FINALIZED" ? "success" : "neutral"
                      }
                    >
                      {batch.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
              {!query.data?.items.length && (
                <Tr>
                  <Td colSpan={4}>
                    <p className="py-10 text-center text-muted">
                      No batches found.
                    </p>
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>
      )}
      <BatchBuilder
        key={`${open}-${initialOrderReference}`}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function ValidationSummary({ value }: { value: Validation }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-4">
      {(
        [
          ["Scanned", value.total],
          ["Valid", value.valid.length],
          ["Invalid", value.invalid.length],
          ["Duplicates", value.duplicates.length],
        ] as const
      ).map(([label, count]) => (
        <Card key={label} size="sm">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-1 text-xl font-bold">{count}</p>
        </Card>
      ))}
      {(value.invalid.length > 0 || value.duplicates.length > 0) && (
        <Alert tone="warning" className="sm:col-span-4">
          Invalid:{" "}
          {value.invalid
            .map((item) => `${item.trackingId} (${item.reason})`)
            .join(", ") || "none"}
          . Duplicates: {value.duplicates.join(", ") || "none"}.
        </Alert>
      )}
      <div className="overflow-hidden rounded-xl border border-border sm:col-span-4">
        {[
          ...value.valid.map((item) => ({
            trackingId: item.trackingId,
            status: "Valid",
            detail: "Ready for batch",
          })),
          ...value.invalid.map((item) => ({
            trackingId: item.trackingId,
            status: "Invalid",
            detail: item.reason,
          })),
          ...value.duplicates.map((trackingId) => ({
            trackingId,
            status: "Duplicate",
            detail: "Repeated in this entry",
          })),
        ].map((item, index) => (
          <div
            key={`${item.status}-${item.trackingId}-${index}`}
            className="grid gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_8rem_2fr]"
          >
            <span className="font-medium">{item.trackingId}</span>
            <Badge
              tone={
                item.status === "Valid"
                  ? "success"
                  : item.status === "Duplicate"
                    ? "warning"
                    : "danger"
              }
            >
              {item.status}
            </Badge>
            <span className="text-muted">{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyForm = {
  name: "",
  originState: "",
  originCity: "",
  destinationState: "",
  destinationCity: "",
  destinationVendorId: "",
  trackingIds: "",
  batchIds: [] as string[],
};
function TravelManifestView() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<"outbound" | "inbound">(
    "outbound",
  );
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [revisionTarget, setRevisionTarget] = useState<string | null>(null);
  const [selected, setSelected] = useState<Manifest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [parcelEntry, setParcelEntry] = useState("");
  const [parcelValidation, setParcelValidation] = useState<Validation | null>(
    null,
  );
  const [preview, setPreview] = useState<{
    previewToken: string;
    orderCount: number;
    batchCount: number;
    tracking: Validation;
  } | null>(null);
  const [error, setError] = useState("");
  const manifests = useQuery({
    queryKey: ["manifests", direction, search, page],
    queryFn: () =>
      apiRequest<Page<Manifest>>(
        `/manifests?direction=${direction}&search=${encodeURIComponent(search)}&page=${page}`,
      ),
  });
  const outboundCount = useQuery({
    queryKey: ["manifest-count", "outbound"],
    queryFn: () =>
      apiRequest<Page<Manifest>>("/manifests?direction=outbound&pageSize=1"),
  });
  const inboundCount = useQuery({
    queryKey: ["manifest-count", "inbound"],
    queryFn: () =>
      apiRequest<Page<Manifest>>("/manifests?direction=inbound&pageSize=1"),
  });
  const batches = useQuery({
    queryKey: ["batches", "available"],
    queryFn: () =>
      apiRequest<Page<BatchSummary>>("/manifests/batches?pageSize=100"),
  });
  const vendors = useQuery({
    queryKey: ["manifest-vendors"],
    queryFn: () => apiRequest<VendorSummary[]>("/manifests/vendors"),
  });
  const available =
    batches.data?.items.filter((batch) => batch.status === "FINALIZED") ?? [];
  const validateParcels = useMutation({
    mutationFn: () =>
      apiRequest<Validation>("/manifests/batches/validate", {
        method: "POST",
        body: JSON.stringify({ trackingIds: form.trackingIds }),
      }),
    onSuccess: (value) => {
      setParcelValidation(value);
      setError("");
    },
    onError: (reason) => setError(errorMessage(reason)),
  });
  const parsedTrackingIds = () =>
    form.trackingIds
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
  const setTrackingIds = (values: string[]) => {
    setForm((current) => ({ ...current, trackingIds: values.join("\n") }));
    setParcelValidation(null);
    setPreview(null);
  };
  const previewMutation = useMutation({
    mutationFn: () =>
      apiRequest<{
        previewToken: string;
        orderCount: number;
        batchCount: number;
        tracking: Validation;
      }>(
        revisionTarget
          ? `/manifests/${revisionTarget}/revisions/preview`
          : "/manifests/preview",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            trackingIds: form.trackingIds || undefined,
          }),
        },
      ),
    onSuccess: (value) => {
      setPreview(value);
      setError("");
    },
    onError: (reason) => setError(errorMessage(reason)),
  });
  const create = useMutation({
    mutationFn: () =>
      apiRequest<Manifest>(
        revisionTarget
          ? `/manifests/${revisionTarget}/revisions`
          : "/manifests",
        {
          method: "POST",
          body: JSON.stringify({ previewToken: preview?.previewToken }),
        },
      ),
    onSuccess: async () => {
      setOpen(false);
      setRevisionTarget(null);
      setForm(emptyForm);
      setParcelEntry("");
      setParcelValidation(null);
      setPreview(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["manifests"] }),
        client.invalidateQueries({ queryKey: ["batches"] }),
      ]);
    },
    onError: (reason) => setError(errorMessage(reason)),
  });
  const detail = async (item: Manifest) =>
    setSelected(await apiRequest<Manifest>(`/manifests/${item.id}`));
  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total manifests"
          value={
            outboundCount.data && inboundCount.data
              ? outboundCount.data.total + inboundCount.data.total
              : "—"
          }
          icon={<Route className="size-4" />}
        />
        <StatCard
          label="Inbound manifests"
          value={inboundCount.data?.total ?? "—"}
          tone="info"
        />
        <StatCard
          label="Outbound manifests"
          value={outboundCount.data?.total ?? "—"}
          tone="success"
        />
      </div>
      <Card className="mt-5 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <SearchInput
            aria-label="Search manifests"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search manifest or waybill"
            className="max-w-md"
          />
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Create manifest
          </Button>
        </div>
      </Card>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-t-xl border border-b-0 border-border bg-panel px-5 py-4">
        <FilterGroup
          label="Manifest list:"
          value={direction}
          onChange={(value) => {
            setDirection(value as "outbound" | "inbound");
            setPage(1);
          }}
          options={[
            {
              value: "outbound",
              label: "Outbound",
              tone: "brand",
              count: outboundCount.data?.total,
            },
            {
              value: "inbound",
              label: "Inbound",
              tone: "neutral",
              count: inboundCount.data?.total,
            },
          ]}
        />
      </div>
      {manifests.isLoading ? (
        <Skeleton className="mt-5 h-64" />
      ) : (
        <div>
          <ManifestTable
            items={manifests.data?.items ?? []}
            direction={direction}
            onView={(item) => void detail(item)}
          />
          {manifests.data && (
            <div className="flex justify-end border border-t-0 border-border p-4">
              <Pagination
                page={manifests.data.page}
                pageSize={manifests.data.pageSize}
                total={manifests.data.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
      <Modal
        isOpen={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setPreview(null);
            setRevisionTarget(null);
            setParcelEntry("");
            setParcelValidation(null);
          }
        }}
        title={
          revisionTarget ? "Revise travel manifest" : "Create travel manifest"
        }
        description="Build, preview, then atomically send an immutable manifest revision."
        size="xl"
      >
        {error && (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        )}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <FormField label="Manifest name">
              <Input
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  setPreview(null);
                }}
              />
            </FormField>
          </div>
          <Select
            label="Existing batch (optional)"
            selectedKey={form.batchIds[0] ?? null}
            onSelectionChange={(key) => {
              setForm({ ...form, batchIds: key ? [String(key)] : [] });
              setPreview(null);
            }}
            options={available.map((batch) => ({
              key: batch.id,
              label: `${batch.publicReference} · ${batch._count.items} shipments`,
            }))}
          />
          <div className="lg:col-span-3">
            <h3 className="border-b border-border pb-2 text-sm font-semibold">
              Origin details
            </h3>
          </div>
          <Select
            label="Origin state"
            selectedKey={form.originState || null}
            onSelectionChange={(key) => {
              setForm({ ...form, originState: String(key) });
              setPreview(null);
            }}
            options={NIGERIA_STATE_OPTIONS}
          />
          <FormField label="Origin city">
            <Input
              value={form.originCity}
              onChange={(event) => {
                setForm({ ...form, originCity: event.target.value });
                setPreview(null);
              }}
            />
          </FormField>
          <div className="hidden lg:block" />
          <div className="lg:col-span-3">
            <h3 className="border-b border-border pb-2 text-sm font-semibold">
              Destination details
            </h3>
          </div>
          <Select
            label="Destination state"
            selectedKey={form.destinationState || null}
            onSelectionChange={(key) => {
              setForm({ ...form, destinationState: String(key) });
              setPreview(null);
            }}
            options={NIGERIA_STATE_OPTIONS}
          />
          <FormField label="Destination city">
            <Input
              value={form.destinationCity}
              onChange={(event) => {
                setForm({ ...form, destinationCity: event.target.value });
                setPreview(null);
              }}
            />
          </FormField>
          <Select
            label="Receiving vendor"
            isDisabled={Boolean(revisionTarget)}
            selectedKey={form.destinationVendorId || null}
            onSelectionChange={(key) => {
              setForm({ ...form, destinationVendorId: String(key) });
              setPreview(null);
            }}
            options={(vendors.data ?? []).map((vendor) => ({
              key: vendor.id,
              label: vendor.businessName,
            }))}
          />
          <Card className="lg:col-span-3 p-5">
            <div>
              <h3 className="font-semibold">Parcel details</h3>
              <p className="mt-1 text-xs text-muted">
                Add individual tracking IDs or paste one per line, then validate
                them before previewing the manifest.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {[
                ["Total added", parsedTrackingIds().length],
                ["Valid", parcelValidation?.valid.length ?? "—"],
                ["Invalid", parcelValidation?.invalid.length ?? "—"],
                ["Duplicate", parcelValidation?.duplicates.length ?? "—"],
              ].map(([label, value]) => (
                <StatCard key={label} label={String(label)} value={value} />
              ))}
            </div>
            <div className="mt-5">
              <FormField label="Parcel ID or barcode">
                <div className="flex gap-2">
                  <Input
                    value={parcelEntry}
                    onChange={(event) => setParcelEntry(event.target.value)}
                    placeholder="Scan or type parcel ID"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const value = parcelEntry.trim();
                      if (!value) return;
                      setTrackingIds([...parsedTrackingIds(), value]);
                      setParcelEntry("");
                    }}
                  >
                    Scan / add
                  </Button>
                </div>
              </FormField>
            </div>
            {parcelValidation && <ValidationSummary value={parcelValidation} />}
            <div className="mt-5">
              <FormField label="Parcel IDs — one per line">
                <Textarea
                  value={form.trackingIds}
                  onChange={(event) => {
                    setForm({ ...form, trackingIds: event.target.value });
                    setParcelValidation(null);
                    setPreview(null);
                  }}
                  rows={7}
                  placeholder={"PEP-ORDER-001\nPEP-ORDER-002"}
                />
              </FormField>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTrackingIds([])}
                disabled={!form.trackingIds}
              >
                Clear all
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => validateParcels.mutate()}
                disabled={!form.trackingIds.trim() || validateParcels.isPending}
              >
                {validateParcels.isPending ? "Validating…" : "Revalidate"}
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={
                  !parcelValidation?.invalid.length &&
                  !parcelValidation?.duplicates.length
                }
                onClick={() => {
                  if (!parcelValidation) return;
                  const invalid = new Set(
                    parcelValidation.invalid.map((item) => item.trackingId),
                  );
                  setTrackingIds(
                    parsedTrackingIds().filter(
                      (id, index, all) =>
                        !invalid.has(id) && all.indexOf(id) === index,
                    ),
                  );
                }}
              >
                Remove invalid
              </Button>
            </div>
          </Card>
        </div>
        {preview && (
          <div className="mt-4">
            <Alert tone="success">
              Preview ready: {preview.orderCount} shipments across{" "}
              {preview.batchCount} batches. Confirming will send this manifest.
            </Alert>
            {preview.tracking.total > 0 && (
              <ValidationSummary value={preview.tracking} />
            )}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => previewMutation.mutate()}
            disabled={
              previewMutation.isPending ||
              (Boolean(form.trackingIds.trim()) &&
                (!parcelValidation ||
                  parcelValidation.invalid.length > 0 ||
                  parcelValidation.duplicates.length > 0))
            }
          >
            Preview
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!preview || create.isPending}
          >
            Confirm and send
          </Button>
        </div>
      </Modal>
      <ManifestDetail
        manifest={selected}
        onClose={() => setSelected(null)}
        onRevise={(manifest) => {
          const latest = manifest.revisions[0];
          setForm({
            ...emptyForm,
            name: latest.name,
            originState: latest.originState,
            originCity: latest.originCity,
            destinationState: latest.destinationState,
            destinationCity: latest.destinationCity,
            destinationVendorId: manifest.destinationVendor.id,
          });
          setRevisionTarget(manifest.id);
          setSelected(null);
          setOpen(true);
        }}
      />
    </div>
  );
}

export function ManifestTable({
  items,
  direction,
  onView,
}: {
  items: Manifest[];
  direction: "outbound" | "inbound";
  onView: (item: Manifest) => void;
}) {
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Manifest date</Th>
          <Th>Manifest ID</Th>
          <Th>Type</Th>
          <Th>Items</Th>
          <Th>Origin</Th>
          <Th>Destination</Th>
          <Th>Status</Th>
          <Th>Update</Th>
        </Tr>
      </THead>
      <TBody>
        {items.map((item) => {
          const revision = item.revisions[0];
          return (
            <Tr key={item.id}>
              <Td>{new Date(item.createdAt).toLocaleString()}</Td>
              <Td>
                <button
                  className="font-semibold text-brand hover:underline"
                  onClick={() => onView(item)}
                >
                  {item.publicReference}
                </button>
                <p className="text-xs text-muted">{item.waybillNumber}</p>
              </Td>
              <Td className="capitalize">{direction}</Td>
              <Td>{revision?._count?.items ?? "—"}</Td>
              <Td>
                {revision?.originCity}, {revision?.originState}
              </Td>
              <Td>
                {revision?.destinationCity}, {revision?.destinationState}
              </Td>
              <Td>
                <Badge tone={statusTone(item.status)}>
                  {item.status.replaceAll("_", " ")}
                </Badge>
              </Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={() => onView(item)}>
                  View details
                </Button>
              </Td>
            </Tr>
          );
        })}
        {!items.length && (
          <Tr>
            <Td colSpan={8}>
              <p className="py-10 text-center text-muted">
                No manifests found.
              </p>
            </Td>
          </Tr>
        )}
      </TBody>
    </Table>
  );
}

function ManifestDetail({
  manifest,
  onClose,
  onRevise,
}: {
  manifest: Manifest | null;
  onClose: () => void;
  onRevise: (manifest: Manifest) => void;
}) {
  const { session } = useSession();
  const client = useQueryClient();
  const [dispatcherId, setDispatcherId] = useState("");
  const [assignmentReason, setAssignmentReason] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [selectedItem, setSelectedItem] = useState<
    NonNullable<Manifest["revisions"][number]["items"]>[number] | null
  >(null);
  const download = async () => {
    if (!manifest) return;
    const blob = await apiDownload(
      `/manifests/${manifest.id}/waybill?version=${manifest.currentVersion}`,
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${manifest.waybillNumber}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const revision = manifest?.revisions[0];
  const canAssign = Boolean(
    manifest &&
      manifest.status === "ACCEPTED" &&
      manifest.originVendor.id === session?.vendor.id,
  );
  const dispatchers = useQuery({
    queryKey: ["dispatchers", "manifest-assignment"],
    queryFn: () =>
      apiRequest<DispatcherListResponse>(
        "/people/dispatchers?status=APPROVED&pageSize=100",
      ),
    enabled: canAssign,
  });
  const assign = useMutation({
    mutationFn: () =>
      apiRequest(`/manifests/${manifest!.id}/dispatcher-assignment`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ dispatcherId, reason: assignmentReason }),
      }),
    onSuccess: async () => {
      setAssignmentError("");
      await client.invalidateQueries({ queryKey: ["manifests"] });
      onClose();
    },
    onError: (reason) => setAssignmentError(errorMessage(reason)),
  });
  const startTransit = useMutation({
    mutationFn: () =>
      apiRequest(`/manifests/${manifest!.id}/status`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          status: "IN_TRANSIT",
          version: manifest!.currentVersion,
          message: "Origin dispatcher began transit",
        }),
      }),
    onSuccess: async () => {
      setAssignmentError("");
      await client.invalidateQueries({ queryKey: ["manifests"] });
      onClose();
    },
    onError: (reason) => setAssignmentError(errorMessage(reason)),
  });
  return (
    <>
      <Modal
        isOpen={Boolean(manifest) && !selectedItem}
        onOpenChange={(value) => !value && onClose()}
        title="Manifest Management"
        size="lg"
      >
        {manifest && (
          <div className="space-y-5 text-sm">
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{revision?.name}</h3>
                  <p className="mt-2 text-muted">
                    Manifest ID: {manifest.publicReference} ·{" "}
                    {revision?.items?.length ?? 0} items
                  </p>
                  <p className="mt-1 text-muted">
                    {revision?.originCity}, {revision?.originState} →{" "}
                    {revision?.destinationCity}, {revision?.destinationState}
                  </p>
                </div>
                <Badge tone={statusTone(manifest.status)}>
                  {manifest.status.replaceAll("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {manifest.status === "CHANGE_REQUESTED" && (
                  <Button onClick={() => onRevise(manifest)}>
                    Create revision
                  </Button>
                )}
                <Button variant="secondary" onClick={() => void download()}>
                  <Download className="size-4" /> Download waybill
                </Button>
              </div>
            </div>
            {canAssign && (
              <Card size="sm">
                <h3 className="font-semibold">Transport dispatcher</h3>
                {assignmentError && (
                  <Alert className="mt-3" tone="danger">
                    {assignmentError}
                  </Alert>
                )}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Select
                    label="Approved available dispatcher"
                    selectedKey={dispatcherId || null}
                    onSelectionChange={(key) => setDispatcherId(String(key))}
                    options={(dispatchers.data?.items ?? [])
                      .filter((item) => item.availability)
                      .map((item) => ({
                        key: item.id,
                        label: `${item.firstName} ${item.lastName}`,
                        description: `${item.vehicleType}${item.plateNumber ? ` · ${item.plateNumber}` : ""}`,
                      }))}
                  />
                  <FormField label="Assignment reason">
                    <Input
                      value={assignmentReason}
                      onChange={(event) =>
                        setAssignmentReason(event.target.value)
                      }
                    />
                  </FormField>
                </div>
                <Button
                  className="mt-3"
                  disabled={
                    !dispatcherId ||
                    !assignmentReason.trim() ||
                    assign.isPending
                  }
                  onClick={() => assign.mutate()}
                >
                  {manifest.transportAssignments?.some((item) => item.active)
                    ? "Reassign dispatcher"
                    : "Assign dispatcher"}
                </Button>
                {manifest.transportAssignments?.some((item) => item.active) && (
                  <Button
                    className="mt-3 ml-2"
                    variant="secondary"
                    disabled={startTransit.isPending}
                    onClick={() => startTransit.mutate()}
                  >
                    Start transit
                  </Button>
                )}
              </Card>
            )}
            {manifest.transportAssignments?.length ? (
              <div>
                <h3 className="font-semibold">Dispatcher assignment history</h3>
                <ol className="mt-2 space-y-2">
                  {manifest.transportAssignments.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-border p-3"
                    >
                      <b>
                        {item.dispatcherRevision.firstName}{" "}
                        {item.dispatcherRevision.lastName}
                      </b>{" "}
                      · {item.dispatcherRevision.vehicleType}
                      {item.dispatcherRevision.plateNumber
                        ? ` · ${item.dispatcherRevision.plateNumber}`
                        : ""}
                      <p className="text-xs text-muted">
                        {item.reason} ·{" "}
                        {new Date(item.assignedAt).toLocaleString()} ·{" "}
                        {item.active ? "Active" : "Reassigned"}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <THead>
                  <Tr>
                    <Th>Active status</Th>
                    <Th>Track ID</Th>
                    <Th>Delivery address</Th>
                    <Th>Event stamp</Th>
                    <Th>Timeline</Th>
                    <Th>Update</Th>
                  </Tr>
                </THead>
                <TBody>
                  {revision?.items?.map((item) => {
                    const order = item.order;
                    const dispatch = order?.dispatchItems[0]?.dispatch;
                    const latest = dispatch?.events.at(-1);
                    return (
                      <Tr key={item.id}>
                        <Td>
                          <Badge
                            tone={
                              manifest.status === "DELIVERED"
                                ? "success"
                                : "info"
                            }
                          >
                            {manifest.status === "DELIVERED"
                              ? "Delivered"
                              : "Active"}
                          </Badge>
                        </Td>
                        <Td>
                          <button
                            className="font-semibold text-brand hover:underline"
                            onClick={() => setSelectedItem(item)}
                          >
                            {order?.publicReference ??
                              item.batch?.publicReference}
                          </button>
                        </Td>
                        <Td>
                          <span className="block max-w-64 whitespace-normal">
                            {order
                              ? formatManifestAddress(order.delivery)
                              : "Included batch"}
                          </span>
                        </Td>
                        <Td>
                          {latest
                            ? new Date(latest.createdAt).toLocaleString()
                            : "No event received"}
                        </Td>
                        <Td>
                          {dispatch
                            ? `${(dispatch.optimizedDistanceMetres / 1000).toFixed(1)} km · ${Math.round(dispatch.optimizedDurationSeconds / 60)} min`
                            : "Unavailable"}
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!order}
                            onClick={() => setSelectedItem(item)}
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            </div>
            <div>
              <h3 className="font-semibold">Action history</h3>
              <ol className="mt-3 space-y-3 border-l border-border pl-4">
                {manifest.actions?.map((action) => (
                  <li key={action.id}>
                    <p className="font-medium">
                      {action.action.replaceAll("_", " ")} ·{" "}
                      {action.toStatus.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(action.createdAt).toLocaleString()}
                    </p>
                    {action.message && <p>{action.message}</p>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>
      <ManifestItemReport
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}

function ManifestItemReport({
  item,
  onClose,
}: {
  item: NonNullable<Manifest["revisions"][number]["items"]>[number] | null;
  onClose: () => void;
}) {
  const order = item?.order;
  if (!order) return null;
  const dispatch = order.dispatchItems[0]?.dispatch;
  return (
    <Modal
      isOpen
      onOpenChange={(open) => !open && onClose()}
      title="Delivery Report"
      description={`Tracking ID ${order.publicReference}`}
      size="md"
    >
      <div className="space-y-6 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            tone={
              order.deliveryStatus === "DELIVERED" ||
              order.deliveryStatus === "COMPLETED"
                ? "success"
                : "info"
            }
          >
            {order.deliveryStatus.replaceAll("_", " ")}
          </Badge>
          <span className="text-muted">
            Updated {new Date(order.updatedAt).toLocaleString()}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-neutral-50 p-4">
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-brand text-brand">
              B
            </span>
            <div>
              <p className="font-semibold">Drop-off point</p>
              <p className="mt-2 flex gap-2">
                <MapPin className="size-4 shrink-0 text-brand" />
                {formatManifestAddress(order.delivery)}
              </p>
              <p className="mt-2 text-muted">
                Receiver: {order.receiver.name || "Unavailable"}
                {order.receiver.phone ? ` · ${order.receiver.phone}` : ""}
              </p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Delivery timeline</h3>
          {dispatch?.events.length ? (
            <ol className="mt-4 space-y-0">
              {dispatch.events.map((event) => (
                <li
                  key={event.id}
                  className="relative flex gap-3 pb-5 before:absolute before:left-[5px] before:top-3 before:h-full before:w-px before:bg-border last:before:hidden"
                >
                  <span className="relative z-10 mt-1 size-3 shrink-0 rounded-full bg-brand ring-4 ring-white" />
                  <div>
                    <p className="font-medium">
                      {event.toStatus.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(event.createdAt).toLocaleString()} ·{" "}
                      {event.source}
                    </p>
                    {event.message && (
                      <p className="mt-1 text-muted">{event.message}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 rounded-xl border border-border p-4 text-muted">
              No dispatch timeline has been received for this item.
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4">
          <dt className="text-muted">Payment status</dt>
          <dd className="text-right font-medium">
            {order.paymentStatus.replaceAll("_", " ")}
          </dd>
          <dt className="text-muted">Delivery fee</dt>
          <dd className="text-right font-medium">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: order.currency,
            }).format((order.amountMinor ?? 0) / 100)}
          </dd>
          <dt className="text-muted">Item</dt>
          <dd className="text-right font-medium">{order.itemDescription}</dd>
        </dl>
      </div>
    </Modal>
  );
}

function formatManifestAddress(value: {
  address?: string;
  city?: string;
  state?: string;
}) {
  return (
    [value.address, value.city, value.state].filter(Boolean).join(", ") ||
    "Address unavailable"
  );
}

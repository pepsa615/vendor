import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseDate } from "@internationalized/date";
import { Check, Eye, Plus, Route, Send, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  Dropdown,
  EmptyState,
  FormField,
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
  Th,
  THead,
  Tr,
} from "../components/ui/index.ts";
import type {
  Dispatch,
  DispatchPage,
  DispatchPreview,
  DispatchPreviewRequest,
} from "../features/dispatch/types.ts";
import type {
  OrderListResponse,
  VendorOrder,
} from "../features/orders/types.ts";
import type { DispatcherListResponse } from "../features/people/types.ts";
import type { Page, BatchSummary } from "../features/manifests/types.ts";
import { formatLocationSummary } from "../features/orders/orderIntake.ts";
import { VendorOrderForm } from "../features/orders/VendorOrderForm.tsx";
import { MOBILITY_OPTIONS } from "../constants/orderOptions.ts";

const money = (minor?: number, currency = "NGN") =>
  minor == null
    ? "—"
    : new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
        minor / 100,
      );

export default function OpenDispatchPage() {
  const [params, _setParams] = useSearchParams();
  const view = params.get("view") ?? "runway-manifest";
  const initialOrderId = params.get("orderId") ?? "";
  const heading =
    view === "runway-manifest"
      ? "Runway Dispatch"
      : view === "customer-orders"
        ? "Customer Orders"
        : "Open Dispatch";
  return (
    <section>
      <h1 className="text-2xl font-bold">{heading}</h1>
      <p className="mt-1 text-sm text-muted">
        Assign deliveries to your fleet or release priced orders to Pepsa’s
        rider pool.
      </p>
      {view === "customer-orders" ? (
        <CustomerOrders />
      ) : view === "runway-manifest" ? (
        <RunwayManifest initialOrderId={initialOrderId} />
      ) : (
        <AssignmentPanel mode="GENERAL_POOL" initialOrderId={initialOrderId} />
      )}
    </section>
  );
}

type RunwaySummary = {
  totalDispatch: number;
  activeBatches: number;
  activeDispatchers: number;
  totalRevenueMinor: number;
  currency: string;
};
type OpenDispatchPrice = {
  amountMinor: number;
  currency: string;
  distanceMetres: number;
  durationSeconds: number;
  itemCount: number;
  irreversible: true;
};
type MobilityMethod = NonNullable<DispatchPreviewRequest["mobilityMethod"]>;

function RunwayManifest({ initialOrderId = "" }: { initialOrderId?: string }) {
  const client = useQueryClient();
  const [creating, setCreating] = useState(Boolean(initialOrderId));
  const [selected, setSelected] = useState<Dispatch | null>(null);
  const [openPrice, setOpenPrice] = useState<OpenDispatchPrice | null>(null);
  const [publishError, setPublishError] = useState("");
  const [openMobility, setOpenMobility] =
    useState<MobilityMethod>("motorcycle");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryString = useMemo(() => {
    const query = new URLSearchParams({
      view: "active",
      mode: "OWN_FLEET",
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search.trim()) query.set("search", search.trim());
    if (from) query.set("from", from);
    if (to) query.set("to", `${to}T23:59:59.999Z`);
    if (status) query.set("status", status);
    return query.toString();
  }, [from, page, search, status, to]);
  const list = useQuery({
    queryKey: ["dispatches", "runway", queryString],
    queryFn: () => apiRequest<DispatchPage>(`/dispatches?${queryString}`),
  });
  const summary = useQuery({
    queryKey: ["dispatch-summary", "active", "OWN_FLEET"],
    queryFn: () =>
      apiRequest<RunwaySummary>(
        "/dispatches/summary?view=active&mode=OWN_FLEET",
      ),
  });
  const clearFilters = () => {
    setSearch("");
    setFrom("");
    setTo("");
    setStatus("");
    setPage(1);
  };
  const priceOpenDispatch = useMutation({
    mutationFn: (id: string) =>
      apiRequest<OpenDispatchPrice>(`/dispatches/${id}/open-dispatch-price`, {
        method: "POST",
        body: JSON.stringify({ mobilityMethod: openMobility }),
      }),
    onSuccess: (value) => {
      setOpenPrice(value);
      setPublishError("");
    },
    onError: (reason) => setPublishError(errorMessage(reason)),
  });
  const publishOpenDispatch = useMutation({
    mutationFn: (id: string) =>
      apiRequest<Dispatch>(`/dispatches/${id}/publish-open-dispatch`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ mobilityMethod: openMobility }),
      }),
    onSuccess: async () => {
      setOpenPrice(null);
      setSelected(null);
      await client.invalidateQueries({ queryKey: ["dispatches"] });
      await client.invalidateQueries({ queryKey: ["dispatch-summary"] });
    },
    onError: (reason) => setPublishError(errorMessage(reason)),
  });
  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Runway manifests</h2>
          <p className="mt-1 text-sm text-muted">
            Create and monitor delivery assignments for your approved fleet.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Create manifest
        </Button>
      </div>
      <Card className="p-5">
        <h3 className="text-sm font-semibold">Filter manifests</h3>
        <div className="mt-4 grid items-end gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search manifest ID"
          />
          <DatePicker
            label="Created from"
            value={from ? parseDate(from) : null}
            onChange={(value) => {
              setFrom(value?.toString() ?? "");
              setPage(1);
            }}
          />
          <DatePicker
            label="Created to"
            value={to ? parseDate(to) : null}
            onChange={(value) => {
              setTo(value?.toString() ?? "");
              setPage(1);
            }}
          />
          <Select
            label="Status"
            placeholder="All active statuses"
            selectedKey={status || null}
            onSelectionChange={(key) => {
              setStatus(String(key));
              setPage(1);
            }}
            options={[
              { key: "PENDING_MATCH", label: "Pending match" },
              { key: "PAIRED", label: "Paired" },
              { key: "PICKED_UP", label: "Picked up" },
            ]}
          />
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active deliveries"
          value={summary.data?.totalDispatch ?? "—"}
          tone="brand"
        />
        <StatCard
          label="Active batches"
          value={summary.data?.activeBatches ?? "—"}
          tone="info"
        />
        <StatCard
          label="Active dispatchers"
          value={summary.data?.activeDispatchers ?? "—"}
          tone="success"
        />
        <StatCard
          label="Active order value"
          value={money(summary.data?.totalRevenueMinor, summary.data?.currency)}
          tone="warning"
        />
      </div>
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Manifest list</h3>
          <span className="text-xs text-muted">
            {list.data?.total ?? 0} active assignments
          </span>
        </div>
        {list.isLoading ? (
          <Skeleton className="m-5 h-64" />
        ) : list.error ? (
          <Alert className="m-5" tone="danger">
            {errorMessage(list.error)}
          </Alert>
        ) : !list.data?.items?.length ? (
          <EmptyState
            title="No runway manifests found"
            description="Create a manifest or adjust the filters to see fleet assignments."
            action={
              <Button onClick={() => setCreating(true)}>Create manifest</Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <Tr>
                    <Th>Created</Th>
                    <Th>Manifest ID</Th>
                    <Th>Items</Th>
                    <Th>Route</Th>
                    <Th>Dispatcher</Th>
                    <Th>Status</Th>
                    <Th>Update</Th>
                  </Tr>
                </THead>
                <TBody>
                  {list.data.items.map((item) => (
                    <Tr key={item.id}>
                      <Td>{new Date(item.createdAt).toLocaleString()}</Td>
                      <Td className="font-semibold">{item.publicReference}</Td>
                      <Td>{item.items.length.toLocaleString()}</Td>
                      <Td>
                        {(item.optimizedDistanceMetres / 1000).toFixed(1)} km ·{" "}
                        {Math.ceil(item.optimizedDurationSeconds / 60)} min
                      </Td>
                      <Td>
                        {item.dispatcher?.approvedRevision
                          ? `${item.dispatcher.approvedRevision.firstName} ${item.dispatcher.approvedRevision.lastName}`
                          : "Awaiting assignment"}
                      </Td>
                      <Td>
                        <Badge>{item.status.replaceAll("_", " ")}</Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`View ${item.publicReference}`}
                          onClick={() => setSelected(item)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="flex justify-end border-t border-border px-5 py-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={list.data.total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
      <Modal
        isOpen={creating}
        onOpenChange={setCreating}
        title="Create Runway Manifest"
        description="Select eligible parcels, assign an available dispatcher, then review pickup and payment details."
        size="xl"
      >
        <AssignmentPanel mode="OWN_FLEET" initialOrderId={initialOrderId} />
      </Modal>
      <Modal
        isOpen={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.publicReference ?? "Runway manifest"}
        description="Authoritative assignment and route information."
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                label="Status"
                value={selected.status.replaceAll("_", " ")}
              />
              <Stat
                label="Items"
                value={selected.items.length.toLocaleString()}
              />
              <Stat
                label="Distance"
                value={`${(selected.optimizedDistanceMetres / 1000).toFixed(1)} km`}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Assigned dispatcher</h3>
              <p className="mt-2 text-sm text-muted">
                {selected.dispatcher?.approvedRevision
                  ? `${selected.dispatcher.approvedRevision.firstName} ${selected.dispatcher.approvedRevision.lastName}`
                  : "Awaiting assignment"}
              </p>
            </div>
            {publishError && <Alert tone="danger">{publishError}</Alert>}
            {selected.status === "PENDING_MATCH" && (
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                <h3 className="font-semibold">Move to Open Dispatch</h3>
                <p className="mt-1 text-sm text-muted">
                  Get the general-pool price first. Publishing debits the vendor
                  wallet and cannot be recalled.
                </p>
                <Select
                  className="mt-3"
                  label="Mobility method"
                  selectedKey={openMobility}
                  onSelectionChange={(key) =>
                    setOpenMobility(String(key) as MobilityMethod)
                  }
                  options={[...MOBILITY_OPTIONS]}
                />
                <Button
                  className="mt-3"
                  onClick={() => priceOpenDispatch.mutate(selected.id)}
                  loading={priceOpenDispatch.isPending}
                >
                  Get Open Dispatch price
                </Button>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold">Optimized stops</h3>
              <ol className="mt-2 space-y-2">
                {selected.routeSnapshot.stops.map((stop) => (
                  <li
                    key={stop.orderId}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <strong>Stop {stop.sequence}</strong> · {stop.address}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={Boolean(openPrice)}
        onOpenChange={(open) => !open && setOpenPrice(null)}
        title="Confirm Open Dispatch"
        description="This action is final once the order is published to the general rider pool."
        dismissible={!publishOpenDispatch.isPending}
      >
        {openPrice && selected && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat label="Orders" value={String(openPrice.itemCount)} />
              <Stat
                label="Price to debit"
                value={money(openPrice.amountMinor, openPrice.currency)}
              />
              <Stat
                label="Distance"
                value={`${(openPrice.distanceMetres / 1000).toFixed(1)} km`}
              />
              <Stat
                label="Drive time"
                value={`${Math.ceil(openPrice.durationSeconds / 60)} min`}
              />
            </div>
            <Alert tone="warning">
              The wallet is debited before publishing. This runway manifest
              cannot be restored after confirmation.
            </Alert>
            <Button
              className="w-full"
              loading={publishOpenDispatch.isPending}
              onClick={() => publishOpenDispatch.mutate(selected.id)}
            >
              Debit and publish to Open Dispatch
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AssignmentPanel({
  mode,
  initialOrderId = "",
}: {
  mode: "OWN_FLEET" | "GENERAL_POOL";
  initialOrderId?: string;
}) {
  const client = useQueryClient();
  const [sourceType, setSourceType] = useState<"order" | "batch" | "create">(
    "order",
  );
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [sourceId, setSourceId] = useState(initialOrderId);
  const [dispatcherId, setDispatcherId] = useState("");
  const [dispatcherSearch, setDispatcherSearch] = useState("");
  const [preview, setPreview] = useState<DispatchPreview | null>(null);
  const [payout, setPayout] = useState("");
  const [confirmationStep, setConfirmationStep] = useState<
    "pickup" | "payment"
  >("pickup");
  const [created, setCreated] = useState<Dispatch | null>(null);
  const [error, setError] = useState("");
  const [mobilityMethod, setMobilityMethod] =
    useState<MobilityMethod>("motorcycle");
  const orders = useQuery({
    queryKey: ["dispatch-eligible-orders"],
    queryFn: () => apiRequest<OrderListResponse>("/orders?pageSize=100"),
  });
  const batches = useQuery({
    queryKey: ["dispatch-eligible-batches"],
    queryFn: () =>
      apiRequest<Page<BatchSummary>>("/manifests/batches?pageSize=100"),
  });
  const dispatchers = useQuery({
    queryKey: ["dispatchers", "eligible"],
    queryFn: () =>
      apiRequest<DispatcherListResponse>(
        "/people/dispatchers?status=APPROVED&pageSize=100",
      ),
    enabled: mode === "OWN_FLEET",
  });
  const eligibleOrders = useMemo(
    () =>
      (orders.data?.items ?? []).filter(
        (order) =>
          (order.source === "VENDOR_DIRECT" && order.status === "READY") ||
          (order.source === "CUSTOMER_LINK" &&
            order.status === "ACCEPTED" &&
            order.paymentStatus === "PAID"),
      ),
    [orders.data],
  );
  const selectedOrder = eligibleOrders.find((order) => order.id === sourceId);
  const selectedDispatcher = dispatchers.data?.items.find(
    (item) => item.id === dispatcherId,
  );
  const filteredDispatchers = useMemo(() => {
    const term = dispatcherSearch.trim().toLowerCase();
    if (!term) return dispatchers.data?.items ?? [];
    return (dispatchers.data?.items ?? []).filter((item) =>
      [
        item.firstName,
        item.lastName,
        item.phone,
        item.vehicleType,
        item.vehicleBrand,
        item.plateNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [dispatcherSearch, dispatchers.data?.items]);
  const previewMutation = useMutation({
    mutationFn: () => {
      const body: DispatchPreviewRequest = {
        mode,
        ...(sourceType === "order"
          ? { orderId: sourceId }
          : { batchId: sourceId }),
        ...(mode === "OWN_FLEET" ? { dispatcherId } : {}),
        ...(mode === "GENERAL_POOL" ? { mobilityMethod } : {}),
      };
      return apiRequest<DispatchPreview>("/dispatches/preview", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (value) => {
      setPreview(value);
      setPayout(((value.suggestedPayoutMinor ?? 0) / 100).toFixed(2));
      setConfirmationStep("pickup");
      setError("");
    },
    onError: (reason) => setError(errorMessage(reason)),
  });
  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest<Dispatch>("/dispatches", {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          previewToken: preview!.previewToken,
          ...(mode === "OWN_FLEET"
            ? {
                payoutAmountMinor: Math.max(
                  0,
                  Math.round(Number(payout) * 100),
                ),
              }
            : {}),
        }),
      }),
    onSuccess: async (value) => {
      setCreated(value);
      setPreview(null);
      setSourceId("");
      await client.invalidateQueries({ queryKey: ["dispatches"] });
      await client.invalidateQueries({ queryKey: ["dispatch-summary"] });
    },
    onError: (reason) => setError(errorMessage(reason)),
  });
  const loading =
    orders.isLoading || batches.isLoading || dispatchers.isLoading;
  const hasValidPayout =
    mode === "GENERAL_POOL" ||
    (payout.trim() !== "" &&
      Number.isFinite(Number(payout)) &&
      Number(payout) >= 0);
  const flowStep = created
    ? 4
    : preview
      ? confirmationStep === "pickup"
        ? 3
        : 4
      : dispatcherId || mode === "GENERAL_POOL"
        ? 2
        : 1;
  return (
    <div className="mt-6 space-y-5">
      <FlowSteps mode={mode} current={flowStep} />
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand">
            {mode === "OWN_FLEET" ? (
              <Route className="size-5" />
            ) : (
              <Send className="size-5" />
            )}
          </span>
          <div>
            <h2 className="font-bold">
              {mode === "OWN_FLEET" ? "Runway Manifest" : "Pepsa general pool"}
            </h2>
            <p className="text-sm text-muted">
              Preview validates eligibility and fixes the optimized stop order.
            </p>
          </div>
        </div>
        {error && (
          <Alert className="mt-4" tone="danger">
            {error}
          </Alert>
        )}
        {loading ? (
          <Skeleton className="mt-5 h-48" />
        ) : (
          <div className="mt-5 grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Source type"
              selectedKey={sourceType}
              onSelectionChange={(key) => {
                const next = String(key) as "order" | "batch" | "create";
                setSourceType(next);
                setSourceId("");
                if (next === "create") setCreateOrderOpen(true);
              }}
              options={[
                { key: "order", label: "Single order" },
                { key: "batch", label: "Batch" },
                { key: "create", label: "Create new order" },
              ]}
            />
            {sourceType !== "create" ? (
              <Select
                label={
                  sourceType === "order" ? "Eligible order" : "Eligible batch"
                }
                selectedKey={sourceId || null}
                onSelectionChange={(key) => setSourceId(String(key))}
                options={(sourceType === "order"
                  ? eligibleOrders
                  : (batches.data?.items ?? [])
                ).map((item) => ({
                  key: item.id,
                  label: item.publicReference,
                }))}
              />
            ) : (
              <div className="text-sm text-muted">
                Create an order to continue.
              </div>
            )}
            {mode === "GENERAL_POOL" && (
              <Select
                label="Mobility method"
                selectedKey={mobilityMethod}
                onSelectionChange={(key) =>
                  setMobilityMethod(String(key) as MobilityMethod)
                }
                options={[...MOBILITY_OPTIONS]}
              />
            )}
            <div className="flex items-end">
              <Button
                onClick={() => previewMutation.mutate()}
                disabled={
                  !sourceId ||
                  (mode === "OWN_FLEET" && !dispatcherId) ||
                  previewMutation.isPending
                }
              >
                {mode === "GENERAL_POOL" ? "Get pricing" : "Preview dispatch"}
              </Button>
            </div>
          </div>
        )}
        {selectedOrder && (
          <div className="mt-5 grid gap-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4 md:grid-cols-2 xl:grid-cols-4">
            <ShipmentFact
              label="Pickup"
              value={formatLocationSummary(selectedOrder.pickup)}
            />
            <ShipmentFact
              label="Delivery"
              value={formatLocationSummary(selectedOrder.delivery)}
            />
            <ShipmentFact
              label="Parcel"
              value={`${selectedOrder.itemDescription} · ${selectedOrder.orderType.replaceAll("_", " ")}`}
            />
            <ShipmentFact
              label="Handling"
              value={selectedOrder.handling.replaceAll("_", " ")}
            />
            <p className="text-xs text-muted md:col-span-2 xl:col-span-4">
              Pickup, receiver and parcel details come from the order and will
              be snapshotted into the manifest. You do not need to enter them
              again.
            </p>
          </div>
        )}
      </Card>
      {mode === "OWN_FLEET" && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Assign Runway Delivery</h2>
              <p className="text-sm text-muted">
                Choose an available approved dispatcher for this manifest.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <StatCard
              label="Online dispatchers"
              value={dispatchers.data?.stats.online ?? "—"}
              tone="info"
            />
            <StatCard
              label="Active dispatchers"
              value={dispatchers.data?.stats.active ?? "—"}
              tone="success"
            />
            <StatCard
              label="Inactive dispatchers"
              value={dispatchers.data?.stats.inactive ?? "—"}
              tone="warning"
            />
            <StatCard
              label="Total dispatchers"
              value={dispatchers.data?.stats.total ?? "—"}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <SearchInput
              value={dispatcherSearch}
              onChange={setDispatcherSearch}
              placeholder="Search rider, vehicle or plate"
              className="w-full sm:max-w-sm"
            />
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            {filteredDispatchers.length === 0 ? (
              <EmptyState
                title={
                  dispatcherSearch
                    ? "No matching dispatchers"
                    : "No approved dispatchers"
                }
                description={
                  dispatcherSearch
                    ? "Try a different rider, vehicle, or plate search."
                    : "Approved dispatchers will appear here when they are available for runway assignments."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <Tr>
                      <Th>Dispatcher details</Th>
                      <Th>Vehicle details</Th>
                      <Th>Orders picked</Th>
                      <Th>Status</Th>
                      <Th>Action</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {filteredDispatchers.map((item) => (
                      <Tr key={item.id}>
                        <Td>
                          <p className="font-medium">
                            {item.firstName} {item.lastName}
                          </p>
                          <p className="text-xs text-muted">
                            {item.city}, {item.state}
                          </p>
                        </Td>
                        <Td>
                          <p className="font-medium">
                            {item.vehicleType.replaceAll("_", " ")}
                          </p>
                          {item.vehicleBrand && (
                            <p className="text-xs text-muted">
                              {item.vehicleBrand}
                            </p>
                          )}
                          {item.plateNumber && (
                            <p className="text-xs text-muted">
                              {item.plateNumber}
                            </p>
                          )}
                        </Td>
                        <Td>{item.totalOrdersPicked.toLocaleString()}</Td>
                        <Td>
                          <Badge
                            tone={item.availability ? "success" : "danger"}
                          >
                            {item.availability ? "Online" : "Offline"}
                          </Badge>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            variant={
                              dispatcherId === item.id ? "primary" : "ghost"
                            }
                            disabled={!item.availability}
                            onClick={() => setDispatcherId(item.id)}
                          >
                            {dispatcherId === item.id
                              ? "Selected"
                              : item.availability
                                ? "Assign order"
                                : "Unavailable"}
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      )}
      <Card>
        <h2 className="font-bold">Dispatch policy</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>Rider acceptance is asynchronous.</li>
          <li>One pickup is required for a multi-stop batch.</li>
          <li>Routes and payout inputs are snapshotted.</li>
          <li>
            {mode === "GENERAL_POOL"
              ? "Full order funding is reserved upfront."
              : "The Pepsa match fee may be deferred."}
          </li>
        </ul>
      </Card>
      <Modal
        isOpen={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        title={
          confirmationStep === "pickup" ? "Pickup Details" : "Confirm Payment"
        }
        description="This preview expires after 15 minutes and can only be used once."
        size="lg"
      >
        {preview && (
          <div className="space-y-5">
            {confirmationStep === "pickup" ? (
              <>
                <div className="rounded-xl border border-border bg-neutral-50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Pickup location
                  </p>
                  <p className="mt-2 font-medium">{preview.pickup.address}</p>
                  {sourceType === "order" &&
                    eligibleOrders.find((order) => order.id === sourceId) && (
                      <>
                        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
                          Sender
                        </p>
                        <p className="mt-2">
                          {
                            eligibleOrders.find(
                              (order) => order.id === sourceId,
                            )?.sender.name
                          }{" "}
                          ·{" "}
                          {
                            eligibleOrders.find(
                              (order) => order.id === sourceId,
                            )?.sender.phone
                          }
                        </p>
                      </>
                    )}
                </div>
                {selectedOrder && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Stat
                      label="Delivery"
                      value={formatLocationSummary(selectedOrder.delivery)}
                    />
                    <Stat
                      label="Receiver"
                      value={`${selectedOrder.receiver.name} · ${selectedOrder.receiver.phone}`}
                    />
                    <Stat
                      label="Parcel"
                      value={selectedOrder.itemDescription}
                    />
                    <Stat
                      label="Handling"
                      value={selectedOrder.handling.replaceAll("_", " ")}
                    />
                  </div>
                )}
                <Alert tone="info">
                  These details are read from the selected order and cannot be
                  edited during assignment.
                </Alert>
                <div className="flex justify-end">
                  <Button onClick={() => setConfirmationStep("payment")}>
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat
                    label="Distance"
                    value={`${(preview.distanceMetres / 1000).toFixed(1)} km`}
                  />
                  <Stat
                    label="Drive time"
                    value={`${Math.ceil(preview.durationSeconds / 60)} min`}
                  />
                  <Stat
                    label="Funding"
                    value={money(
                      preview.fundingRequiredMinor,
                      preview.currency,
                    )}
                  />
                </div>
                {mode === "OWN_FLEET" && selectedDispatcher && (
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Assigned rider
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {selectedDispatcher.firstName}{" "}
                          {selectedDispatcher.lastName}
                        </p>
                        <p className="text-xs text-muted">
                          {selectedDispatcher.vehicleType.replaceAll("_", " ")}
                          {selectedDispatcher.plateNumber
                            ? ` · ${selectedDispatcher.plateNumber}`
                            : ""}
                        </p>
                      </div>
                      <Badge tone="success">Available</Badge>
                    </div>
                  </div>
                )}
                <ol className="space-y-2">
                  {preview.stops.map((stop) => (
                    <li
                      key={stop.orderId}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <b>Stop {stop.sequence}</b> · {stop.address}
                    </li>
                  ))}
                </ol>
                {mode === "OWN_FLEET" && (
                  <div>
                    <FormField label="Amount to pay dispatcher">
                      <Input
                        type="number"
                        min="0"
                        value={payout}
                        onChange={(event) => setPayout(event.target.value)}
                      />
                    </FormField>
                    <p className="mt-1 text-xs text-muted">
                      Suggested from dispatcher revenue share:{" "}
                      {money(preview.suggestedPayoutMinor, preview.currency)}
                    </p>
                  </div>
                )}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Payment source</p>
                      <p className="mt-1 text-xs text-muted">
                        Vendor main wallet · settlement earnings are not used
                      </p>
                    </div>
                    <Badge tone="info">Account wallet</Badge>
                  </div>
                </div>
                {mode === "OWN_FLEET" && (
                  <Alert tone="info">
                    The runway match fee is reserved from the main wallet. The
                    rider payout is recorded with this immutable assignment;
                    approved deferred-fee rules still apply.
                  </Alert>
                )}
                <div className="rounded-xl border border-border bg-neutral-50 p-4">
                  {mode === "OWN_FLEET" ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Dispatcher payout</span>
                        <strong>
                          {money(
                            Math.round(Number(payout || 0) * 100),
                            preview.currency,
                          )}
                        </strong>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-muted">Pepsa match fee</span>
                        <strong>
                          {money(preview.feeAmountMinor, preview.currency)}
                        </strong>
                      </div>
                      <div className="mt-3 flex justify-between border-t border-border pt-3">
                        <span>Total planned cost</span>
                        <strong>
                          {money(
                            Math.round(Number(payout || 0) * 100) +
                              preview.feeAmountMinor,
                            preview.currency,
                          )}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>Funding reserved</span>
                      <strong>
                        {money(preview.fundingRequiredMinor, preview.currency)}
                      </strong>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setPreview(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending || !hasValidPayout}
                  >
                    {mode === "GENERAL_POOL"
                      ? "Debit and post order"
                      : "Confirm and dispatch"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
      <Modal
        isOpen={createOrderOpen}
        onOpenChange={(open) => {
          setCreateOrderOpen(open);
          if (!open && !sourceId) setSourceType("order");
        }}
        title="Create order for a customer"
        description="Create an unpriced order on the customer's behalf. Mobility and pricing are selected only for Open Dispatch."
        size="xl"
      >
        <VendorOrderForm
          onCreated={async (order) => {
            setSourceType("order");
            setSourceId(order.id);
            setCreateOrderOpen(false);
            await client.invalidateQueries({
              queryKey: ["dispatch-eligible-orders"],
            });
          }}
        />
      </Modal>
      <Modal
        isOpen={Boolean(created)}
        onOpenChange={(open) => !open && setCreated(null)}
        title="Order assigned successfully"
        description={
          created
            ? `${created.publicReference} has been assigned for dispatch.`
            : undefined
        }
      >
        <div className="grid place-items-center py-6 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-success-50 text-success-600">
            <Check className="size-8" />
          </span>
          <p className="mt-4 text-sm text-muted">
            {created?.publicReference} is now assigned and visible in
            Operations. Rider acceptance remains asynchronous.
          </p>
          {created && (
            <div className="mt-5 grid w-full gap-3 sm:grid-cols-3">
              <Stat
                label="Stops"
                value={created.items.length.toLocaleString()}
              />
              <Stat
                label="Distance"
                value={`${(created.optimizedDistanceMetres / 1000).toFixed(1)} km`}
              />
              <Stat
                label="Status"
                value={created.status.replaceAll("_", " ")}
              />
            </div>
          )}
          <Button className="mt-6" onClick={() => setCreated(null)}>
            View manifest list
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function CustomerOrders() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [_params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState("");
  const query = useQuery({
    queryKey: ["orders", "customer-orders"],
    queryFn: () => apiRequest<OrderListResponse>("/orders?pageSize=100"),
  });
  const accept = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/orders/${id}/accept`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
      }),
    onSuccess: async () => {
      setActionError("");
      await client.invalidateQueries({
        queryKey: ["orders", "customer-orders"],
      });
    },
    onError: (reason) => setActionError(errorMessage(reason)),
  });
  const reject = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/orders/${id}/cancel`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
      }),
    onSuccess: async () => {
      setActionError("");
      await client.invalidateQueries({
        queryKey: ["orders", "customer-orders"],
      });
    },
    onError: (reason) => setActionError(errorMessage(reason)),
  });
  const isDispatchReady = (order: VendorOrder) =>
    (order.source === "VENDOR_DIRECT" && order.status === "READY") ||
    (order.source === "CUSTOMER_LINK" &&
      order.status === "ACCEPTED" &&
      order.paymentStatus === "PAID");
  const assign = (order: VendorOrder, view: "runway-manifest" | "open") =>
    setParams({ view, orderId: order.id });
  const handleAction = (order: VendorOrder, key: string | number) => {
    if (key === "approve") accept.mutate(order.id);
    if (key === "reject") reject.mutate(order.id);
    if (key === "runway") assign(order, "runway-manifest");
    if (key === "open") assign(order, "open");
    if (key === "batch")
      navigate(
        `/manifest?view=batching&orderRef=${encodeURIComponent(order.publicReference)}`,
      );
  };
  return query.isLoading ? (
    <Skeleton className="mt-6 h-72" />
  ) : (
    <div className="mt-6">
      {actionError && (
        <Alert className="mb-4" tone="danger">
          {actionError}
        </Alert>
      )}
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Create order
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <Tr>
              <Th>Reference</Th>
              <Th>Route</Th>
              <Th>Amount</Th>
              <Th>Source</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </Tr>
          </THead>
          <TBody>
            {query.data?.items.map((order: VendorOrder) => (
              <Tr key={order.id}>
                <Td className="font-semibold">{order.publicReference}</Td>
                <Td>
                  {order.pickup.city} → {order.delivery.city}
                </Td>
                <Td>{money(order.amountMinor)}</Td>
                <Td>
                  <Badge>{order.source.replaceAll("_", " ")}</Badge>
                </Td>
                <Td>
                  <Badge>{order.paymentStatus}</Badge>
                </Td>
                <Td>
                  <Badge>{order.status.replaceAll("_", " ")}</Badge>
                </Td>
                <Td>
                  {order.status === "PENDING_ACCEPTANCE" &&
                  order.paymentStatus === "PAID" ? (
                    <Dropdown
                      size="sm"
                      align="end"
                      label="Actions"
                      onAction={(key) => handleAction(order, key)}
                      items={[
                        {
                          key: "approve",
                          label: "Approve",
                          tone: "success",
                          disabled: accept.isPending || reject.isPending,
                        },
                        {
                          key: "reject",
                          label: "Reject",
                          tone: "danger",
                          disabled: accept.isPending || reject.isPending,
                        },
                      ]}
                    />
                  ) : isDispatchReady(order) ? (
                    <Dropdown
                      size="sm"
                      align="end"
                      label="Actions"
                      onAction={(key) => handleAction(order, key)}
                      items={[
                        {
                          key: "runway",
                          label: "Assign Runway",
                          tone: "brand",
                        },
                        {
                          key: "batch",
                          label: "Add Batch",
                          tone: "warning",
                        },
                        {
                          key: "open",
                          label: "Open Dispatch",
                          tone: "info",
                        },
                      ]}
                    />
                  ) : (
                    <span className="text-xs text-muted">Not available</span>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
      <p className="mt-3 text-sm text-muted">
        Create orders for customers or accept paid link orders, then assign them
        from Runway Manifest.
      </p>
      <Modal
        isOpen={creating}
        onOpenChange={setCreating}
        title="Create order for a customer"
        description="Create an unpriced order on the customer's behalf."
        size="xl"
      >
        <VendorOrderForm
          onCreated={async () => {
            setCreating(false);
            await client.invalidateQueries({ queryKey: ["orders"] });
            await client.invalidateQueries({
              queryKey: ["dispatch-eligible-orders"],
            });
          }}
        />
      </Modal>
    </div>
  );
}

function FlowSteps({
  mode,
  current,
}: {
  mode: "OWN_FLEET" | "GENERAL_POOL";
  current: number;
}) {
  const steps =
    mode === "OWN_FLEET"
      ? ["Shipment", "Assign rider", "Pickup details", "Confirm payment"]
      : ["Shipment", "Mobility", "Route details", "Confirm payment"];
  return (
    <ol
      className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3 sm:grid-cols-4"
      aria-label="Dispatch creation progress"
    >
      {steps.map((label, index) => {
        const number = index + 1;
        const active = number === current;
        const complete = number < current;
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              active
                ? "bg-brand-50 font-semibold text-brand"
                : complete
                  ? "text-success-700"
                  : "text-muted"
            }`}
          >
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                active
                  ? "border-brand bg-brand text-white"
                  : complete
                    ? "border-success-500 bg-success-50"
                    : "border-border bg-white"
              }`}
            >
              {complete ? <Check className="size-3.5" /> : number}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ShipmentFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium capitalize">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-subtle p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
const errorMessage = (reason: unknown) =>
  (reason as { message?: string }).message ??
  "Unable to complete dispatch request";

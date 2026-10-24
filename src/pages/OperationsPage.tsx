import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseDate } from "@internationalized/date";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, PackageCheck, Route, Truck, WalletCards } from "lucide-react";
import { apiDownload, apiRequest } from "../api/client.ts";
import {
  Alert,
  Badge,
  Button,
  Card,
  Drawer,
  DatePicker,
  EmptyState,
  FilterGroup,
  FormField,
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
  Textarea,
} from "../components/ui/index.ts";
import type { Manifest, Page } from "../features/manifests/types.ts";
import { ManifestTable } from "./ManifestPage.tsx";
import type { Dispatch, DispatchPage } from "../features/dispatch/types.ts";
const REPORT_FROM = new Date(Date.now() - 30 * 86_400_000)
  .toISOString()
  .slice(0, 10);
const REPORT_TO = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
export default function OperationsPage() {
  const [params] = useSearchParams();
  const assigned = params.get("view") === "assigned-manifests";
  if (assigned) return <AssignedManifests />;
  return (
    <DispatchOperations history={params.get("view") === "delivery-report"} />
  );
}

type Summary = {
  totalDispatch: number;
  activeBatches: number;
  activeDispatchers: number;
  totalRevenueMinor: number;
  totalEarningsMinor: number;
  statusCounts: Array<{ status: string; _count: { _all: number } }>;
  currency: string;
};
const money = (minor: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
    minor / 100,
  );

function DispatchOperations({ history }: { history: boolean }) {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(REPORT_FROM);
  const [to, setTo] = useState(REPORT_TO);
  const [tracking, setTracking] = useState<Dispatch | null>(null);
  const [selected, setSelected] = useState<Dispatch | null>(null);
  const [selectedItem, setSelectedItem] = useState<
    Dispatch["items"][number] | null
  >(null);
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const summary = useQuery({
    queryKey: ["dispatch-summary", history],
    queryFn: () =>
      apiRequest<Summary>(
        `/dispatches/summary?view=${history ? "history" : "active"}`,
      ),
  });
  const query = useQuery({
    queryKey: [
      "dispatches",
      history,
      search,
      status,
      from,
      to,
      mode,
      source,
      page,
    ],
    queryFn: () =>
      apiRequest<DispatchPage>(
        `/dispatches?view=${history ? "history" : "active"}&search=${encodeURIComponent(search)}&from=${from}&to=${to}${status ? `&status=${status}` : ""}${mode ? `&mode=${mode}` : ""}${source ? `&source=${source}` : ""}&page=${page}&pageSize=${pageSize}`,
      ),
  });
  const openReport = async (item: Dispatch) =>
    setSelected(await apiRequest<Dispatch>(`/dispatches/${item.id}`));
  const openTracking = async (item: Dispatch) =>
    setTracking(await apiRequest<Dispatch>(`/dispatches/${item.id}/tracking`));
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {history ? "Delivery Report" : "Dispatch Activities"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {history
            ? "Review completed delivery performance and earnings."
            : "Monitor active dispatches, assignments, and pickup progress."}
        </p>
      </div>
      {!history && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Filter dispatches</h2>
          <div className="mt-4 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search tracking ID"
            />
            <DatePicker
              label="Created from"
              value={parseDate(from)}
              onChange={(value) => {
                if (value) {
                  setFrom(value.toString());
                  setPage(1);
                }
              }}
            />
            <Select
              label="Dispatch type"
              placeholder="All types"
              selectedKey={mode || null}
              onSelectionChange={(key) => {
                setMode(String(key));
                setPage(1);
              }}
              options={[
                { key: "OWN_FLEET", label: "Own fleet" },
                { key: "GENERAL_POOL", label: "General pool" },
              ]}
            />
            <Select
              label="Order source"
              placeholder="All sources"
              selectedKey={source || null}
              onSelectionChange={(key) => {
                setSource(String(key));
                setPage(1);
              }}
              options={[
                { key: "VENDOR_DIRECT", label: "In-house" },
                { key: "CUSTOMER_LINK", label: "Customer link" },
              ]}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setMode("");
                setSource("");
                setFrom(REPORT_FROM);
                setTo(REPORT_TO);
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Dispatch", summary.data?.totalDispatch ?? 0],
          ["Batch", summary.data?.activeBatches ?? 0],
          [
            history ? "Total Revenue" : "Active Dispatcher",
            history
              ? money(summary.data?.totalRevenueMinor ?? 0)
              : (summary.data?.activeDispatchers ?? 0),
          ],
          [
            history ? "Total Earning" : "Total Revenue",
            money(
              history
                ? (summary.data?.totalEarningsMinor ?? 0)
                : (summary.data?.totalRevenueMinor ?? 0),
              summary.data?.currency,
            ),
          ],
        ].map(([label, value], i) => (
          <StatCard
            key={String(label)}
            label={String(label)}
            value={value}
            icon={
              [
                <PackageCheck key="package" className="size-4" />,
                <Route key="route" className="size-4" />,
                <Truck key="truck" className="size-4" />,
                <WalletCards key="wallet" className="size-4" />,
              ][i]
            }
            tone={(["brand", "info", "success", "warning"] as const)[i]}
          />
        ))}
      </div>
      {history && (
        <div className="mt-6 flex flex-wrap items-end gap-2">
          <DatePicker
            label="From"
            value={parseDate(from)}
            onChange={(value) => value && setFrom(value.toString())}
          />
          <DatePicker
            label="To"
            value={parseDate(to)}
            onChange={(value) => value && setTo(value.toString())}
          />
          <Button
            variant="outline"
            onClick={() =>
              void downloadReport(
                `/reports/operations.csv?from=${from}&to=${to}`,
                "operations-report.csv",
              )
            }
          >
            Export CSV
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-6 rounded-t-xl border border-b-0 border-border bg-panel px-5 py-4">
        <FilterGroup
          label="Show only:"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={(history
            ? [
                ["", "All", "neutral"],
                ["DELIVERED", "Delivered", "success"],
                ["COMPLETED", "Completed", "success"],
                ["CANCELLED", "Cancelled", "danger"],
              ]
            : [
                ["", "All", "neutral"],
                ["PAIRED", "Paired", "brand"],
                ["PICKED_UP", "Picked", "warning"],
              ]
          ).map(([value, label, tone]) => ({
            value,
            label,
            tone: tone as
              | "neutral"
              | "brand"
              | "success"
              | "warning"
              | "danger",
            count: value
              ? summary.data?.statusCounts.find((row) => row.status === value)
                  ?._count._all
              : summary.data?.totalDispatch,
          }))}
        />
        <SearchInput
          className="ml-auto w-64"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search track ID"
        />
      </div>
      {query.isLoading ? (
        <Skeleton className="mt-5 h-64" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <Tr>
                <Th>TRACK ID</Th>
                <Th>TIME STAMP</Th>
                <Th>Dispatcher</Th>
                <Th>Distance</Th>
                <Th>Amount</Th>
                {history && <Th>Earning</Th>}
                <Th>Status</Th>
                {!history && <Th>Action</Th>}
              </Tr>
            </THead>
            <TBody>
              {query.data?.items.map((item) => (
                <Tr key={item.id}>
                  <Td className="font-medium text-muted">
                    <button
                      className="font-semibold text-brand hover:underline"
                      onClick={() => void openReport(item)}
                    >
                      {item.publicReference}
                    </button>
                  </Td>
                  <Td>{new Date(item.createdAt).toLocaleString()}</Td>
                  <Td>
                    {item.dispatcher?.approvedRevision
                      ? `${item.dispatcher.approvedRevision.firstName} ${item.dispatcher.approvedRevision.lastName}`
                      : "Pepsa pool"}
                  </Td>
                  <Td>
                    {(item.optimizedDistanceMetres / 1000).toFixed(1)} km/
                    {Math.round(item.optimizedDurationSeconds / 60)}min
                  </Td>
                  <Td>
                    {money(
                      item.items.reduce(
                        (sum, value) => sum + (value.order.amountMinor ?? 0),
                        0,
                      ),
                      item.currency,
                    )}
                  </Td>
                  {history && (
                    <Td>
                      {money(
                        Math.max(
                          0,
                          item.items.reduce(
                            (sum, value) =>
                              sum + (value.order.amountMinor ?? 0),
                            0,
                          ) - (item.payoutAmountMinor ?? 0),
                        ),
                        item.currency,
                      )}
                    </Td>
                  )}
                  <Td>
                    <Badge>{item.status.replaceAll("_", " ")}</Badge>
                  </Td>
                  {!history && (
                    <Td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void openTracking(item)}
                      >
                        Track
                      </Button>
                    </Td>
                  )}
                </Tr>
              ))}
              {!query.data?.items.length && (
                <Tr>
                  <Td colSpan={8}>
                    <EmptyState
                      title="No dispatches found"
                      description="Try another status or search term."
                    />
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
          {query.data && (
            <div className="flex items-center justify-between border border-t-0 border-border px-4 py-3">
              <span className="text-xs text-muted">
                {query.data.total.toLocaleString()} dispatches
              </span>
              <Pagination
                page={query.data.page}
                pageSize={query.data.pageSize}
                total={query.data.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
      <DispatchReport
        dispatch={selectedItem ? null : selected}
        history={history}
        onClose={() => setSelected(null)}
        onItem={setSelectedItem}
        onTrack={(dispatch) => void openTracking(dispatch)}
      />
      <ItemReport
        item={selectedItem}
        dispatch={selected}
        onClose={() => setSelectedItem(null)}
      />
      <Drawer
        isOpen={Boolean(tracking)}
        onOpenChange={(open) => !open && setTracking(null)}
        title={tracking?.publicReference ?? "Live tracking"}
        description="Latest authorized provider location and append-only progress history."
      >
        {tracking && (
          <div className="space-y-5 text-sm">
            <div className="rounded-xl border border-border bg-surface-subtle p-4">
              <p className="font-semibold">Live route</p>
              {tracking.trackingPoints?.[0] ? (
                <>
                  <iframe
                    className="mt-3 h-56 w-full rounded-lg border-0"
                    title="Latest dispatcher location"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?marker=${encodeURIComponent(tracking.trackingPoints[0].latitude)}%2C${encodeURIComponent(tracking.trackingPoints[0].longitude)}`}
                  />
                  <p className="mt-2">
                    Latitude {tracking.trackingPoints[0].latitude}, longitude{" "}
                    {tracking.trackingPoints[0].longitude}
                  </p>
                  <p className="text-xs text-muted">
                    Updated{" "}
                    {new Date(
                      tracking.trackingPoints[0].recordedAt,
                    ).toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-muted">
                  The provider has not reported a location yet. Route and status
                  tracking remain available.
                </p>
              )}
            </div>
            <ol className="space-y-3 border-l border-border pl-4">
              {tracking.events?.map((event) => (
                <li key={event.id}>
                  <p className="font-semibold">
                    {event.toStatus.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(event.createdAt).toLocaleString()} ·{" "}
                    {event.source}
                  </p>
                  {event.message && <p>{event.message}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Drawer>
    </section>
  );
}

function DispatchReport({
  dispatch,
  history,
  onClose,
  onItem,
  onTrack,
}: {
  dispatch: Dispatch | null;
  history: boolean;
  onClose: () => void;
  onItem: (item: Dispatch["items"][number]) => void;
  onTrack: (dispatch: Dispatch) => void;
}) {
  if (!dispatch) return null;
  const amount = dispatch.items.reduce(
    (sum, item) => sum + (item.order.amountMinor ?? 0),
    0,
  );
  const dispatcher = dispatch.dispatcher?.approvedRevision;
  return (
    <Modal
      isOpen
      onOpenChange={(open) => !open && onClose()}
      title={history ? "Delivery Report" : "Dispatch Report"}
      description={`Created ${new Date(dispatch.createdAt).toLocaleString()}`}
      size="lg"
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">
                {dispatch.publicReference}
              </p>
              <p className="mt-2 text-sm text-muted">
                {dispatch.items.length} deliveries ·{" "}
                {(dispatch.optimizedDistanceMetres / 1000).toFixed(1)} km ·{" "}
                {Math.round(dispatch.optimizedDurationSeconds / 60)} min
              </p>
              <p className="mt-1 text-sm text-muted">
                Total {money(amount, dispatch.currency)}
                {history
                  ? ` · Earnings ${money(Math.max(0, amount - (dispatch.payoutAmountMinor ?? 0)), dispatch.currency)}`
                  : ""}
              </p>
            </div>
            <StatusBadge status={dispatch.status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Dispatcher
            </p>
            <p className="mt-1 font-medium">
              {dispatcher
                ? `${dispatcher.firstName} ${dispatcher.lastName}`
                : "Pepsa general pool"}
            </p>
          </div>
          {!history && (
            <Button size="sm" onClick={() => onTrack(dispatch)}>
              Track dispatch
            </Button>
          )}
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <THead>
              <Tr>
                <Th>TRACK ID</Th>
                <Th>RECEIVER</Th>
                <Th>ADDRESS</Th>
                <Th>PHONE</Th>
                <Th>ITEM</Th>
                <Th>AMOUNT</Th>
                <Th>STATUS</Th>
              </Tr>
            </THead>
            <TBody>
              {dispatch.items.map((item) => (
                <Tr key={item.order.id}>
                  <Td>
                    <button
                      className="font-semibold text-brand hover:underline"
                      onClick={() => onItem(item)}
                    >
                      {item.order.publicReference}
                    </button>
                  </Td>
                  <Td>{item.order.receiver.name || "Unavailable"}</Td>
                  <Td>
                    <span className="block max-w-64 whitespace-normal">
                      {formatAddress(item.order.delivery)}
                    </span>
                  </Td>
                  <Td>{item.order.receiver.phone || "Unavailable"}</Td>
                  <Td>{item.order.itemDescription}</Td>
                  <Td>
                    {money(item.order.amountMinor ?? 0, dispatch.currency)}
                  </Td>
                  <Td>
                    <StatusBadge
                      status={item.order.deliveryStatus || dispatch.status}
                    />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      </div>
    </Modal>
  );
}

function ItemReport({
  item,
  dispatch,
  onClose,
}: {
  item: Dispatch["items"][number] | null;
  dispatch: Dispatch | null;
  onClose: () => void;
}) {
  if (!item || !dispatch) return null;
  const timeline = dispatch.events ?? [];
  const amount = item.order.amountMinor ?? 0;
  const total = dispatch.items.reduce(
    (sum, value) => sum + (value.order.amountMinor ?? 0),
    0,
  );
  const earning = total
    ? Math.round(
        (Math.max(0, total - (dispatch.payoutAmountMinor ?? 0)) * amount) /
          total,
      )
    : 0;
  return (
    <Modal
      isOpen
      onOpenChange={(open) => !open && onClose()}
      title="Delivery Report"
      description={`Tracking ID ${item.order.publicReference}`}
      size="md"
    >
      <div className="space-y-6 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.order.deliveryStatus || dispatch.status} />
          <span className="text-muted">
            {new Date(dispatch.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-neutral-50 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-brand text-brand">
              B
            </span>
            <div>
              <p className="font-semibold">Drop-off point</p>
              <p className="mt-1 flex gap-2 font-medium">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                {formatAddress(item.order.delivery)}
              </p>
              <p className="mt-1 text-muted">
                Receiver: {item.order.receiver.name || "Unavailable"}
              </p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Delivery timeline</h3>
          {timeline.length ? (
            <ol className="mt-4 space-y-0">
              {timeline.map((event) => (
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
            <EmptyState
              className="mt-3 min-h-28"
              title="No timeline events"
              description="Provider events will appear when they are received."
            />
          )}
        </div>
        <div>
          <h3 className="font-semibold">Additional information</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-border p-4">
            <dt className="text-muted">Payment status</dt>
            <dd className="text-right font-medium">
              {item.order.paymentStatus.replaceAll("_", " ")}
            </dd>
            <dt className="text-muted">Delivery fee</dt>
            <dd className="text-right font-medium">
              {money(amount, dispatch.currency)}
            </dd>
            <dt className="text-muted">Allocated earning</dt>
            <dd className="text-right font-medium">
              {money(earning, dispatch.currency)}
            </dd>
            <dt className="text-muted">Item</dt>
            <dd className="text-right font-medium">
              {item.order.itemDescription}
            </dd>
          </dl>
        </div>
      </div>
    </Modal>
  );
}

function formatAddress(value: {
  address: string;
  city: string;
  state?: string;
}) {
  return [value.address, value.city, value.state].filter(Boolean).join(", ");
}
function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "CANCELLED"
      ? "danger"
      : status === "COMPLETED" || status === "DELIVERED"
        ? "success"
        : status === "PICKED_UP"
          ? "warning"
          : status === "PAIRED"
            ? "info"
            : "neutral";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

async function downloadReport(path: string, filename: string) {
  const blob = await apiDownload(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function AssignedManifests() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Manifest | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["manifests", "inbound", search],
    queryFn: () =>
      apiRequest<Page<Manifest>>(
        `/manifests?direction=inbound&search=${encodeURIComponent(search)}`,
      ),
  });
  const open = async (item: Manifest) =>
    setSelected(await apiRequest<Manifest>(`/manifests/${item.id}`));
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selected || !mode) return;
      const responseAction = ["accept", "decline", "request-change"].includes(
        mode,
      );
      return apiRequest<Manifest>(
        `/manifests/${selected.id}/${responseAction ? "respond" : "status"}`,
        {
          method: "POST",
          headers: { "idempotency-key": crypto.randomUUID() },
          body: JSON.stringify(
            responseAction
              ? {
                  action: mode,
                  message: message || undefined,
                  version: selected.currentVersion,
                }
              : {
                  status: mode,
                  message: message || undefined,
                  version: selected.currentVersion,
                },
          ),
        },
      );
    },
    onSuccess: async () => {
      setMode(null);
      setMessage("");
      setSelected(null);
      await client.invalidateQueries({ queryKey: ["manifests", "inbound"] });
    },
    onError: (reason) =>
      setError(
        (reason as { message?: string }).message ?? "Unable to update manifest",
      ),
  });
  const actionButtons =
    selected?.status === "SENT"
      ? ["accept", "decline", "request-change"]
      : selected?.status === "ACCEPTED"
        ? ["IN_TRANSIT"]
        : ["IN_TRANSIT", "REROUTED", "REMOTE_LOCATION"].includes(
              selected?.status ?? "",
            )
          ? ["IN_TRANSIT", "REROUTED", "REMOTE_LOCATION", "DELIVERED"]
          : [];
  return (
    <section>
      <h1 className="text-2xl font-bold">Assigned Manifest</h1>
      <p className="mt-1 text-sm text-muted">
        Review inbound manifests and record their transport progress.
      </p>
      <SearchInput
        className="mt-6 max-w-md"
        value={search}
        onChange={setSearch}
        placeholder="Search manifest or waybill"
      />
      {query.isLoading ? (
        <Skeleton className="mt-5 h-64" />
      ) : (
        <div className="mt-5">
          <ManifestTable
            items={query.data?.items ?? []}
            direction="inbound"
            onView={(item) => void open(item)}
          />
        </div>
      )}
      <Modal
        isOpen={Boolean(selected)}
        onOpenChange={(value) => !value && setSelected(null)}
        title={selected?.revisions[0]?.name ?? "Assigned manifest"}
        size="lg"
      >
        {selected && (
          <div className="space-y-5 text-sm">
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="flex items-center justify-between">
              <Badge>{selected.status.replaceAll("_", " ")}</Badge>
              <span>{selected.waybillNumber}</span>
            </div>
            <p>
              <b>From:</b> {selected.originVendor.businessName}
            </p>
            <p>
              <b>Route:</b> {selected.revisions[0]?.originCity} →{" "}
              {selected.revisions[0]?.destinationCity}
            </p>
            <div className="flex flex-wrap gap-2">
              {actionButtons.map((action) => (
                <Button
                  key={action}
                  variant={action === "decline" ? "danger" : "secondary"}
                  onClick={() => setMode(action)}
                >
                  {action.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
            <div>
              <h3 className="font-semibold">Shared action history</h3>
              <ol className="mt-2 space-y-2 border-l border-border pl-4">
                {selected.actions?.map((action) => (
                  <li key={action.id}>
                    <p>
                      {action.action.replaceAll("_", " ")} →{" "}
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
      <Modal
        isOpen={Boolean(mode)}
        onOpenChange={(value) => !value && setMode(null)}
        title={mode?.replaceAll("_", " ") ?? "Update manifest"}
        description={
          ["decline", "request-change", "REROUTED", "REMOTE_LOCATION"].includes(
            mode ?? "",
          )
            ? "A message is required and will be shared with both vendors."
            : "Confirm this manifest action."
        }
      >
        <FormField label="Message">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </FormField>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              ([
                "decline",
                "request-change",
                "REROUTED",
                "REMOTE_LOCATION",
              ].includes(mode ?? "") &&
                !message.trim())
            }
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </section>
  );
}

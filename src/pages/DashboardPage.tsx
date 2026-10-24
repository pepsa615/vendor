import { useQuery } from "@tanstack/react-query";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import {
  CalendarDays,
  ClipboardList,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "../api/client.ts";
import { PublicOrderLinkCard } from "../components/shared/PublicOrderLinkCard.tsx";
import { useVendorProfile } from "../hooks/useVendorProfile.ts";
import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  EmptyState,
  Skeleton,
  Select,
  StatCard,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "../components/ui/index.ts";

type Mode = "dispatch" | "order" | "revenue";
type Growth = number | null;
type Period = "7" | "30" | "90" | "custom";
type Dashboard = {
  generatedAt: string;
  range: { from: string; to: string };
  currentActivities: {
    activeDispatch: number;
    assignedManifest: number;
    customerOrder: number;
    onlineDispatchers: number;
  };
  overview: {
    dispatch: {
      all: number;
      delivered: number;
      distanceMetres: number;
      valueMinor: number;
      growth: Record<
        "all" | "delivered" | "distanceMetres" | "valueMinor",
        Growth
      >;
    };
    order: {
      all: number;
      completed: number;
      customer: number;
      valueMinor: number;
      growth: Record<"all" | "completed" | "customer" | "valueMinor", Growth>;
    };
    revenue: {
      totalMinor: number;
      dispatcherPayMinor: number;
      earningsMinor: number;
      settlementMinor: number;
      growth: Record<
        | "totalMinor"
        | "dispatcherPayMinor"
        | "earningsMinor"
        | "settlementMinor",
        Growth
      >;
    };
  };
  trend: {
    label: string;
    dispatches: number;
    orders: number;
    revenueMinor: number;
  }[];
  onlineDispatchers: { id: string; name: string; deliveries: number }[];
  topPerformers: {
    id: string;
    name: string;
    deliveries: number;
    share: number;
  }[];
  overall: { deliveries: number; orders: number; customers: number };
  recentDeliveries: {
    id: string;
    publicReference: string;
    status: string;
    amountMinor: number;
    createdAt: string;
  }[];
  currency: string;
};
const money = (minor: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    minor / 100,
  );

export default function DashboardPage() {
  const profile = useVendorProfile();
  const [mode, setMode] = useState<Mode>("dispatch");
  const [period, setPeriod] = useState<Period>("30");
  const currentDay = today(getLocalTimeZone());
  const [customFrom, setCustomFrom] = useState<CalendarDate>(
    currentDay.subtract({ days: 30 }),
  );
  const [customTo, setCustomTo] = useState<CalendarDate>(currentDay);
  const range =
    period === "custom"
      ? {
          from: customFrom.toString(),
          to: customTo.add({ days: 1 }).toString(),
        }
      : {
          from: currentDay.subtract({ days: Number(period) - 1 }).toString(),
          to: currentDay.add({ days: 1 }).toString(),
        };
  const query = useQuery({
    queryKey: ["dashboard-design", range.from, range.to],
    queryFn: () =>
      apiRequest<Dashboard>(
        `/dashboard?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
      ),
    refetchInterval: 60_000,
  });
  if (query.isLoading)
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  if (query.error)
    return (
      <Alert tone="danger" title="Dashboard unavailable">
        We could not load the account overview.
      </Alert>
    );
  const data = query.data!;
  const periodLabel = `${new Date(data.range.from).toLocaleDateString()} – ${new Date(data.range.to).toLocaleDateString()}`;
  return (
    <section className="space-y-4">
      {profile.data?.publicOrder && (
        <PublicOrderLinkCard publicOrder={profile.data.publicOrder} compact />
      )}
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <Select
          label="Analytics period"
          size="sm"
          className="min-w-44"
          selectedKey={period}
          onSelectionChange={(key) => setPeriod(String(key) as Period)}
          options={[
            { key: "7", label: "Last 7 days" },
            { key: "30", label: "Last 30 days" },
            { key: "90", label: "Last 90 days" },
            { key: "custom", label: "Custom range" },
          ]}
        />
        {period === "custom" && (
          <>
            <DatePicker
              label="From"
              size="sm"
              value={customFrom}
              onChange={(value) =>
                value && setCustomFrom(value as CalendarDate)
              }
            />
            <DatePicker
              label="To"
              size="sm"
              value={customTo}
              minValue={customFrom}
              onChange={(value) => value && setCustomTo(value as CalendarDate)}
            />
          </>
        )}
        <p className="ml-auto pb-2 text-xs text-muted">Showing {periodLabel}</p>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(18rem,1fr)]">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Current Activities</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Dispatch"
              value={data.currentActivities.activeDispatch}
            />
            <StatCard
              label="Assigned Manifest"
              value={data.currentActivities.assignedManifest}
              tone="info"
            />
            <StatCard
              label="Customer Order"
              value={data.currentActivities.customerOrder}
              tone="warning"
            />
            <StatCard
              label="Online Dispatchers"
              value={data.currentActivities.onlineDispatchers}
              tone="success"
            />
          </div>
          <div className="my-5 flex items-center gap-2 text-[10px]">
            <span className="h-px flex-1 bg-border" />
            BUSINESS &amp; OPERATION OVERVIEW
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-7">
              {(["dispatch", "order", "revenue"] as Mode[]).map((item) => (
                <Button
                  variant="ghost"
                  size="sm"
                  key={item}
                  className={`border-0 px-0 uppercase shadow-none ${mode === item ? "font-semibold text-brand" : "text-muted"}`}
                  onClick={() => setMode(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
          <Metrics mode={mode} data={data} />
          <Trend mode={mode} data={data} />
        </Card>
        <Card className="p-4">
          <div className="flex justify-between">
            <h2 className="font-bold">Online Dispatchers</h2>
            <span className="text-xs">
              View All {data.currentActivities.onlineDispatchers}
            </span>
          </div>
          <div className="mt-3 space-y-1">
            {data.onlineDispatchers.map((rider, index) => (
              <div
                key={rider.id}
                className="flex items-center rounded-2xl bg-indigo-50 px-3 py-2"
              >
                <span className="mr-2 grid size-7 place-items-center rounded-full bg-white">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm">{rider.name}</span>
                <strong className="text-muted">
                  {rider.deliveries.toLocaleString()}
                </strong>
                <span className="ml-1 text-xs text-muted">Delivery</span>
              </div>
            ))}
            {!data.onlineDispatchers.length && (
              <EmptyState
                className="min-h-32"
                title="No dispatchers online"
                description="Approved dispatchers will appear here when they are available."
              />
            )}
          </div>
          <h2 className="mt-7 font-bold">Top Performers</h2>
          <div className="mt-4 flex items-center gap-5">
            {data.topPerformers.length ? (
              <Donut performers={data.topPerformers} />
            ) : null}
            <div className="flex-1 space-y-2">
              {data.topPerformers.map((p, i) => (
                <div key={p.id} className="flex justify-between text-[10px]">
                  <span>
                    <i
                      className={`mr-2 inline-block size-2 rounded-full ${["bg-neutral-900", "bg-blue-400", "bg-green-300", "bg-blue-200"][i]}`}
                    />
                    {p.name}
                  </span>
                  <span>{p.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-0">
          <div className="flex items-center gap-5 border-b px-6 py-4">
            <strong>Dispatch Activities:</strong>
            <span>Active {data.currentActivities.activeDispatch}</span>
            <span>
              Cancel{" "}
              {
                data.recentDeliveries.filter((d) => d.status === "CANCELLED")
                  .length
              }
            </span>
            <a
              className="ml-auto text-muted underline"
              href="/operations?view=dispatch-activities"
            >
              All {data.recentDeliveries.length}
            </a>
          </div>
          {data.recentDeliveries.length ? (
            <Table>
              <THead>
                <Tr>
                  <Th>TRACK ID</Th>
                  <Th>TIME STAMP</Th>
                  <Th>AMOUNT</Th>
                  <Th>STATUS</Th>
                </Tr>
              </THead>
              <TBody>
                {data.recentDeliveries.slice(0, 3).map((d) => (
                  <Tr key={d.id}>
                    <Td className="font-medium text-brand">
                      {d.publicReference}
                    </Td>
                    <Td>{new Date(d.createdAt).toLocaleString()}</Td>
                    <Td>{money(d.amountMinor)}</Td>
                    <Td>
                      <Badge
                        tone={d.status === "CANCELLED" ? "danger" : "success"}
                      >
                        {d.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState
              title="No recent deliveries"
              description="Completed and active deliveries will appear here."
            />
          )}
        </Card>
        <Card className="p-0">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Overall Information</h2>
              <p className="mt-0.5 text-xs text-muted">
                Account totals and selected-period activity
              </p>
            </div>
            <CalendarDays className="size-4 text-muted" aria-hidden />
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <Overall
              icon={<PackageCheck />}
              label="Delivery"
              value={data.overall.deliveries}
            />
            <Overall
              icon={<ClipboardList />}
              label="Order"
              value={data.overall.orders}
            />
            <Overall
              icon={<Users />}
              label="Customer"
              value={data.overall.customers}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}

function Metrics({ mode, data }: { mode: Mode; data: Dashboard }) {
  const rows =
    mode === "dispatch"
      ? [
          [
            "All",
            data.overview.dispatch.all.toLocaleString(),
            data.overview.dispatch.growth.all,
          ],
          [
            "Delivered",
            data.overview.dispatch.delivered.toLocaleString(),
            data.overview.dispatch.growth.delivered,
          ],
          [
            "Distance",
            `${(data.overview.dispatch.distanceMetres / 1000).toLocaleString()}km`,
            data.overview.dispatch.growth.distanceMetres,
          ],
          [
            "Value",
            money(data.overview.dispatch.valueMinor),
            data.overview.dispatch.growth.valueMinor,
          ],
        ]
      : mode === "order"
        ? [
            [
              "All",
              data.overview.order.all.toLocaleString(),
              data.overview.order.growth.all,
            ],
            [
              "Completed",
              data.overview.order.completed.toLocaleString(),
              data.overview.order.growth.completed,
            ],
            [
              "Customer",
              data.overview.order.customer.toLocaleString(),
              data.overview.order.growth.customer,
            ],
            [
              "Value",
              money(data.overview.order.valueMinor),
              data.overview.order.growth.valueMinor,
            ],
          ]
        : [
            [
              "Total Revenue",
              money(data.overview.revenue.totalMinor),
              data.overview.revenue.growth.totalMinor,
            ],
            [
              "Dispatcher Pay",
              money(data.overview.revenue.dispatcherPayMinor),
              data.overview.revenue.growth.dispatcherPayMinor,
            ],
            [
              "Earnings",
              money(data.overview.revenue.earningsMinor),
              data.overview.revenue.growth.earningsMinor,
            ],
            [
              "Settlement Bal.",
              money(data.overview.revenue.settlementMinor),
              data.overview.revenue.growth.settlementMinor,
            ],
          ];
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map(([label, value, change], i) => (
        <div
          key={label}
          className={`rounded-xl p-4 text-white ${["bg-blue-700", "bg-sky-950", "bg-teal-600", "bg-red-700"][i]}`}
        >
          <p className="text-sm">{label}</p>
          <strong className="mt-3 block">{value}</strong>
          <GrowthIndicator value={change as Growth} />
        </div>
      ))}
    </div>
  );
}
function Trend({ mode, data }: { mode: Mode; data: Dashboard }) {
  const dataKey =
    mode === "dispatch"
      ? "dispatches"
      : mode === "order"
        ? "orders"
        : "revenueMinor";
  return (
    <div
      className="mt-5 h-56 rounded-xl border border-border bg-neutral-50/60 p-3"
      aria-label={`${mode} trend chart`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data.trend}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="dashboardTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b4000c" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#b4000c" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e5e7eb"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(value) =>
              mode === "revenue"
                ? money(Number(value))
                : Number(value).toLocaleString()
            }
          />
          <Tooltip
            formatter={(value) =>
              mode === "revenue"
                ? money(Number(value))
                : Number(value).toLocaleString()
            }
            contentStyle={{
              borderRadius: 12,
              borderColor: "#e5e7eb",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#b4000c"
            strokeWidth={2.5}
            fill="url(#dashboardTrend)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function GrowthIndicator({ value }: { value: Growth }) {
  if (value === null)
    return (
      <small className="mt-2 block text-white/80">New vs previous period</small>
    );
  const positive = value > 0;
  const negative = value < 0;
  return (
    <small className="mt-2 flex items-center gap-1 text-white/90">
      {positive ? (
        <TrendingUp className="size-3.5" />
      ) : negative ? (
        <TrendingDown className="size-3.5" />
      ) : null}
      {positive ? "+" : ""}
      {value.toLocaleString()}% vs previous period
    </small>
  );
}
function Donut({ performers }: { performers: Dashboard["topPerformers"] }) {
  const first = performers[0]?.share ?? 0;
  return (
    <div
      className="grid size-28 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#222 0 ${first}%, #75aaff ${first}% 75%, #86e2b1 75% 90%, #bdd5ff 90%)`,
      }}
    >
      <div className="size-14 rounded-full bg-white" />
    </div>
  );
}
function Overall({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm">
      <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand [&>svg]:size-4">
        {icon}
      </span>
      <span className="mt-4 block text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <strong className="mt-1 block text-xl tracking-tight">
        {value.toLocaleString()}
      </strong>
    </div>
  );
}

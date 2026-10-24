import { useQuery } from "@tanstack/react-query";
import { Building2, Clock, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  Icon,
  Pill,
  Skeleton,
  StatCard,
} from "../components/ui/index.ts";
import {
  PublicOrderForm,
  type PublicCheckoutOrder,
} from "../features/orders/PublicOrderForm.tsx";
import type { PublicVendor } from "../features/orders/types.ts";

type OrderStatus = PublicCheckoutOrder;

const formatNgnMinor = (minor: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(minor / 100);

export default function PublicOrderPage() {
  const { slug = "" } = useParams();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const vendor = useQuery({
    queryKey: ["public-vendor", slug],
    queryFn: () => apiRequest<PublicVendor>(`/public/vendors/${slug}`),
  });
  const status = useQuery({
    queryKey: ["public-order", order?.publicReference],
    enabled: Boolean(order),
    refetchInterval: order?.status === "PENDING_PAYMENT" ? 5000 : false,
    queryFn: () =>
      apiRequest<OrderStatus>(`/public/orders/${order?.publicReference}`),
  });

  if (vendor.isLoading) {
    return (
      <main className="min-h-screen bg-surface px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="mx-auto h-32 max-w-xl rounded-2xl" />
          <Skeleton className="h-[32rem] rounded-2xl" />
        </div>
      </main>
    );
  }

  if (vendor.isError || !vendor.data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center p-6">
        <Alert tone="danger">This vendor order page is unavailable.</Alert>
      </main>
    );
  }

  const current = status.data ?? order;
  const paid = current?.paymentStatus === "PAID";

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50/90 via-surface to-surface px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center sm:mb-10">
          <Badge tone="brand" dot>
            Pepsa delivery
          </Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            {vendor.data.businessName}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            {vendor.data.tagline || "Reliable same-city delivery"}
          </p>
          {vendor.data.description ? (
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
              {vendor.data.description}
            </p>
          ) : null}
        </header>

        {current ? (
          <CheckoutPanel order={current} paid={paid} />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
            <aside className="space-y-4 lg:sticky lg:top-8">
              <Card className="overflow-hidden border-brand-100 bg-panel/95 backdrop-blur">
                <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand text-white">
                  <Icon icon={Building2} label="" size="lg" />
                </div>
                <CardTitle className="text-xl">{vendor.data.businessName}</CardTitle>
                <p className="mt-2 text-sm text-muted">
                  Book a courier in a few steps. Pay by bank transfer to a
                  secure temporary account.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  <Feature
                    icon={Truck}
                    title="Same-city routes"
                    detail="Pickup and delivery must be in the same city."
                  />
                  <Feature
                    icon={ShieldCheck}
                    title="Verified addresses"
                    detail="We normalize locations before showing your price."
                  />
                  <Feature
                    icon={Clock}
                    title="Live payment tracking"
                    detail="We refresh status automatically while you pay."
                  />
                </ul>
              </Card>
              <Pill tone="info" className="w-full justify-center py-2">
                Need help? {vendor.data.phone}
              </Pill>
            </aside>

            <Card className="border-brand-100 shadow-soft">
              <CardHeader>
                <div>
                  <CardTitle className="text-2xl">Book a delivery</CardTitle>
                  <p className="mt-1 text-sm text-muted">
                    Complete each step — contacts, route, parcel, then confirm
                    and pay.
                  </p>
                </div>
              </CardHeader>
              <PublicOrderForm slug={slug} onOrderCreated={setOrder} />
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

function CheckoutPanel({
  order,
  paid,
}: {
  order: OrderStatus;
  paid: boolean;
}) {
  return (
    <Card className="mx-auto max-w-2xl border-brand-100 text-center shadow-soft">
      <CardHeader className="flex-col items-center">
        <Badge tone={paid ? "success" : "warning"} dot>
          {order.paymentStatus.replaceAll("_", " ")}
        </Badge>
        <CardTitle className="mt-2 text-2xl">
          Order {order.publicReference}
        </CardTitle>
        <p className="mt-2 max-w-md text-sm text-muted">
          {paid
            ? "Payment confirmed. Your order has been submitted for vendor acceptance."
            : "Transfer the exact amount below to complete checkout."}
        </p>
      </CardHeader>

      {!paid && (
        <div className="mt-2 grid gap-3 text-left sm:grid-cols-2">
          <StatCard
            className="sm:col-span-2"
            label="Amount to transfer"
            value={formatNgnMinor(order.amountMinor)}
            detail={order.checkout.bankName}
            tone="brand"
          />
          <StatCard
            label="Account number"
            value={
              <span className="font-mono text-lg tracking-wide">
                {order.checkout.dynamicAccountNumber}
              </span>
            }
            tone="info"
          />
          <StatCard
            label="Expires"
            value={new Date(order.checkout.expiresAt).toLocaleString()}
            tone="warning"
          />
        </div>
      )}

      <p className="mt-6 text-sm text-muted">
        Status: {order.status.replaceAll("_", " ")}
      </p>
    </Card>
  );
}

function Feature({
  icon,
  title,
  detail,
}: {
  icon: typeof Truck;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
        <Icon icon={icon} label="" size="sm" />
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted">{detail}</p>
      </div>
    </li>
  );
}

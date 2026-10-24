import {
  MapPin,
  Package,
  Receipt,
  Route,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { apiRequest } from "../../api/client.ts";
import { RouteLocationFields } from "../../components/shared/AddressAutocomplete.tsx";
import {
  formatLocationSummary,
  readLocationFromForm,
} from "./orderIntake.ts";
import {
  HANDLING_OPTIONS,
  MOBILITY_OPTIONS,
  PARCEL_CATEGORY_OPTIONS,
} from "../../constants/orderOptions.ts";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Checkbox,
  FormField,
  Icon,
  Input,
  Pill,
  Select,
  StatCard,
} from "../../components/ui/index.ts";
import type { PricingQuote } from "./types.ts";

export type PublicCheckoutOrder = {
  publicReference: string;
  status: string;
  paymentStatus: string;
  amountMinor: number;
  currency: string;
  checkout: {
    dynamicAccountNumber: string;
    bankName: string;
    expiresAt: string;
  };
};

const STEPS: Array<{ label: string; icon: LucideIcon }> = [
  { label: "Contacts", icon: Users },
  { label: "Route", icon: Route },
  { label: "Parcel", icon: Package },
  { label: "Confirm", icon: Receipt },
];

const formatNgnMinor = (minor: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(minor / 100);

export function PublicOrderForm({
  slug,
  onOrderCreated,
}: {
  slug: string;
  onOrderCreated: (order: PublicCheckoutOrder) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [pickupReady, setPickupReady] = useState(false);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [category, setCategory] = useState("");
  const [handling, setHandling] = useState("");
  const [mobilityMethod, setMobilityMethod] = useState("motorcycle");
  const [sizeEstimate, setSizeEstimate] = useState("");
  const [inspectionConsent, setInspectionConsent] = useState(false);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState({ route: "", contacts: "" });

  const value = (name: string) =>
    String(new FormData(formRef.current!).get(name) ?? "").trim();

  const buildPayload = () => {
    const data = new FormData(formRef.current!);
    return {
    sender: {
      name: value("senderName"),
      phone: value("senderPhone"),
      email: value("senderEmail") || undefined,
    },
    receiver: {
      name: value("receiverName"),
      phone: value("receiverPhone"),
      email: value("receiverEmail") || undefined,
    },
    pickup: readLocationFromForm(data, "pickup"),
    delivery: readLocationFromForm(data, "delivery"),
    orderType: category,
    handling,
    mobilityMethod,
    declaredValue: Number(value("itemValue")),
    lengthCm: Number(value("itemLength")),
    widthCm: Number(value("itemWidth")),
    heightCm: Number(value("itemHeight")),
    weightKg: Number(value("itemWeight")),
    quantity: Number(value("itemQuantity")),
    inspectionConsent,
    itemDescription: value("itemDescription"),
    deliveryStatus: "INSTANT",
    fragile: handling === "FRAGILE",
    sizeEstimate: sizeEstimate || undefined,
  };
  };

  const validatePanel = () => {
    const panel = formRef.current?.querySelector<HTMLElement>(
      `[data-public-order-step="${step}"]`,
    );
    const invalid = [
      ...(panel?.querySelectorAll<HTMLInputElement>("input") ?? []),
    ].find((field) => !field.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validatePanel()) return;
    if (step === 1 && (!pickupReady || !deliveryReady)) {
      setError(
        "Select pickup and delivery addresses from search, then confirm state.",
      );
      return;
    }
    if (step === 2 && (!category || !handling || !inspectionConsent)) {
      setError(
        "Parcel category, handling, and package inspection consent are required.",
      );
      return;
    }
    if (step === 2) {
      setReview({
        route: formRef.current
          ? `${formatLocationSummary(readLocationFromForm(new FormData(formRef.current), "pickup"))} → ${formatLocationSummary(readLocationFromForm(new FormData(formRef.current), "delivery"))}`
          : "",
        contacts: `${value("senderName")} → ${value("receiverName")}`,
      });
    }
    setError("");
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const requestQuote = async () => {
    if (!validatePanel()) return;
    setLoading(true);
    setError("");
    const base = buildPayload();
    try {
      const created = await apiRequest<PricingQuote>(
        `/public/vendors/${slug}/quotes`,
        {
          method: "POST",
          body: JSON.stringify({
            pickup: base.pickup,
            delivery: base.delivery,
          }),
        },
      );
      setQuote(created);
    } catch (reason) {
      setError(
        (reason as { message?: string }).message ?? "Unable to calculate price",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step !== STEPS.length - 1 || !quote) return;
    setLoading(true);
    setError("");
    try {
      const created = await apiRequest<PublicCheckoutOrder>(
        `/public/vendors/${slug}/orders`,
        {
          method: "POST",
          headers: { "idempotency-key": crypto.randomUUID() },
          body: JSON.stringify({
            ...buildPayload(),
            quoteReference: quote.publicReference,
          }),
        },
      );
      onOrderCreated(created);
    } catch (reason) {
      setError(
        (reason as { message?: string }).message ?? "Unable to continue",
      );
    } finally {
      setLoading(false);
    }
  };

  const locked = Boolean(quote);

  useEffect(() => {
    if (locked) {
      setPickupReady(true);
      setDeliveryReady(true);
    }
  }, [locked]);

  return (
    <form ref={formRef} onSubmit={submitOrder} className="space-y-6">
      <nav aria-label="Booking progress">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEPS.map(({ label, icon }, index) => {
            const active = index === step;
            const complete = index < step;
            return (
              <li key={label}>
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition ${
                    active
                      ? "border-brand bg-brand-50 shadow-soft"
                      : complete
                        ? "border-brand-200 bg-panel"
                        : "border-border bg-panel"
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                      active || complete
                        ? "bg-brand text-white"
                        : "bg-neutral-100 text-muted"
                    }`}
                  >
                    <Icon icon={icon} label="" size="sm" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      Step {index + 1}
                    </p>
                    <p
                      className={`truncate text-sm ${active ? "font-semibold text-brand" : "font-medium"}`}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {error && (
        <Alert tone="danger">{error}</Alert>
      )}

      <StepPanel
        step={0}
        current={step}
        title="Who is sending and receiving?"
        copy="We use these details for pickup coordination and delivery updates."
      >
        <OrderInput name="senderName" label="Sender name" readOnly={locked} />
        <OrderInput
          name="senderPhone"
          label="Sender phone"
          type="tel"
          readOnly={locked}
        />
        <OrderInput
          name="senderEmail"
          label="Sender email (optional)"
          type="email"
          required={false}
          readOnly={locked}
        />
        <OrderInput
          name="receiverName"
          label="Receiver name"
          readOnly={locked}
        />
        <OrderInput
          name="receiverPhone"
          label="Receiver phone"
          type="tel"
          readOnly={locked}
        />
        <OrderInput
          name="receiverEmail"
          label="Recipient email (optional)"
          type="email"
          required={false}
          readOnly={locked}
        />
      </StepPanel>

      <StepPanel
        step={1}
        current={step}
        title="Pickup and delivery route"
        copy="Same-city delivery only. Search Nigerian addresses with Google, then pick the exact match."
      >
        <div className="md:col-span-2 flex items-start gap-2 rounded-xl bg-brand-50/80 px-3 py-2 text-sm text-brand-900">
          <Icon icon={MapPin} label="" size="sm" className="mt-0.5 shrink-0" />
          <p>
            Type a street or landmark and choose a suggestion. City and state
            are filled automatically after you select an address.
          </p>
        </div>
        <RouteLocationFields
          title="Pickup location"
          namePrefix="pickup"
          disabled={locked}
          onResolvedChange={setPickupReady}
        />
        <RouteLocationFields
          title="Delivery location"
          namePrefix="delivery"
          disabled={locked}
          onResolvedChange={setDeliveryReady}
        />
      </StepPanel>

      <StepPanel
        step={2}
        current={step}
        title="Parcel details"
        copy="Choose how the package travels and what we are carrying."
      >
        <Select
          label="Vehicle type"
          selectedKey={mobilityMethod}
          onSelectionChange={(key) => setMobilityMethod(String(key))}
          isDisabled={locked}
          options={[...MOBILITY_OPTIONS]}
        />
        <Select
          label="Parcel category"
          placeholder="Select category"
          selectedKey={category || null}
          onSelectionChange={(key) => setCategory(String(key))}
          isDisabled={locked}
          options={[...PARCEL_CATEGORY_OPTIONS]}
        />
        <Select
          label="Handling"
          placeholder="Select handling"
          selectedKey={handling || null}
          onSelectionChange={(key) => setHandling(String(key))}
          isDisabled={locked}
          options={[...HANDLING_OPTIONS]}
        />
        <OrderInput
          name="itemDescription"
          label="Item description"
          readOnly={locked}
        />
        <OrderInput
          name="itemValue"
          label="Declared value (NGN)"
          type="number"
          min="0"
          step="0.01"
          readOnly={locked}
        />
        <OrderInput
          name="itemLength"
          label="Length (cm)"
          type="number"
          min="0.1"
          max="1000"
          step="0.1"
          readOnly={locked}
        />
        <OrderInput
          name="itemWidth"
          label="Width (cm)"
          type="number"
          min="0.1"
          max="1000"
          step="0.1"
          readOnly={locked}
        />
        <OrderInput
          name="itemHeight"
          label="Height (cm)"
          type="number"
          min="0.1"
          max="1000"
          step="0.1"
          readOnly={locked}
        />
        <OrderInput
          name="itemWeight"
          label="Weight (kg)"
          type="number"
          min="0.01"
          step="0.01"
          readOnly={locked}
        />
        <OrderInput
          name="itemQuantity"
          label="Quantity"
          type="number"
          min="1"
          max="1000"
          defaultValue="1"
          readOnly={locked}
        />
        <Select
          label="Parcel size (optional)"
          selectedKey={sizeEstimate || null}
          onSelectionChange={(key) => setSizeEstimate(String(key))}
          isDisabled={locked}
          options={["SMALL", "MEDIUM", "LARGE"].map((key) => ({
            key,
            label: key,
          }))}
        />
        <div className="md:col-span-2 rounded-xl border border-border bg-neutral-50 p-4">
          <Checkbox
            isSelected={inspectionConsent}
            onChange={setInspectionConsent}
            isDisabled={locked}
          >
            I consent to package inspection and acknowledge exceptional
            handling charges before confirmation.
          </Checkbox>
        </div>
      </StepPanel>

      <section
        data-public-order-step="3"
        hidden={step !== 3}
        className="space-y-5"
      >
        <div>
          <h3 className="text-lg font-semibold">Review and checkout</h3>
          <p className="mt-1 text-sm text-muted">
            Confirm your details, get a live price, then continue to secure bank
            transfer checkout.
          </p>
        </div>

        <Card size="sm" className="bg-neutral-50/80">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewRow label="Contacts" value={review.contacts} />
            <ReviewRow label="Route" value={review.route} />
            <ReviewRow
              label="Parcel"
              value={
                PARCEL_CATEGORY_OPTIONS.find((item) => item.key === category)
                  ?.label ?? category
              }
            />
            <ReviewRow
              label="Vehicle"
              value={
                MOBILITY_OPTIONS.find((item) => item.key === mobilityMethod)
                  ?.label ?? mobilityMethod
              }
            />
          </div>
        </Card>

        {quote ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="success">Price locked</Pill>
              <p className="text-xs text-muted">
                Valid until {new Date(quote.expiresAt).toLocaleTimeString()}
              </p>
            </div>
            <p className="text-sm text-muted">
              {quote.pickup.normalizedAddress} →{" "}
              {quote.delivery.normalizedAddress}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Distance"
                value={`${(quote.distanceMetres / 1000).toFixed(2)} km`}
                tone="info"
              />
              <StatCard
                label="Discount"
                value={`${(quote.discountBps / 100).toFixed(2)}%`}
                tone="neutral"
              />
              <StatCard
                label="Total due"
                value={formatNgnMinor(quote.finalAmountMinor)}
                tone="brand"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Continue to secure checkout
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              loading={loading}
              onClick={requestQuote}
              disabled={!category || !handling || !inspectionConsent}
            >
              Calculate delivery price
            </Button>
            <p className="text-xs text-muted">
              Pricing uses verified pickup and delivery coordinates.
            </p>
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0 || locked}
          onClick={() => {
            setError("");
            setStep((current) => current - 1);
          }}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function StepPanel({
  step,
  current,
  title,
  copy,
  children,
}: {
  step: number;
  current: number;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <section
      data-public-order-step={step}
      hidden={step !== current}
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <CardHeader className="mb-0">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted">{copy}</p>
          </div>
        </CardHeader>
      </div>
      {children}
    </section>
  );
}

function OrderInput({
  label,
  required = true,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; required?: boolean }) {
  return (
    <FormField label={label}>
      <Input required={required} {...props} />
    </FormField>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}

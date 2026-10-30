import { useQuery } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../api/client.ts";
import { RouteLocationFields } from "../../components/shared/AddressAutocomplete.tsx";
import {
  HANDLING_OPTIONS,
  PARCEL_CATEGORY_OPTIONS,
} from "../../constants/orderOptions.ts";
import type { CustomerListResponse } from "../people/types.ts";
import { formatLocationSummary, readLocationFromForm } from "./orderIntake.ts";
import type { PricingQuote, VendorOrder } from "./types.ts";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Select,
} from "../../components/ui/index.ts";

const steps = ["Route", "Quote", "Contacts", "Parcel", "Review"];

const money = (minor: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
    minor / 100,
  );

export function VendorOrderForm({
  onCreated,
}: {
  onCreated: (order: VendorOrder) => void | Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [receiverCustomerId, setReceiverCustomerId] = useState("");
  const [senderSearch, setSenderSearch] = useState("");
  const [receiverSearch, setReceiverSearch] = useState("");
  const [sender, setSender] = useState({ name: "", phone: "", email: "" });
  const [receiver, setReceiver] = useState({ name: "", phone: "", email: "" });
  const [saveSender, setSaveSender] = useState(false);
  const [saveReceiver, setSaveReceiver] = useState(false);
  const [pickupReady, setPickupReady] = useState(false);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [category, setCategory] = useState("");
  const [handling, setHandling] = useState("");
  const [inspectionConsent, setInspectionConsent] = useState(false);
  const [sizeEstimate, setSizeEstimate] = useState("");
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState({ route: "", receiver: "" });
  const customers = useQuery({
    queryKey: ["customers", "order-form"],
    queryFn: () =>
      apiRequest<CustomerListResponse>("/people/customers?pageSize=100"),
  });
  const value = (name: string) =>
    String(new FormData(formRef.current!).get(name) ?? "").trim();

  const requestQuote = async () => {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const pickup = readLocationFromForm(data, "pickup");
    const delivery = readLocationFromForm(data, "delivery");
    setLoading(true);
    setError("");
    try {
      const created = await apiRequest<PricingQuote>("/pricing/quotes", {
        method: "POST",
        body: JSON.stringify({ pickup, delivery }),
      });
      setQuote(created);
      setStep(1);
    } catch (reason) {
      setError(
        (reason as { message?: string }).message ?? "Unable to calculate price",
      );
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    const panel = formRef.current?.querySelector<HTMLElement>(
      `[data-order-step="${step}"]`,
    );
    const invalid = [
      ...(panel?.querySelectorAll<HTMLInputElement>("input") ?? []),
    ].find((field) => !field.checkValidity());
    if (invalid) return invalid.reportValidity();
    if (step === 0) {
      if (!pickupReady || !deliveryReady)
        return setError(
          "Select pickup and delivery addresses from search, then confirm state.",
        );
      return requestQuote();
    }
    if (step === 1 && !quote)
      return setError("Calculate a price before continuing.");
    if (step === 3 && (!category || !handling || !inspectionConsent))
      return setError(
        "Parcel category, handling, and package inspection consent are compulsory.",
      );
    if (step === 3 && formRef.current) {
      const data = new FormData(formRef.current);
      const pickup = readLocationFromForm(data, "pickup");
      const delivery = readLocationFromForm(data, "delivery");
      setReview({
        route: `${formatLocationSummary(pickup)} → ${formatLocationSummary(delivery)}`,
        receiver: `${value("receiverName")} · ${value("receiverPhone")}`,
      });
    }
    setError("");
    setStep((current) => Math.min(4, current + 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quote) return setError("A valid price quote is required.");
    const data = new FormData(formRef.current!);
    const pickup = readLocationFromForm(data, "pickup");
    const delivery = readLocationFromForm(data, "delivery");
    setLoading(true);
    setError("");
    try {
      const order = await apiRequest<VendorOrder>("/orders", {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({
          senderCustomerId: customerId || undefined,
          receiverCustomerId: receiverCustomerId || undefined,
          saveSender: !customerId && saveSender,
          saveReceiver: !receiverCustomerId && saveReceiver,
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
          pickup,
          delivery,
          quoteReference: quote.publicReference,
          orderType: category,
          handling,
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
        }),
      });
      const ready = await apiRequest<VendorOrder>(`/orders/${order.id}/ready`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
      });
      await onCreated(ready);
    } catch (reason) {
      setError(
        (reason as { message?: string }).message ?? "Unable to create order",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={submit}>
      <ol className="mb-6 grid grid-cols-5 gap-2" aria-label="Order steps">
        {steps.map((label, index) => (
          <li key={label} className="min-w-0">
            <div
              className={`h-1.5 rounded-full ${index <= step ? "bg-brand" : "bg-neutral-200"}`}
            />
            <p
              className={`mt-2 truncate text-xs ${index === step ? "font-semibold text-brand" : "text-muted"}`}
            >
              {index + 1}. {label}
            </p>
          </li>
        ))}
      </ol>
      {error && (
        <Alert className="mb-4" tone="danger">
          {error}
        </Alert>
      )}

      <StepPanel
        step={0}
        current={step}
        title="Pickup and delivery route"
        copy="Search Nigerian addresses first so we can calculate the delivery price before contacts."
      >
        <RouteLocationFields
          title="Pickup location"
          namePrefix="pickup"
          onResolvedChange={setPickupReady}
        />
        <RouteLocationFields
          title="Delivery location"
          namePrefix="delivery"
          onResolvedChange={setDeliveryReady}
        />
      </StepPanel>

      <section data-order-step="1" hidden={step !== 1} className="space-y-4">
        <div>
          <h3 className="font-semibold">Estimated price</h3>
          <p className="mt-1 text-sm text-muted">
            Review the quote for this route before entering sender and receiver
            details.
          </p>
        </div>
        {quote ? (
          <Card size="sm">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Review
                label="Price"
                value={money(quote.finalAmountMinor, quote.currency)}
              />
              <Review
                label="Distance"
                value={`${(quote.distanceMetres / 1000).toFixed(1)} km`}
              />
              <Review
                label="ETA"
                value={`${Math.ceil(quote.durationSeconds / 60)} min`}
              />
              <Review
                label="Expires"
                value={new Date(quote.expiresAt).toLocaleString()}
              />
            </div>
          </Card>
        ) : (
          <Alert tone="warning">No quote yet. Go back and confirm the route.</Alert>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={() => requestQuote()}
        >
          Recalculate price
        </Button>
      </section>

      <StepPanel
        step={2}
        current={step}
        title="Customer and contacts"
        copy="Link a saved customer if available, then provide sender and receiver details."
      >
        <div>
          <OrderInput
            label="Search sender customers"
            value={senderSearch}
            onChange={(event) => setSenderSearch(event.target.value)}
            required={false}
            placeholder="Search name, phone or email"
          />
          <Select
            label="Saved sender (optional)"
            placeholder="New sender"
            selectedKey={customerId || null}
            onSelectionChange={(key) => {
              const id = String(key);
              const customer = customers.data?.items.find(
                (item) => item.id === id,
              );
              setCustomerId(customer?.id ?? "");
              setSender(
                customer
                  ? {
                      name: customer.name,
                      phone: customer.phone,
                      email: customer.email ?? "",
                    }
                  : { name: "", phone: "", email: "" },
              );
            }}
            options={(customers.data?.items ?? [])
              .filter((customer) =>
                `${customer.name} ${customer.phone} ${customer.email ?? ""}`
                  .toLowerCase()
                  .includes(senderSearch.toLowerCase()),
              )
              .map((customer) => ({
                key: customer.id,
                label: customer.name,
                description: customer.phone,
              }))}
          />
          {customerId && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setCustomerId("");
                setSender({ name: "", phone: "", email: "" });
              }}
            >
              Use new sender
            </Button>
          )}
        </div>
        <div>
          <OrderInput
            label="Search receiver customers"
            value={receiverSearch}
            onChange={(event) => setReceiverSearch(event.target.value)}
            required={false}
            placeholder="Search name, phone or email"
          />
          <Select
            label="Saved receiver (optional)"
            placeholder="New receiver"
            selectedKey={receiverCustomerId || null}
            onSelectionChange={(key) => {
              const id = String(key);
              const customer = customers.data?.items.find(
                (item) => item.id === id,
              );
              setReceiverCustomerId(customer?.id ?? "");
              setReceiver(
                customer
                  ? {
                      name: customer.name,
                      phone: customer.phone,
                      email: customer.email ?? "",
                    }
                  : { name: "", phone: "", email: "" },
              );
            }}
            options={(customers.data?.items ?? [])
              .filter((customer) =>
                `${customer.name} ${customer.phone} ${customer.email ?? ""}`
                  .toLowerCase()
                  .includes(receiverSearch.toLowerCase()),
              )
              .map((customer) => ({
                key: customer.id,
                label: customer.name,
                description: customer.phone,
              }))}
          />
          {receiverCustomerId && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setReceiverCustomerId("");
                setReceiver({ name: "", phone: "", email: "" });
              }}
            >
              Use new receiver
            </Button>
          )}
        </div>
        <OrderInput
          name="senderName"
          label="Sender name"
          value={sender.name}
          onChange={(event) =>
            setSender({ ...sender, name: event.target.value })
          }
        />
        <OrderInput
          name="senderPhone"
          label="Sender phone"
          type="tel"
          value={sender.phone}
          onChange={(event) =>
            setSender({ ...sender, phone: event.target.value })
          }
        />
        <OrderInput
          name="senderEmail"
          label="Sender email (optional)"
          type="email"
          required={false}
          value={sender.email}
          onChange={(event) =>
            setSender({ ...sender, email: event.target.value })
          }
        />
        <OrderInput
          name="receiverName"
          label="Receiver name"
          value={receiver.name}
          onChange={(event) =>
            setReceiver({ ...receiver, name: event.target.value })
          }
        />
        <OrderInput
          name="receiverPhone"
          label="Receiver phone"
          type="tel"
          value={receiver.phone}
          onChange={(event) =>
            setReceiver({ ...receiver, phone: event.target.value })
          }
        />
        <OrderInput
          name="receiverEmail"
          label="Receiver email (optional)"
          type="email"
          required={false}
          value={receiver.email}
          onChange={(event) =>
            setReceiver({ ...receiver, email: event.target.value })
          }
        />
        {!customerId && (
          <Checkbox isSelected={saveSender} onChange={setSaveSender}>
            Save sender to customers
          </Checkbox>
        )}
        {!receiverCustomerId && (
          <Checkbox isSelected={saveReceiver} onChange={setSaveReceiver}>
            Save receiver to customers
          </Checkbox>
        )}
      </StepPanel>

      <StepPanel
        step={3}
        current={step}
        title="Parcel information"
        copy="Category and handling are compulsory and are shared with fulfilment."
      >
        <Select
          label="Parcel category"
          placeholder="Select category"
          selectedKey={category || null}
          onSelectionChange={(key) => setCategory(String(key))}
          options={[...PARCEL_CATEGORY_OPTIONS]}
        />
        <Select
          label="Handling"
          placeholder="Select handling"
          selectedKey={handling || null}
          onSelectionChange={(key) => setHandling(String(key))}
          options={[...HANDLING_OPTIONS]}
        />
        <OrderInput name="itemDescription" label="Item description" />
        <OrderInput
          name="itemValue"
          label="Value (NGN)"
          type="number"
          min="0"
          step="0.01"
        />
        <OrderInput
          name="itemLength"
          label="Length (cm)"
          type="number"
          min="0.1"
          max="1000"
          step="0.1"
        />
        <OrderInput
          name="itemWidth"
          label="Width (cm)"
          type="number"
          min="0.1"
          max="1000"
          step="0.1"
        />
        <OrderInput
          name="itemHeight"
          label="Height (cm)"
          type="number"
          min="0.1"
          max="1000"
          step="0.1"
        />
        <OrderInput
          name="itemWeight"
          label="Weight (kg)"
          type="number"
          min="0.01"
          step="0.01"
        />
        <OrderInput
          name="itemQuantity"
          label="Quantity"
          type="number"
          min="1"
          max="1000"
          defaultValue="1"
        />
        <Select
          label="Parcel size (optional)"
          selectedKey={sizeEstimate || null}
          onSelectionChange={(key) => setSizeEstimate(String(key))}
          options={["SMALL", "MEDIUM", "LARGE"].map((key) => ({
            key,
            label: key,
          }))}
        />
        <div className="md:col-span-2 rounded-xl bg-neutral-50 p-4">
          <Checkbox
            isSelected={inspectionConsent}
            onChange={setInspectionConsent}
          >
            I consent to package inspection and acknowledge that insurance or
            exceptional handling charges will be shown before confirmation.
          </Checkbox>
        </div>
      </StepPanel>

      <section data-order-step="4" hidden={step !== 4} className="space-y-4">
        <div>
          <h3 className="font-semibold">Review order</h3>
          <p className="mt-1 text-sm text-muted">
            Confirm the route, price, and parcel information before creating the
            order.
          </p>
        </div>
        <Card size="sm">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Review label="Route" value={review.route} />
            <Review
              label="Price"
              value={
                quote
                  ? money(quote.finalAmountMinor, quote.currency)
                  : "—"
              }
            />
            <Review
              label="Parcel"
              value={
                PARCEL_CATEGORY_OPTIONS.find((item) => item.key === category)
                  ?.label ?? category
              }
            />
            <Review
              label="Handling"
              value={
                HANDLING_OPTIONS.find((item) => item.key === handling)?.label ??
                handling
              }
            />
            <Review label="Receiver" value={review.receiver} />
          </div>
        </Card>
      </section>

      <div className="mt-6 flex justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          Back
        </Button>
        {step < 4 ? (
          <Button type="button" loading={loading} onClick={() => void next()}>
            Continue
          </Button>
        ) : (
          <Button loading={loading}>Create order</Button>
        )}
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
  children: React.ReactNode;
}) {
  return (
    <section
      data-order-step={step}
      hidden={step !== current}
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{copy}</p>
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
function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium">{value || "—"}</p>
    </div>
  );
}

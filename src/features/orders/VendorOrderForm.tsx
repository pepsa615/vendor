import { useQuery } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { apiRequest } from "../../api/client.ts";
import { RouteLocationFields } from "../../components/shared/AddressAutocomplete.tsx";
import {
  HANDLING_OPTIONS,
  PARCEL_CATEGORY_OPTIONS,
} from "../../constants/orderOptions.ts";
import type { CustomerListResponse } from "../people/types.ts";
import {
  formatLocationSummary,
  readLocationFromForm,
} from "./orderIntake.ts";
import type { VendorOrder } from "./types.ts";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Select,
} from "../../components/ui/index.ts";

const steps = ["Contacts", "Route", "Parcel", "Review"];

export function VendorOrderForm({
  onCreated,
}: {
  onCreated: (order: VendorOrder) => void | Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [pickupReady, setPickupReady] = useState(false);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [category, setCategory] = useState("");
  const [handling, setHandling] = useState("");
  const [inspectionConsent, setInspectionConsent] = useState(false);
  const [sizeEstimate, setSizeEstimate] = useState("");
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

  const next = () => {
    const panel = formRef.current?.querySelector<HTMLElement>(
      `[data-order-step="${step}"]`,
    );
    const invalid = [
      ...(panel?.querySelectorAll<HTMLInputElement>("input") ?? []),
    ].find((field) => !field.checkValidity());
    if (invalid) return invalid.reportValidity();
    if (step === 1 && (!pickupReady || !deliveryReady))
      return setError(
        "Select pickup and delivery addresses from search, then confirm state.",
      );
    if (step === 2 && (!category || !handling || !inspectionConsent))
      return setError(
        "Parcel category, handling, and package inspection consent are compulsory.",
      );
    if (step === 2 && formRef.current) {
      const data = new FormData(formRef.current);
      const pickup = readLocationFromForm(data, "pickup");
      const delivery = readLocationFromForm(data, "delivery");
      setReview({
        route: `${formatLocationSummary(pickup)} → ${formatLocationSummary(delivery)}`,
        receiver: `${value("receiverName")} · ${value("receiverPhone")}`,
      });
    }
    setError("");
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          customerId: customerId || undefined,
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
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Order steps">
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
        title="Customer and contacts"
        copy="Link a saved customer if available, then provide sender and receiver details."
      >
        <div className="md:col-span-2">
          <Select
            label="Existing customer (optional)"
            placeholder="Create without linking a saved customer"
            selectedKey={customerId || null}
            onSelectionChange={(key) => setCustomerId(String(key))}
            options={(customers.data?.items ?? []).map((customer) => ({
              key: customer.id,
              label: customer.name,
              description: customer.phone,
            }))}
          />
        </div>
        <OrderInput name="senderName" label="Sender name" />
        <OrderInput name="senderPhone" label="Sender phone" type="tel" />
        <OrderInput
          name="senderEmail"
          label="Sender email (optional)"
          type="email"
          required={false}
        />
        <OrderInput name="receiverName" label="Receiver name" />
        <OrderInput name="receiverPhone" label="Receiver phone" type="tel" />
        <OrderInput
          name="receiverEmail"
          label="Receiver email (optional)"
          type="email"
          required={false}
        />
      </StepPanel>

      <StepPanel
        step={1}
        current={step}
        title="Pickup and delivery route"
        copy="Search Nigerian addresses, add street or landmark details, and confirm state. Pricing happens when this order is sent to Open Dispatch."
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

      <StepPanel
        step={2}
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

      <section data-order-step="3" hidden={step !== 3} className="space-y-4">
        <div>
          <h3 className="font-semibold">Review order</h3>
          <p className="mt-1 text-sm text-muted">
            Confirm the route and parcel information. This creates the order
            without selecting mobility or requesting a price.
          </p>
        </div>
        <Card size="sm">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Review label="Route" value={review.route} />
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
          onClick={() => setStep((current) => current - 1)}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={next}>
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

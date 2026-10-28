import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "../api/client.ts";
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Skeleton,
} from "../components/ui/index.ts";
import type { PricingSetting } from "../features/orders/types.ts";
export default function SettingsPage() {
  const query = useQuery({
    queryKey: ["pricing"],
    queryFn: () => apiRequest<PricingSetting>("/pricing"),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (query.isLoading) return <Skeleton className="h-96" />;
  const setting = query.data;
  const defaults =
    setting?.tiers.length === 4
      ? setting.tiers
      : [
          { tierNumber: 1, minMetres: 0, maxMetres: 5000, discountBps: 0 },
          { tierNumber: 2, minMetres: 5000, maxMetres: 10000, discountBps: 0 },
          { tierNumber: 3, minMetres: 10000, maxMetres: 15000, discountBps: 0 },
          { tierNumber: 4, minMetres: 15000, maxMetres: 25000, discountBps: 0 },
        ];
  return (
    <section>
      <div>
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Set the same-city rate used on your public customer order page.
        </p>
      </div>
      {message && (
        <Alert className="mt-5" tone="success">
          {message}
        </Alert>
      )}
      {error && (
        <Alert className="mt-5" tone="danger">
          {error}
        </Alert>
      )}
      <Card className="mt-6 max-w-4xl p-6">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const maxima = defaults.map((_, index) =>
              Math.round(Number(data.get(`max-${index}`)) * 1000),
            );
            const tiers = defaults.map((_, index) => ({
              tierNumber: index + 1,
              minMetres: index === 0 ? 0 : maxima[index - 1],
              maxMetres: maxima[index],
              discountBps: Math.round(
                Number(data.get(`discount-${index}`)) * 100,
              ),
            }));
            try {
              for (let index = 1; index < tiers.length; index += 1)
                if (tiers[index].minMetres !== tiers[index - 1].maxMetres)
                  throw new Error(
                    `Tier ${index + 1} must begin where tier ${index} ends`,
                  );
              await apiRequest("/pricing", {
                method: "PUT",
                headers: { "idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({
                  pricePerKmMinor: Math.round(
                    Number(data.get("pricePerKm")) * 100,
                  ),
                  tiers,
                }),
              });
              setError("");
              setMessage("Pricing settings updated.");
              await query.refetch();
            } catch (reason) {
              setMessage("");
              setError(
                (reason as { message?: string }).message ??
                  "Unable to save pricing",
              );
            }
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Price per kilometre (NGN)">
              <Input
                name="pricePerKm"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={
                  setting?.pricePerKmMinor ? setting.pricePerKmMinor / 100 : ""
                }
                required
              />
            </FormField>
            <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
              <b>Pricing formula</b>
              <p className="mt-1">
                Distance × price/km, less the matching tier discount. Values are
                rounded once to kobo.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <h2 className="font-semibold">Four continuous distance tiers</h2>
            {defaults.map((tier, index) => (
              <div
                className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-4"
                key={tier.tierNumber}
              >
                <div className="font-semibold">Tier {tier.tierNumber}</div>
                <FormField label="From (km, derived)">
                  <Input
                    type="number"
                    defaultValue={tier.minMetres / 1000}
                    readOnly
                    aria-describedby={`tier-boundary-${index}`}
                  />
                </FormField>
                <FormField label="To (km)">
                  <Input
                    name={`max-${index}`}
                    type="number"
                    min="0.001"
                    step="0.001"
                    defaultValue={tier.maxMetres / 1000}
                    required
                  />
                </FormField>
                <FormField label="Discount (%)">
                  <Input
                    name={`discount-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={tier.discountBps / 100}
                    required
                  />
                </FormField>
                <p
                  id={`tier-boundary-${index}`}
                  className="text-xs text-muted md:col-span-4"
                >
                  {index < defaults.length - 1
                    ? `Applies from ${tier.minMetres / 1000} km inclusive up to ${tier.maxMetres / 1000} km exclusive.`
                    : `Applies from ${tier.minMetres / 1000} km through ${tier.maxMetres / 1000} km inclusive.`}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              Preview: 8 km at ₦{Number(setting?.pricePerKmMinor ?? 0) / 100}/km
              before discount.
            </p>
            <Button>Save pricing</Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

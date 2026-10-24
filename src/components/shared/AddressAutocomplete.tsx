import { useEffect, useId, useState } from "react";
import { NIGERIA_STATE_OPTIONS } from "../../constants/nigeriaStates.ts";
import { composeLocationAddress } from "../../features/orders/orderIntake.ts";
import { apiRequest } from "../../api/client.ts";
import { Alert, FormField, Input, Select } from "../ui/index.ts";

export type PlaceSuggestion = { placeId: string; description: string };

export type ResolvedPlace = {
  placeId: string;
  formattedAddress: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  latitude: number;
  longitude: number;
};

export function RouteLocationFields({
  title,
  namePrefix,
  disabled = false,
  onResolvedChange,
}: {
  title: string;
  namePrefix: "pickup" | "delivery";
  disabled?: boolean;
  onResolvedChange?: (ready: boolean) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [stateKey, setStateKey] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [resolved, setResolved] = useState<ResolvedPlace | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const googleAddress = resolved?.formattedAddress ?? "";
  const composedAddress = composeLocationAddress(street, googleAddress);
  const ready = Boolean(resolved && stateKey && composedAddress);

  useEffect(() => {
    onResolvedChange?.(ready);
  }, [ready, onResolvedChange]);

  useEffect(() => {
    if (disabled) return;
    if (resolved?.formattedAddress === query) return setSuggestions([]);
    const trimmed = query.trim();
    if (trimmed.length < 3) return setSuggestions([]);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void apiRequest<PlaceSuggestion[]>(
        `/public/places/autocomplete?input=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal },
      )
        .then((items) => {
          setSuggestions(items);
          setSearchError("");
        })
        .catch((reason: { message?: string }) => {
          setSuggestions([]);
          setSearchError(reason.message ?? "Address search is unavailable");
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, resolved, disabled]);

  async function select(item: PlaceSuggestion) {
    setLoading(true);
    setSearchError("");
    try {
      const details = await apiRequest<ResolvedPlace>(
        `/public/places/details?placeId=${encodeURIComponent(item.placeId)}`,
      );
      setResolved(details);
      setQuery(details.formattedAddress);
      setStateKey(details.state);
      if (details.postalCode) setPostalCode(details.postalCode);
      setSuggestions([]);
    } catch (reason) {
      setResolved(null);
      setSearchError(
        (reason as { message?: string }).message ??
          "Unable to resolve that address",
      );
    } finally {
      setLoading(false);
    }
  }

  const needsSelection = query.trim().length >= 3 && !resolved && !disabled;

  return (
    <section className="md:col-span-2 space-y-4 rounded-xl border border-border bg-neutral-50/60 p-4">
      <h4 className="font-medium">{title}</h4>
      <div className="relative">
        <FormField label="Search address">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setResolved(null);
              setStateKey("");
            }}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={suggestions.length > 0 ? listId : undefined}
            aria-expanded={suggestions.length > 0}
            disabled={disabled}
            required
            placeholder="Start typing street, area, or landmark"
          />
        </FormField>
        {searchError && (
          <Alert className="mt-2" tone="warning">
            {searchError}
          </Alert>
        )}
        {needsSelection && !loading && (
          <p className="mt-1 text-xs text-warning-700">
            Select an address from the suggestions to continue.
          </p>
        )}
        {suggestions.length > 0 && (
          <ul
            id={listId}
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-panel shadow-soft"
          >
            {suggestions.map((item) => (
              <li key={item.placeId}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 focus-visible:bg-neutral-100 focus-visible:outline-none"
                  onClick={() => void select(item)}
                >
                  {item.description}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Street / unit details (optional)">
          <Input
            name={`${namePrefix}Street`}
            value={street}
            onChange={(event) => setStreet(event.target.value)}
            disabled={disabled}
            placeholder="Apartment, floor, or gate"
          />
        </FormField>
        <FormField label="Landmark (optional)">
          <Input
            name={`${namePrefix}Landmark`}
            value={landmark}
            onChange={(event) => setLandmark(event.target.value)}
            disabled={disabled}
            placeholder="Nearby landmark for riders"
          />
        </FormField>
        <FormField label="City">
          <Input
            value={resolved?.city ?? ""}
            readOnly
            disabled={disabled}
            required
            aria-readonly
          />
        </FormField>
        <Select
          label="State"
          selectedKey={stateKey || null}
          onSelectionChange={(key) => setStateKey(String(key))}
          isDisabled={disabled || !resolved}
          options={NIGERIA_STATE_OPTIONS}
        />
        <FormField label="Postal code (optional)">
          <Input
            name={`${namePrefix}PostalCode`}
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            disabled={disabled}
          />
        </FormField>
      </div>
      {resolved && (
        <p className="text-xs text-muted">
          Resolved: {composedAddress || googleAddress}
        </p>
      )}
      <input type="hidden" name={`${namePrefix}GoogleAddress`} value={googleAddress} />
      <input type="hidden" name={`${namePrefix}City`} value={resolved?.city ?? ""} />
      <input type="hidden" name={`${namePrefix}PlaceId`} value={resolved?.placeId ?? ""} />
      <input type="hidden" name={`${namePrefix}State`} value={stateKey} required />
      <input type="hidden" name={`${namePrefix}Address`} value={composedAddress} required />
    </section>
  );
}

/** @deprecated Use RouteLocationFields */
export const AddressAutocomplete = RouteLocationFields;

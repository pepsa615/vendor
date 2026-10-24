export type OrderLocationPrefix = "pickup" | "delivery";

export type OrderLocationInput = {
  address: string;
  city: string;
  state: string;
  country: "NG";
  postalCode?: string;
  landmark?: string;
  placeId?: string;
};

/** Public customer-link collects mobility at intake (PDF); vendor-assisted does not (ADR 0008). */
export const PUBLIC_ORDER_INCLUDES_MOBILITY = true;
export const VENDOR_ORDER_INCLUDES_MOBILITY = false;

export function composeLocationAddress(
  streetUnit: string,
  googleAddress: string,
) {
  return [streetUnit.trim(), googleAddress.trim()].filter(Boolean).join(", ");
}

export function readLocationFromForm(
  data: FormData,
  prefix: OrderLocationPrefix,
): OrderLocationInput {
  const google = String(data.get(`${prefix}GoogleAddress`) ?? "").trim();
  const street = String(data.get(`${prefix}Street`) ?? "").trim();
  const postalCode = String(data.get(`${prefix}PostalCode`) ?? "").trim();
  const landmark = String(data.get(`${prefix}Landmark`) ?? "").trim();
  const placeId = String(data.get(`${prefix}PlaceId`) ?? "").trim();
  return {
    address: composeLocationAddress(street, google),
    city: String(data.get(`${prefix}City`) ?? "").trim(),
    state: String(data.get(`${prefix}State`) ?? "").trim(),
    country: "NG",
    ...(postalCode ? { postalCode } : {}),
    ...(landmark ? { landmark } : {}),
    ...(placeId ? { placeId } : {}),
  };
}

export function formatLocationSummary(location: {
  address?: string;
  city?: string;
  state?: string;
  landmark?: string;
}) {
  const line = [location.address, location.city, location.state]
    .filter(Boolean)
    .join(", ");
  if (!line && !location.landmark) return "—";
  if (!location.landmark) return line;
  return line ? `${line} · Landmark: ${location.landmark}` : location.landmark;
}

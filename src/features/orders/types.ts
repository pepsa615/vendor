export interface OrderLocationRecord {
  address: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  normalizedAddress?: string;
  placeId?: string;
}

export interface CheckoutDetails {
  dynamicAccountNumber: string;
  bankName: string;
  expiresAt: string;
}
export interface VendorOrder {
  id: string;
  publicReference: string;
  source: "VENDOR_DIRECT" | "CUSTOMER_LINK";
  status: string;
  paymentStatus: string;
  orderType: string;
  handling: string;
  mobilityMethod?: string;
  itemDescription: string;
  parcelMetadata?: {
    category?: string;
    description?: string;
    handling?: string;
    declaredValue?: number;
    dimensionsCm?: { length?: number; width?: number; height?: number };
    weightKg?: number;
    quantity?: number;
    inspectionConsent?: boolean;
  };
  distanceMetres?: number;
  amountMinor?: number;
  currency: string;
  sender: { name: string; phone: string; email?: string };
  receiver: { name: string; phone: string; email?: string };
  pickup: OrderLocationRecord;
  delivery: OrderLocationRecord;
  deliveryStatus: string;
  checkout?: CheckoutDetails;
  batchItem?: { batchId: string } | null;
  manifestItems?: Array<{ id: string }>;
  dispatchItems?: Array<{
    dispatchId: string;
    dispatch?: {
      id: string;
      status: string;
      publicReference: string;
      mode: string;
    };
  }>;
  createdAt: string;
}

/** M5 fulfilment projected onto order.deliveryStatus (not VendorOrderStatus). */
export const ORDER_FULFILLMENT_STATUSES = [
  "PENDING_MATCH",
  "PAIRED",
  "PICKED_UP",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;

export function displayOrderStatus(order: VendorOrder): string {
  const linked = order.dispatchItems?.[0]?.dispatch?.status;
  if (linked) return linked;
  if (
    (ORDER_FULFILLMENT_STATUSES as readonly string[]).includes(
      order.deliveryStatus,
    )
  )
    return order.deliveryStatus;
  return order.status;
}

export function isOrderOnDispatch(order: VendorOrder): boolean {
  return Boolean(
    order.dispatchItems?.length ||
      (ORDER_FULFILLMENT_STATUSES as readonly string[]).includes(
        order.deliveryStatus,
      ),
  );
}
export interface OrderListResponse {
  items: VendorOrder[];
  total: number;
  page: number;
  pageSize: number;
}
export interface PricingSetting {
  pricePerKmMinor: number | null;
  currency: string;
  tiers: Array<{
    tierNumber: number;
    minMetres: number;
    maxMetres: number;
    discountBps: number;
  }>;
}
export interface PublicVendor {
  publicSlug: string;
  businessName: string;
  phone: string;
  email: string;
  tagline?: string;
  description?: string;
}
export interface PricingQuote {
  publicReference: string;
  pickup: { normalizedAddress: string };
  delivery: { normalizedAddress: string };
  distanceMetres: number;
  durationSeconds: number;
  pricePerKmMinor: number;
  discountBps: number;
  baseAmountMinor: number;
  finalAmountMinor: number;
  currency: string;
  expiresAt: string;
}

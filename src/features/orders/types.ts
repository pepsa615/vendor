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
  checkout?: CheckoutDetails;
  batchItem?: { batchId: string } | null;
  manifestItems?: Array<{ id: string }>;
  dispatchItems?: Array<{ dispatchId: string }>;
  createdAt: string;
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

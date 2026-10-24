import type { operations } from "../../api/generated/schema.ts";

export type DispatchStatus =
  | "PENDING_MATCH"
  | "PAIRED"
  | "PICKED_UP"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";
export type DispatchPreviewRequest = NonNullable<
  operations["DispatchController_preview_v1"]["requestBody"]
>["content"]["application/json"];
export type CreateDispatchRequest = NonNullable<
  operations["DispatchController_create_v1"]["requestBody"]
>["content"]["application/json"];

export type DispatchPreview = DispatchPreviewRequest & {
  previewToken: string;
  orderIds: string[];
  stops: Array<{ orderId: string; sequence: number; address: string }>;
  pickup: { address: string; latitude?: number; longitude?: number };
  distanceMetres: number;
  durationSeconds: number;
  totalAmountMinor: number;
  revenueShareBps?: number;
  suggestedPayoutMinor?: number;
  feeAmountMinor: number;
  fundingRequiredMinor: number;
  currency: string;
  expiresAt: string;
};

export interface Dispatch {
  id: string;
  publicReference: string;
  mode: "OWN_FLEET" | "GENERAL_POOL";
  status: DispatchStatus;
  currency: string;
  payoutAmountMinor?: number;
  feeAmountMinor: number;
  fundingRequiredMinor: number;
  optimizedDistanceMetres: number;
  optimizedDurationSeconds: number;
  routeSnapshot: {
    stops: Array<{ orderId: string; sequence: number; address: string }>;
  };
  createdAt: string;
  dispatcher?: { approvedRevision?: { firstName: string; lastName: string } };
  items: Array<{
    order: {
      id: string;
      publicReference: string;
      amountMinor?: number;
      source: "VENDOR_DIRECT" | "CUSTOMER_LINK";
      paymentStatus: string;
      receiver: { name?: string; phone?: string; email?: string };
      itemDescription: string;
      deliveryStatus: string;
      pickup: { address: string; city: string };
      delivery: { address: string; city: string; state?: string };
    };
  }>;
  events?: Array<{
    id: string;
    toStatus: DispatchStatus;
    source: string;
    message?: string;
    createdAt: string;
  }>;
  trackingPoints?: Array<{
    latitude: string;
    longitude: string;
    recordedAt: string;
  }>;
}

export interface DispatchPage {
  items: Dispatch[];
  total: number;
  page: number;
  pageSize: number;
}

export type ManifestStatus =
  | "SENT"
  | "CHANGE_REQUESTED"
  | "DECLINED"
  | "ACCEPTED"
  | "IN_TRANSIT"
  | "REROUTED"
  | "REMOTE_LOCATION"
  | "DELIVERED";

export interface VendorSummary {
  id: string;
  businessName: string;
}
export interface BatchSummary {
  id: string;
  publicReference: string;
  status: "FINALIZED" | "MANIFESTED";
  createdAt: string;
  _count: { items: number };
}
export interface ManifestRevision {
  id: string;
  version: number;
  name: string;
  originState: string;
  originCity: string;
  destinationState: string;
  destinationCity: string;
  createdAt: string;
  _count?: { items: number };
  items?: Array<{
    id: string;
    order?: {
      publicReference: string;
      itemDescription: string;
      receiver: { name?: string; phone?: string };
      delivery: { address?: string; city?: string; state?: string };
      deliveryStatus: string;
      paymentStatus: string;
      amountMinor?: number;
      currency: string;
      updatedAt: string;
      dispatchItems: Array<{
        dispatch: {
          publicReference: string;
          optimizedDistanceMetres: number;
          optimizedDurationSeconds: number;
          events: Array<{
            id: string;
            toStatus: string;
            source: string;
            message?: string;
            createdAt: string;
          }>;
        };
      }>;
    };
    batch?: { publicReference: string };
  }>;
}
export interface ManifestAction {
  id: string;
  action: string;
  fromStatus?: ManifestStatus;
  toStatus: ManifestStatus;
  message?: string;
  createdAt: string;
}
export interface Manifest {
  id: string;
  publicReference: string;
  waybillNumber: string;
  status: ManifestStatus;
  currentVersion: number;
  createdAt: string;
  originVendor: VendorSummary;
  destinationVendor: VendorSummary;
  revisions: ManifestRevision[];
  actions?: ManifestAction[];
  transportAssignments?: Array<{
    id: string;
    active: boolean;
    reason: string;
    assignedAt: string;
    endedAt?: string;
    dispatcherRevision: {
      firstName: string;
      lastName: string;
      phone: string;
      vehicleType: string;
      vehicleBrand?: string;
      plateNumber?: string;
    };
  }>;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Validation {
  total: number;
  valid: Array<{ id: string; trackingId: string }>;
  invalid: Array<{ trackingId: string; reason: string }>;
  duplicates: string[];
  previewToken?: string;
  expiresAt?: string;
}

export type DispatcherStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DISABLED";

export interface DispatcherListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  vehicleType: string;
  vehicleBrand?: string;
  plateNumber?: string;
  revenueSharePct: string;
  status: DispatcherStatus;
  pendingRevisionStatus?: string | null;
  availability: boolean;
  totalOrdersPicked: number;
  createdAt: string;
}

export interface DispatcherListResponse {
  items: DispatcherListItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: { online: number; active: number; inactive: number; total: number };
}

export interface DispatcherRevision {
  id: string;
  version: number;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  identityType: string;
  identityNumberMasked: string;
  identityExpiry?: string;
  homeAddress: string;
  state: string;
  city: string;
  engagementType: string;
  vehicleType: string;
  vehicleBrand?: string;
  plateNumber?: string;
  vehicleRegistrationDate: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorEmail?: string;
  guarantorNinMasked: string | null;
  guarantorAddress: string;
  revenueSharePct: string;
  decisionReason?: string;
  correctionFields: string[];
  documents: Array<{
    id: string;
    documentType: string;
    originalName: string;
    status: string;
  }>;
}

export interface DispatcherDetail {
  id: string;
  status: DispatcherStatus;
  availability: boolean;
  approvedRevision: DispatcherRevision | null;
  latestRevision: DispatcherRevision;
  selfieUrl?: string | null;
  riderOnline?: boolean | null;
  riderLocationObservedAt?: string | null;
}

export interface DispatcherLocation {
  latitude: number;
  longitude: number;
  observedAt: string | null;
  online: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  createdAt: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

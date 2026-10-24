import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/client.ts";
import type { components } from "../api/generated/schema.ts";

export type VendorProfile = components["schemas"]["VendorProfileResponseDto"];
export type PublicOrderLink = components["schemas"]["PublicOrderLinkDto"];

export const vendorProfileQueryKey = ["profile"] as const;

export function useVendorProfile(enabled = true) {
  return useQuery({
    queryKey: vendorProfileQueryKey,
    queryFn: () => apiRequest<VendorProfile>("/vendor/profile"),
    enabled,
  });
}

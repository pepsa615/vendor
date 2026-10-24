export type NavigationItem = {
  label: string;
  href: string;
  permission: string | readonly string[];
};

export type NavigationGroup = NavigationItem & {
  children?: readonly NavigationItem[];
};

export const navigation: readonly NavigationGroup[] = [
  { label: "Dashboard", href: "/dashboard", permission: "dashboard.read" },
  {
    label: "Operations",
    href: "/operations",
    permission: "operations.read",
    children: [
      {
        label: "Dispatch Activities",
        href: "/operations?view=dispatch-activities",
        permission: "operations.read",
      },
      {
        label: "Delivery Report",
        href: "/operations?view=delivery-report",
        permission: "operations.read",
      },
      {
        label: "Assigned Manifest",
        href: "/operations?view=assigned-manifests",
        permission: "operations.read",
      },
    ],
  },
  {
    label: "Manifest",
    href: "/manifest",
    permission: "manifests.read",
    children: [
      {
        label: "Batching",
        href: "/manifest?view=batching",
        permission: "manifests.read",
      },
      {
        label: "Travel Manifest",
        href: "/manifest?view=travel-manifest",
        permission: "manifests.read",
      },
    ],
  },
  {
    label: "Open Dispatch",
    href: "/open-dispatch",
    permission: "dispatch.read",
    children: [
      {
        label: "Runway Manifest",
        href: "/open-dispatch?view=runway-manifest",
        permission: "dispatch.read",
      },
      {
        label: "Customer Orders",
        href: "/open-dispatch?view=customer-orders",
        permission: "dispatch.read",
      },
      {
        label: "Open Dispatch",
        href: "/open-dispatch?view=open-dispatch",
        permission: "dispatch.read",
      },
    ],
  },
  {
    label: "Account",
    href: "/account",
    permission: ["settlement.read", "wallet.read"],
    children: [
      {
        label: "Settlement Ledger",
        href: "/account?view=settlement-ledger",
        permission: "settlement.read",
      },
      {
        label: "Wallet",
        href: "/account?view=wallet",
        permission: "wallet.read",
      },
    ],
  },
  {
    label: "People",
    href: "/people",
    permission: [
      "people.dispatchers.read",
      "people.customers.read",
      "staff.read",
    ],
    children: [
      {
        label: "Dispatchers",
        href: "/people/dispatchers",
        permission: "people.dispatchers.read",
      },
      {
        label: "Customers",
        href: "/people/customers",
        permission: "people.customers.read",
      },
      { label: "Staff", href: "/people/staff", permission: "staff.read" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    permission: ["payment-settings.read", "roles.read", "vendor.profile.read"],
    children: [
      {
        label: "Payment",
        href: "/settings",
        permission: "payment-settings.read",
      },
      {
        label: "Staff Roles",
        href: "/settings/roles",
        permission: "roles.read",
      },
      {
        label: "Profile",
        href: "/settings/profile",
        permission: "vendor.profile.read",
      },
    ],
  },
] as const;

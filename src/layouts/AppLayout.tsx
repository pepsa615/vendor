import {
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  LogOut,
  PackageCheck,
  Settings,
  Truck,
  UserRoundCog,
  Users,
  WalletCards,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Avatar } from "../components/ui/Avatar.tsx";
import { Button } from "../components/ui/Button.tsx";
import {
  navigation,
  type NavigationGroup,
  type NavigationItem,
} from "../constants/navigation.ts";
import { useSession } from "../contexts/SessionContext.tsx";
import { HeaderTools } from "../components/shared/HeaderTools.tsx";
import { useVendorProfile } from "../hooks/useVendorProfile.ts";

const AlertDialog = lazy(() =>
  import("../components/ui/AlertDialog.tsx").then((module) => ({
    default: module.AlertDialog,
  })),
);
const Dropdown = lazy(() =>
  import("../components/ui/Dropdown.tsx").then((module) => ({
    default: module.Dropdown,
  })),
);

const icons = {
  Dashboard: Gauge,
  Operations: PackageCheck,
  Manifest: CircleDollarSign,
  "Open Dispatch": Truck,
  Account: WalletCards,
  People: Users,
  Settings: UserRoundCog,
} as const;

function permits(
  permission: string | readonly string[],
  hasPermission: (permission: string) => boolean,
) {
  return typeof permission === "string"
    ? hasPermission(permission)
    : permission.some(hasPermission);
}

function visibleChildren(
  item: NavigationGroup,
  hasPermission: (permission: string) => boolean,
) {
  return item.children?.filter((child) =>
    permits(child.permission, hasPermission),
  );
}

export function AppLayout() {
  const { session, hasPermission, logout } = useSession();
  const profile = useVendorProfile(Boolean(session));
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const visible = navigation.filter((item) =>
    permits(item.permission, hasPermission),
  );
  const activeGroup = visible.find(
    (item) => item.children && pathname.startsWith(item.href),
  )?.label;
  const [expanded, setExpanded] = useState<string | null>(activeGroup ?? null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const businessName =
    profile.data?.businessName ?? session?.vendor.businessName ?? "Pepsa";
  const logoUrl = profile.data?.logoUrl ?? undefined;
  const pageTitle =
    pathname === "/dashboard"
      ? "Dashboard"
      : pathname.startsWith("/operations")
        ? new URLSearchParams(search).get("view") === "delivery-report"
          ? "Delivery Report"
          : "Dispatch Activities"
        : (activeGroup ?? "Pepsa Vendor");

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between bg-[#b40009] px-5 text-white shadow-lg shadow-brand-900/10 lg:px-12">
        <img
          src="/pepsa-wordmark.svg"
          alt="Pepsa"
          className="w-28 brightness-0 invert"
        />
        <div className="flex items-center gap-3">
          <HeaderTools />
          <Suspense
            fallback={
              <Avatar
                src={logoUrl}
                name={session?.name ?? businessName}
                size="sm"
                className="size-9 bg-white"
              />
            }
          >
            <Dropdown
              align="end"
              size="sm"
              label={
                <>
                  <Avatar
                    src={logoUrl}
                    name={session?.name ?? businessName}
                    size="sm"
                    className="size-7 bg-brand-50"
                  />
                  <span className="hidden max-w-32 truncate sm:inline">
                    {session?.name}
                  </span>
                </>
              }
              items={[
                {
                  key: "profile",
                  label: "My profile",
                  description: session?.email,
                },
                { key: "logout", label: "Logout", danger: true },
              ]}
              onAction={(key) =>
                key === "profile"
                  ? navigate("/settings/profile")
                  : setLogoutOpen(true)
              }
            />
          </Suspense>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[246px_1fr]">
        <aside className="flex border-b border-border bg-panel px-4 py-4 lg:sticky lg:top-[76px] lg:h-[calc(100vh-76px)] lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <a className="flex items-center gap-3 px-3" href="/dashboard">
            <Avatar
              src={logoUrl}
              name={businessName}
              size="lg"
              className="size-14 border border-brand-100 bg-white text-xl font-black text-brand shadow-md"
            />
            <span className="min-w-0">
              <span className="block truncate text-xl font-bold text-foreground">
                {businessName}
              </span>
              <span className="block text-sm text-neutral-400">Express</span>
            </span>
          </a>

          <nav
            className="ml-4 flex gap-2 overflow-x-auto lg:ml-0 lg:mt-10 lg:flex-1 lg:flex-col lg:gap-2 lg:overflow-y-auto"
            aria-label="Primary navigation"
          >
            {visible.map((item) => {
              const Icon = icons[item.label as keyof typeof icons] ?? Settings;
              const children = visibleChildren(item, hasPermission);
              const groupActive =
                pathname === item.href ||
                Boolean(item.children && pathname.startsWith(`${item.href}/`));
              const isOpen = expanded === item.label;

              if (!children?.length) {
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex min-h-10 items-center gap-3 whitespace-nowrap rounded-md px-3 text-sm ${isActive ? "bg-brand-50 font-medium text-brand" : "text-neutral-400 hover:bg-neutral-50 hover:text-foreground"}`
                    }
                  >
                    <Icon className="size-5" strokeWidth={1.7} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              }

              return (
                <div key={item.href}>
                  <Button
                    variant="ghost"
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : item.label)}
                    className={`flex min-h-10 w-full justify-start gap-3 rounded-md border-0 px-3 text-left text-sm font-normal shadow-none ${groupActive || isOpen ? "bg-brand-50 font-medium text-brand" : "text-neutral-400 hover:bg-neutral-50 hover:text-foreground"}`}
                  >
                    <Icon className="size-5" strokeWidth={1.7} />
                    <span className="flex-1">{item.label}</span>
                    {isOpen ? (
                      <ChevronDown className="size-4 rounded-full bg-brand-100 p-0.5" />
                    ) : (
                      <ChevronRight className="size-4 rounded-full bg-neutral-200 p-0.5" />
                    )}
                  </Button>
                  {isOpen && (
                    <div className="mt-2 grid gap-1 pl-12">
                      {children.map((child) => (
                        <SubmenuLink key={child.href} item={child} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <Button
            className="ml-auto min-w-44 justify-start bg-brand-50 text-brand hover:bg-brand-100 lg:ml-3 lg:mt-6 lg:w-[calc(100%-1.5rem)]"
            variant="ghost"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="size-5" />
            Logout
          </Button>
        </aside>
        <div className="min-w-0">
          <div className="flex h-[62px] items-center border-b border-brand-100 bg-panel px-5 text-lg font-semibold lg:px-7">
            {pageTitle}
          </div>
          <main className="mx-auto max-w-[1280px] p-4 sm:p-5 lg:p-7">
            <Outlet />
          </main>
        </div>
      </div>
      <Suspense>
        <AlertDialog
          isOpen={logoutOpen}
          onOpenChange={setLogoutOpen}
          title="Logout"
          description="Are you sure you want to log out?"
          confirmLabel="Yes, logout"
          onConfirm={() => void logout()}
        >
          Your current session will end and you will need to sign in again.
        </AlertDialog>
      </Suspense>
    </div>
  );
}

function SubmenuLink({ item }: { item: NavigationItem }) {
  const { pathname, search } = useLocation();
  const isActive = `${pathname}${search}` === item.href;
  return (
    <Link
      to={item.href}
      className={`rounded px-1 py-1.5 text-sm ${isActive ? "font-medium text-brand" : "text-neutral-400 hover:text-foreground"}`}
    >
      {item.label}
    </Link>
  );
}

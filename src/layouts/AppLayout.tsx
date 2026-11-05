import {
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  LogOut,
  Menu,
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
const Drawer = lazy(() =>
  import("../components/ui/Drawer.tsx").then((module) => ({
    default: module.Drawer,
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
  const locationKey = `${pathname}${search}`;
  const [expanded, setExpanded] = useState<string | null>(activeGroup ?? null);
  const [trackedActiveGroup, setTrackedActiveGroup] = useState(activeGroup);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [trackedLocation, setTrackedLocation] = useState(locationKey);
  if (activeGroup !== trackedActiveGroup) {
    setTrackedActiveGroup(activeGroup);
    if (activeGroup) setExpanded(activeGroup);
  }
  if (locationKey !== trackedLocation) {
    setTrackedLocation(locationKey);
    if (mobileNavOpen) setMobileNavOpen(false);
  }
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

  const brandBlock = (
    <a className="flex items-center gap-3 px-3" href="/dashboard">
      <Avatar
        src={logoUrl}
        name={businessName}
        size="lg"
        className="size-14 shrink-0 border border-brand-100 bg-white text-xl font-black text-brand shadow-md"
      />
      <span className="min-w-0">
        <span className="block truncate text-xl font-bold text-foreground">
          {businessName}
        </span>
        <span className="block text-sm text-neutral-400">Express</span>
      </span>
    </a>
  );

  const sidebarNav = (
    <SidebarNav
      items={visible}
      expanded={expanded}
      onExpand={setExpanded}
      hasPermission={hasPermission}
      pathname={pathname}
      onNavigate={() => setMobileNavOpen(false)}
    />
  );

  const logoutButton = (
    <Button
      className="w-full justify-start bg-brand-50 text-brand hover:bg-brand-100"
      variant="ghost"
      onClick={() => {
        setMobileNavOpen(false);
        setLogoutOpen(true);
      }}
    >
      <LogOut className="size-5" />
      Logout
    </Button>
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-surface text-foreground">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 bg-[#b40009] px-3 text-white shadow-lg shadow-brand-900/10 sm:h-[76px] sm:px-5 lg:px-12">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
            className="shrink-0 text-white hover:bg-white/10 lg:hidden"
          >
            <Menu className="size-5" />
          </Button>
          <img
            src="/pepsa-wordmark.svg"
            alt="Pepsa"
            className="w-20 shrink-0 brightness-0 invert sm:w-28"
          />
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] flex-col border-r border-border bg-panel px-5 py-6 sm:top-[76px] sm:h-[calc(100vh-76px)] lg:flex">
          {brandBlock}
          <div className="mt-10 flex min-h-0 flex-1 flex-col">
            {sidebarNav}
          </div>
          <div className="mt-6 px-3">{logoutButton}</div>
        </aside>
        <div className="min-w-0">
          <div className="flex min-h-12 items-center border-b border-brand-100 bg-panel px-4 text-base font-semibold sm:min-h-[62px] sm:px-5 sm:text-lg lg:px-7">
            <span className="truncate">{pageTitle}</span>
          </div>
          <main className="mx-auto max-w-[1280px] p-3 sm:p-5 lg:p-7">
            <Outlet />
          </main>
        </div>
      </div>
      <Suspense>
        <Drawer
          isOpen={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          title={businessName}
          description="Express"
          side="left"
          size="sm"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <div className="min-h-0 flex-1 overflow-y-auto">{sidebarNav}</div>
            <div className="border-t border-border pt-4">{logoutButton}</div>
          </div>
        </Drawer>
      </Suspense>
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

function SidebarNav({
  items,
  expanded,
  onExpand,
  hasPermission,
  pathname,
  onNavigate,
}: {
  items: readonly NavigationGroup[];
  expanded: string | null;
  onExpand: (label: string | null) => void;
  hasPermission: (permission: string) => boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="flex flex-col gap-2 overflow-y-auto"
      aria-label="Primary navigation"
    >
      {items.map((item) => {
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
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex min-h-10 items-center gap-3 rounded-md px-3 text-sm ${isActive ? "bg-brand-50 font-medium text-brand" : "text-neutral-400 hover:bg-neutral-50 hover:text-foreground"}`
              }
            >
              <Icon className="size-5 shrink-0" strokeWidth={1.7} />
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
              onClick={() => onExpand(isOpen ? null : item.label)}
              className={`flex min-h-10 w-full justify-start gap-3 rounded-md border-0 px-3 text-left text-sm font-normal shadow-none ${groupActive || isOpen ? "bg-brand-50 font-medium text-brand" : "text-neutral-400 hover:bg-neutral-50 hover:text-foreground"}`}
            >
              <Icon className="size-5 shrink-0" strokeWidth={1.7} />
              <span className="flex-1">{item.label}</span>
              {isOpen ? (
                <ChevronDown className="size-4 shrink-0 rounded-full bg-brand-100 p-0.5" />
              ) : (
                <ChevronRight className="size-4 shrink-0 rounded-full bg-neutral-200 p-0.5" />
              )}
            </Button>
            {isOpen && (
              <div className="mt-2 grid gap-1 pl-10 sm:pl-12">
                {children.map((child) => (
                  <SubmenuLink
                    key={child.href}
                    item={child}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function SubmenuLink({
  item,
  onNavigate,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  const { pathname, search } = useLocation();
  const isActive = `${pathname}${search}` === item.href;
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={`rounded px-1 py-1.5 text-sm ${isActive ? "font-medium text-brand" : "text-neutral-400 hover:text-foreground"}`}
    >
      {item.label}
    </Link>
  );
}

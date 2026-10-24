import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../contexts/SessionContext.tsx";

const links = [
  {
    label: "Dispatchers",
    to: "/people/dispatchers",
    permission: "people.dispatchers.read",
  },
  {
    label: "Customers",
    to: "/people/customers",
    permission: "people.customers.read",
  },
  { label: "Staff", to: "/people/staff", permission: "staff.read" },
];

export default function PeoplePage() {
  const { hasPermission } = useSession();
  return (
    <div>
      <header>
        <h1 className="text-3xl font-bold">People</h1>
        <p className="mt-2 text-muted">
          Manage dispatchers, customers, staff, and compliance.
        </p>
        <nav
          className="mt-6 flex gap-1 overflow-x-auto border-b border-border"
          aria-label="People sections"
        >
          {links
            .filter((link) => hasPermission(link.permission))
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${isActive ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
        </nav>
      </header>
      <div className="pt-5">
        <Outlet />
      </div>
    </div>
  );
}

import { expect, test } from "@playwright/test";

test("shows dashboard, search, notifications, and report exports", async ({
  page,
}) => {
  await page.route("http://localhost:3000/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/auth/refresh"))
      return route.fulfill({ json: { accessToken: "token" } });
    if (url.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "actor",
          tenantId: "tenant",
          email: "owner@example.com",
          name: "Owner",
          permissions: ["*"],
          vendor: {
            id: "tenant",
            businessName: "Zuma Express",
            type: "COMPANY",
            status: "APPROVED",
          },
        },
      });
    if (new URL(url).pathname.endsWith("/dashboard"))
      return route.fulfill({
        json: {
          generatedAt: "2026-10-19T12:00:00Z",
          range: { from: "2026-09-19", to: "2026-10-20" },
          currentActivities: {
            activeDispatch: 12,
            assignedManifest: 3,
            customerOrder: 5,
            onlineDispatchers: 4,
          },
          overview: {
            dispatch: {
              all: 12,
              delivered: 7,
              distanceMetres: 42000,
              valueMinor: 200000,
              growth: {
                all: 20,
                delivered: 16.7,
                distanceMetres: 10,
                valueMinor: 25,
              },
            },
            order: {
              all: 10,
              completed: 7,
              customer: 5,
              valueMinor: 200000,
              growth: {
                all: 11.1,
                completed: 16.7,
                customer: 25,
                valueMinor: 25,
              },
            },
            revenue: {
              totalMinor: 200000,
              dispatcherPayMinor: 75000,
              earningsMinor: 125000,
              settlementMinor: 125000,
              growth: {
                totalMinor: 25,
                dispatcherPayMinor: 7.1,
                earningsMinor: 40,
                settlementMinor: 40,
              },
            },
          },
          trend: [
            { label: "Oct", dispatches: 12, orders: 10, revenueMinor: 200000 },
          ],
          onlineDispatchers: [
            { id: "rider", name: "Andi Lane", deliveries: 7 },
          ],
          topPerformers: [
            { id: "rider", name: "Andi Lane", deliveries: 7, share: 100 },
          ],
          overall: { deliveries: 7, orders: 10, customers: 5 },
          totalDispatchPoints: 12,
          activeBatches: 3,
          activeDispatchers: 4,
          revenueMinor: 125000,
          currency: "NGN",
          statuses: { COMPLETED: 7 },
          recentDeliveries: [
            {
              id: "dispatch",
              publicReference: "D-100",
              status: "COMPLETED",
              amountMinor: 10000,
              createdAt: "2026-10-19T10:00:00Z",
            },
          ],
        },
      });
    if (url.includes("/notifications"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "notice",
              title: "Dispatch completed",
              body: "D-100 has been completed.",
              href: "/operations?view=delivery-report",
              createdAt: "2026-10-19T12:00:00Z",
            },
          ],
          total: 1,
          unread: 1,
          page: 1,
          pageSize: 10,
        },
      });
    if (url.includes("/search?"))
      return route.fulfill({
        json: {
          orders: [],
          dispatches: [
            {
              label: "D-100",
              detail: "COMPLETED",
              href: "/operations?view=delivery-report",
            },
          ],
          manifests: [],
          customers: [],
          dispatchers: [],
        },
      });
    return route.fulfill({ json: {} });
  });
  await page.goto("/dashboard");
  await expect(page.getByText("D-100")).toBeVisible();
  await expect(page.getByText("₦2,000.00")).toBeVisible();
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("Dispatch completed")).toBeVisible();
  await page
    .getByPlaceholder("Search orders, dispatches, people…")
    .fill("D-100");
  await expect(
    page.getByText("COMPLETED", { exact: true }).last(),
  ).toBeVisible();
});

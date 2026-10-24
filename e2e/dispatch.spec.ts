import { expect, test } from "@playwright/test";

test("previews an own-fleet dispatch and exposes it in operations", async ({
  page,
}) => {
  await page.route("http://localhost:3000/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/auth/refresh"))
      return route.fulfill({ json: { accessToken: "test-access-token" } });
    if (url.endsWith("/auth/me"))
      return route.fulfill({
        json: {
          id: "actor-1",
          tenantId: "11111111-1111-4111-8111-111111111111",
          email: "ops@example.com",
          name: "Ops Owner",
          permissions: ["*"],
          vendor: {
            id: "11111111-1111-4111-8111-111111111111",
            businessName: "Zuma Express",
            type: "COMPANY",
            status: "APPROVED",
          },
        },
      });
    if (url.includes("/people/dispatchers"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "dispatcher-1",
              firstName: "Ada",
              lastName: "Rider",
              city: "Lagos",
              state: "Lagos",
              vehicleType: "MOTORCYCLE",
              totalOrdersPicked: 12,
              availability: true,
              status: "APPROVED",
            },
          ],
          stats: { online: 1, active: 1, inactive: 0, total: 1 },
        },
      });
    if (url.includes("/manifests/batches"))
      return route.fulfill({ json: { items: [], total: 0 } });
    if (url.includes("/dispatches/summary"))
      return route.fulfill({
        json: {
          totalDispatch: 0,
          activeBatches: 0,
          activeDispatchers: 0,
          totalRevenueMinor: 0,
          currency: "NGN",
        },
      });
    if (url.includes("/dispatches?") && route.request().method() === "GET")
      return route.fulfill({
        json: { items: [], total: 0, page: 1, pageSize: 10 },
      });
    if (url.endsWith("/dispatches/preview"))
      return route.fulfill({
        json: {
          mode: "OWN_FLEET",
          orderId: "order-1",
          dispatcherId: "dispatcher-1",
          previewToken: "preview-token",
          orderIds: ["order-1"],
          pickup: { address: "1 Broad Street, Lagos" },
          stops: [
            {
              orderId: "order-1",
              sequence: 1,
              address: "2 Marina Road, Lagos",
            },
          ],
          distanceMetres: 5000,
          durationSeconds: 900,
          totalAmountMinor: 100000,
          suggestedPayoutMinor: 90000,
          feeAmountMinor: 2000,
          fundingRequiredMinor: 2000,
          currency: "NGN",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      });
    if (url.endsWith("/dispatches") && route.request().method() === "POST")
      return route.fulfill({
        json: {
          id: "dispatch-1",
          publicReference: "D-RUNWAY-1",
          status: "PENDING_MATCH",
        },
      });
    if (url.includes("/orders"))
      return route.fulfill({
        json: {
          items: [
            {
              id: "order-1",
              publicReference: "O-READY",
              source: "VENDOR_DIRECT",
              status: "READY",
              paymentStatus: "NOT_REQUIRED",
              sender: { name: "Zuma Express", phone: "08010000000" },
              pickup: { address: "1 Broad Street, Lagos", city: "Lagos" },
              delivery: { city: "Lagos" },
              currency: "NGN",
            },
          ],
          total: 1,
        },
      });
    return route.fulfill({ json: {} });
  });

  await page.goto("/open-dispatch?view=runway-manifest");
  await expect(page.getByText("Filter manifests")).toBeVisible();
  await page
    .getByRole("button", { name: /Create manifest/i })
    .first()
    .click();
  await page.getByLabel("Eligible order").click();
  await page.getByRole("option", { name: "O-READY" }).click();
  await page.getByRole("button", { name: "Assign order" }).click();
  await page.getByRole("button", { name: "Preview dispatch" }).click();
  await expect(
    page.getByRole("heading", { name: "Pickup Details" }),
  ).toBeVisible();
  await expect(page.getByText("1 Broad Street, Lagos")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Stop 1")).toBeVisible();
  await expect(page.getByText("₦900.00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm and dispatch" }).click();
  await expect(page.getByText("Order assigned successfully")).toBeVisible();
  await expect(page.getByText(/D-RUNWAY-1/)).toBeVisible();
});

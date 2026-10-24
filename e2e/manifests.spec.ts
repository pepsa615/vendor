import { expect, test } from "@playwright/test";

test("validates tracking IDs before finalizing a batch", async ({ page }) => {
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
    if (url.includes("/manifests/batches/validate"))
      return route.fulfill({
        json: {
          total: 2,
          valid: [{ id: "order-1", trackingId: "O-READY" }],
          invalid: [{ trackingId: "O-DRAFT", reason: "NOT_DISPATCH_READY" }],
          duplicates: [],
          previewToken: "preview-token",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        },
      });
    if (url.includes("/manifests/batches"))
      return route.fulfill({
        json: { items: [], total: 0, page: 1, pageSize: 20 },
      });
    return route.fulfill({ json: {} });
  });

  await page.goto("/manifest?view=batching");
  await page.getByRole("button", { name: "Create batch" }).click();
  await page.getByLabel("Tracking IDs").fill("O-READY\nO-DRAFT");
  await expect(
    page.getByRole("button", { name: "Confirm and finalize" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Validate IDs" }).click();
  await expect(page.getByText(/NOT_DISPATCH_READY/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm and finalize" }),
  ).toBeEnabled();
});

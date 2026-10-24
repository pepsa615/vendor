import { expect, test } from "@playwright/test";

test("shows settlement and wallet account surfaces", async ({ page }) => {
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
    if (url.endsWith("/account/settlement-summary"))
      return route.fulfill({
        json: {
          settlement: {
            settlement_wallet_id: "settlement",
            pending_balance: "250.00",
            settled_balance: "1250.00",
            total_balance: "1500.00",
            currency: "NGN",
          },
          outstandingFeeMinor: 2000,
          provisioning: "ACTIVE",
        },
      });
    if (url.endsWith("/account/settlements"))
      return route.fulfill({
        json: [
          {
            id: "entry",
            source: "RIDER_FULFILLED",
            sourceReference: "D-100",
            counterpartyName: "Ada Rider",
            totalAmountMinor: 100000,
            earningsMinor: 10000,
            currency: "NGN",
            status: "COMPLETED",
            createdAt: "2026-10-19T10:00:00Z",
          },
        ],
      });
    if (url.endsWith("/account/wallet"))
      return route.fulfill({
        json: {
          wallet: {
            user_id: "user",
            wallet_id: "wallet",
            balance: "5000.00",
            currency: "NGN",
            settlement_wallet_id: "settlement",
            account: {
              account_number: "5030000116",
              account_name: "Zuma Express",
              bank_name: "9PSB",
              status: "active",
            },
          },
          provisioning: "ACTIVE",
        },
      });
    if (url.includes("/account/wallet/statement"))
      return route.fulfill({ json: { data: [], next_cursor: null } });
    return route.fulfill({ json: {} });
  });
  await page.goto("/account?view=settlement-ledger");
  await expect(page.getByText("Outstanding dispatch fees")).toBeVisible();
  await expect(page.getByText("D-100")).toBeVisible();
  await page.getByRole("button", { name: "Wallet" }).click();
  await expect(page.getByText("5030000116")).toBeVisible();
  await expect(page.getByText("Quick services")).toBeVisible();
});

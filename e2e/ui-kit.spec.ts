import { expect, test } from "@playwright/test";
test("renders and operates the Pepsa UI kit", async ({ page }) => {
  await page.goto("/ui-kit");
  await expect(
    page.getByRole("heading", { name: "Reusable interface components" }),
  ).toBeVisible();
  await expect(page.getByText("PEP-10482")).toBeVisible();
  await page.getByRole("button", { name: "Open modal" }).click();
  await expect(
    page.getByRole("dialog", { name: "Create manifest" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close modal" }).click();
  await page.getByRole("button", { name: "Show toast" }).click();
  await expect(page.getByText("Order paired")).toBeVisible();
  await page.getByText("What is a runway manifest?").click();
  await expect(page.getByText(/vendor-owned fleet assignment/)).toBeVisible();
});

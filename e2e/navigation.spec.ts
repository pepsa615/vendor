import { expect, test } from "@playwright/test";
test("redirects an unauthenticated visitor to first-party login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});

test("shows responsive registration and verification entry points", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "Registration" }),
  ).toBeVisible();
  await expect(page.getByLabel("Business/ Brand Name")).toBeVisible();
  await page.getByRole("button", { name: /Register as/ }).click();
  await page.getByRole("option", { name: "Individual" }).click();
  await expect(page.getByLabel("Step 1 of 4")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Registration" }),
  ).toBeVisible();
});

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PublicOrderLinkCard } from "./PublicOrderLinkCard.tsx";

afterEach(cleanup);

describe("PublicOrderLinkCard", () => {
  it("disables sharing and explains every readiness blocker", () => {
    render(
      <PublicOrderLinkCard
        publicOrder={{
          publicSlug: "zuma-express",
          path: "/order/zuma-express",
          enabled: false,
          blockers: [
            "VENDOR_NOT_APPROVED",
            "PRICING_NOT_CONFIGURED",
            "PAYMENT_NOT_READY",
          ],
        }}
      />,
    );
    expect(screen.getByRole("button", { name: /copy link/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /share$/i })).toBeDisabled();
    expect(screen.getByText(/must be approved/i)).toBeVisible();
    expect(screen.getByText(/all four tiers/i)).toBeVisible();
    expect(screen.getByText(/pepsa payment account/i)).toBeVisible();
  });

  it("exposes all sharing actions when the public page is ready", () => {
    render(
      <PublicOrderLinkCard
        publicOrder={{
          publicSlug: "zuma-express",
          path: "/order/zuma-express",
          enabled: true,
          blockers: [],
        }}
      />,
    );
    expect(screen.getByText(/order\/zuma-express/)).toBeVisible();
    for (const name of ["Copy Link", "Share", "QR Code", "WhatsApp", "Preview"])
      expect(screen.getByRole("button", { name })).toBeEnabled();
  });
});

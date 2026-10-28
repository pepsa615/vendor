import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ManifestPage from "./ManifestPage.tsx";

describe("ManifestPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("validates selected order details before enabling immutable batch confirmation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const body = url.includes("/validate")
          ? {
              total: 3,
              valid: [{ id: "order-1", trackingId: "O-READY" }],
              invalid: [
                { trackingId: "O-DRAFT", reason: "NOT_DISPATCH_READY" },
              ],
              duplicates: ["O-READY"],
              previewToken: "preview-token",
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            }
          : url.includes("/orders")
            ? {
                items: [
                  {
                    id: "11111111-1111-4111-8111-111111111111",
                    publicReference: "O-READY",
                    source: "VENDOR_DIRECT",
                    status: "READY",
                    paymentStatus: "NOT_REQUIRED",
                    sender: { name: "Ada", phone: "0801" },
                    receiver: { name: "Tola", phone: "0802" },
                    pickup: { city: "Lagos" },
                    delivery: { city: "Ikeja" },
                    itemDescription: "Parcel",
                    createdAt: new Date().toISOString(),
                  },
                ],
                total: 1,
                page: 1,
                pageSize: 100,
              }
            : { items: [], total: 0, page: 1, pageSize: 20 };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/manifest?view=batching"]}>
          <ManifestPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Create batch" }));
    expect(
      screen.getByRole("button", { name: "Confirm and finalize" }),
    ).toBeDisabled();
    await user.click(await screen.findByLabelText("Select O-READY"));
    await user.click(
      screen.getByRole("button", { name: "Validate selection" }),
    );
    expect(await screen.findByText(/1 ready for batch/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Confirm and finalize" }),
    ).toBeEnabled();
  });
});

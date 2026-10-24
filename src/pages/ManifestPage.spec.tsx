import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ManifestPage from "./ManifestPage.tsx";

describe("ManifestPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("validates pasted tracking IDs before enabling immutable batch confirmation", async () => {
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
    await user.type(
      screen.getByLabelText("Tracking IDs"),
      "O-READY{enter}O-DRAFT{enter}O-READY",
    );
    await user.click(screen.getByRole("button", { name: "Validate IDs" }));
    expect(
      (await screen.findAllByText("NOT_DISPATCH_READY", { exact: false }))[0],
    ).toBeVisible();
    expect(screen.getByText("Duplicates")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Confirm and finalize" }),
    ).toBeEnabled();
  });
});

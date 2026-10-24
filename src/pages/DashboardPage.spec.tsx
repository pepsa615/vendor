import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./DashboardPage.tsx";

describe("DashboardPage", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("renders live operational aggregates and recent deliveries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
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
                    delivered: -12.5,
                    distanceMetres: 0,
                    valueMinor: null,
                  },
                },
                order: {
                  all: 10,
                  completed: 7,
                  customer: 5,
                  valueMinor: 200000,
                  growth: {
                    all: 20,
                    completed: -12.5,
                    customer: 0,
                    valueMinor: null,
                  },
                },
                revenue: {
                  totalMinor: 200000,
                  dispatcherPayMinor: 75000,
                  earningsMinor: 125000,
                  settlementMinor: 125000,
                  growth: {
                    totalMinor: 20,
                    dispatcherPayMinor: -12.5,
                    earningsMinor: 0,
                    settlementMinor: null,
                  },
                },
              },
              trend: [
                {
                  label: "Oct",
                  dispatches: 12,
                  orders: 10,
                  revenueMinor: 200000,
                },
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
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DashboardPage />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("D-100")).toBeVisible();
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    expect(screen.getByText("₦2,000.00")).toBeVisible();
    expect(screen.getByText("+20% vs previous period")).toBeVisible();
    expect(screen.getByText("-12.5% vs previous period")).toBeVisible();
    expect(screen.queryByText("+11.01%")).not.toBeInTheDocument();
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([input]) =>
          String(input).includes("/dashboard?from="),
        ),
    ).toBe(true);
  });
});

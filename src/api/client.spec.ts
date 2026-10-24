import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client.ts";
afterEach(() => vi.unstubAllGlobals());
describe("apiRequest", () => {
  it("normalizes API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "DENIED", message: "Denied", requestId: "r1" },
          }),
          { status: 403, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    await expect(apiRequest("/protected")).rejects.toMatchObject({
      code: "DENIED",
      requestId: "r1",
    });
  });
});

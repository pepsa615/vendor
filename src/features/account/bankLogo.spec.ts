import { describe, expect, it } from "vitest";

import { isPepsaRailBank } from "./bankLogo.ts";

describe("isPepsaRailBank", () => {
  it.each(["9PSB", "9 PSB", "9 Payment Service Bank", "Pepsa Pay"])(
    "recognizes the Pepsa payment rail from %s",
    (name) => {
      expect(isPepsaRailBank({ code: "120001", name })).toBe(true);
    },
  );

  it("does not classify another payment service bank as Pepsa", () => {
    expect(
      isPepsaRailBank({ code: "120002", name: "Hope Payment Service Bank" }),
    ).toBe(false);
  });
});

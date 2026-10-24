import { describe, expect, it } from "vitest";
import {
  composeLocationAddress,
  readLocationFromForm,
} from "./orderIntake.ts";

describe("orderIntake", () => {
  it("composes street and google address like BAS", () => {
    expect(
      composeLocationAddress("Unit 4", "12 Allen Avenue, Ikeja, Lagos"),
    ).toBe("Unit 4, 12 Allen Avenue, Ikeja, Lagos");
    expect(composeLocationAddress("", "12 Allen Avenue")).toBe(
      "12 Allen Avenue",
    );
  });

  it("reads location fields from form data", () => {
    const data = new FormData();
    data.set("pickupGoogleAddress", "12 Allen Avenue, Ikeja");
    data.set("pickupStreet", "Gate B");
    data.set("pickupCity", "Ikeja");
    data.set("pickupState", "Lagos");
    data.set("pickupLandmark", "Near mall");
    data.set("pickupPostalCode", "100001");
    data.set("pickupPlaceId", "ChIJexample");
    expect(readLocationFromForm(data, "pickup")).toEqual({
      address: "Gate B, 12 Allen Avenue, Ikeja",
      city: "Ikeja",
      state: "Lagos",
      country: "NG",
      postalCode: "100001",
      landmark: "Near mall",
      placeId: "ChIJexample",
    });
  });
});

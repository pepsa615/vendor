import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import DispatcherFormPage from "./DispatcherFormPage.tsx";

describe("DispatcherFormPage", () => {
  it("uses governed fields and enforces motorized vehicle details", () => {
    render(
      <MemoryRouter>
        <DispatcherFormPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Add dispatcher" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Vehicle brand")).toBeRequired();
    expect(screen.getByLabelText("Plate number")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Submit for review" }),
    ).toBeDisabled();
  });
});

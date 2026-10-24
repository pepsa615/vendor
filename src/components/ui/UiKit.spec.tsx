import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Accordion } from "./Accordion.tsx";
import { Alert } from "./Alert.tsx";
import { Button } from "./Button.tsx";
import { Checkbox } from "./Checkbox.tsx";
import { SearchInput } from "./SearchInput.tsx";
import { PasswordInput, PinInput } from "./Input.tsx";
import { FilterGroup } from "./FilterGroup.tsx";
import { Switch } from "./Switch.tsx";
import { ToastProvider, useToast } from "./Toast.tsx";

describe("Pepsa UI kit", () => {
  it("exposes consistent button variants, sizes, and loading state", () => {
    render(
      <>
        <Button size="sm">Small</Button>
        <Button variant="danger">Delete</Button>
        <Button loading>Save</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Small" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "bg-danger-600",
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
  it("supports keyboard-accessible disclosure and choices", async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    render(
      <>
        <Accordion
          items={[
            { key: "pricing", title: "Pricing", content: "Distance tiers" },
          ]}
        />
        <Switch onChange={onSwitch}>Tracking</Switch>
        <Checkbox>Notify me</Checkbox>
      </>,
    );
    await user.click(screen.getByText("Pricing"));
    expect(screen.getByText("Distance tiers")).toBeVisible();
    await user.click(screen.getByText("Tracking"));
    expect(onSwitch).toHaveBeenCalledWith(true);
    await user.click(screen.getByText("Notify me"));
    expect(screen.getByRole("checkbox", { name: "Notify me" })).toBeChecked();
  });
  it("provides labelled search and semantic alerts", async () => {
    const user = userEvent.setup();
    render(
      <>
        <SearchInput aria-label="Search orders" />
        <Alert tone="danger" title="Unable to save">
          Try again.
        </Alert>
      </>,
    );
    await user.type(
      screen.getByRole("searchbox", { name: "Search orders" }),
      "PEP-10",
    );
    expect(screen.getByRole("searchbox")).toHaveValue("PEP-10");
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save");
  });
  it("announces and dismisses toast feedback", async () => {
    function Demo() {
      const { show } = useToast();
      return (
        <Button
          onClick={() =>
            show({ title: "Saved", tone: "success", duration: 60_000 })
          }
        >
          Notify
        </Button>
      );
    }
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Notify" }));
    expect(screen.getByText("Saved")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });
  it("supports reusable secret inputs and status filters", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <PasswordInput aria-label="Password" />
        <PinInput aria-label="PIN" />
        <FilterGroup
          label="Show only"
          value="all"
          onChange={onChange}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active", count: 2 },
          ]}
        />
      </>,
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    await user.click(screen.getByText("Active"));
    expect(onChange).toHaveBeenCalledWith("active");
  });
});

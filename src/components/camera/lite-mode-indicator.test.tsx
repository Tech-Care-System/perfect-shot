import { lightingPoorAtom } from "@/lib/stores/pose-store";
import { liteModeAtom } from "@/lib/stores/settings-store";
import { act, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { LiteModeIndicator } from "./lite-mode-indicator";

function renderWithStore(liteMode = false) {
  const store = createStore();
  store.set(liteModeAtom, liteMode);

  const result = render(
    <Provider store={store}>
      <LiteModeIndicator />
    </Provider>,
  );

  return { store, ...result };
}

describe("LiteModeIndicator", () => {
  it("renders when liteModeAtom is true", () => {
    renderWithStore(true);
    expect(screen.getByTestId("lite-mode-indicator")).toBeInTheDocument();
  });

  it("does not render when liteModeAtom is false", () => {
    renderWithStore(false);
    expect(screen.queryByTestId("lite-mode-indicator")).not.toBeInTheDocument();
  });

  it('displays "Lite Mode" text', () => {
    renderWithStore(true);
    expect(screen.getByText("Lite Mode")).toBeInTheDocument();
  });

  it("has correct a11y attributes", () => {
    renderWithStore(true);
    const indicator = screen.getByTestId("lite-mode-indicator");
    expect(indicator).toHaveAttribute("role", "status");
    expect(indicator).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Lite Mode")).toHaveClass("text-base");
  });

  it("has pointer-events-none class", () => {
    renderWithStore(true);
    const indicator = screen.getByTestId("lite-mode-indicator");
    expect(indicator).toHaveClass("pointer-events-none");
  });

  it("gives lighting advice priority over the mode label", () => {
    const { store } = renderWithStore(true);
    act(() => {
      store.set(lightingPoorAtom, true);
    });
    expect(screen.queryByTestId("lite-mode-indicator")).not.toBeInTheDocument();
  });

  it("hides when liteModeAtom changes to false", () => {
    const { store } = renderWithStore(true);
    expect(screen.getByTestId("lite-mode-indicator")).toBeInTheDocument();

    act(() => {
      store.set(liteModeAtom, false);
    });

    expect(screen.queryByTestId("lite-mode-indicator")).not.toBeInTheDocument();
  });
});

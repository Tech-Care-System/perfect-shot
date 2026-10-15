import { poseHintAtom } from "@/lib/stores/pose-store";
import type { PoseHint } from "@/lib/types/pose.types";
import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { PoseHintCard } from "./pose-hint-card";

function renderWithStore(hint: PoseHint | null = null) {
  const store = createStore();
  store.set(poseHintAtom, hint);

  const result = render(
    <Provider store={store}>
      <PoseHintCard />
    </Provider>,
  );

  return { store, ...result };
}

describe("PoseHintCard", () => {
  it("renders nothing when poseHintAtom is null", () => {
    renderWithStore(null);
    expect(screen.queryByTestId("pose-hint-card")).not.toBeInTheDocument();
  });

  it("renders the current pose name and action hint", () => {
    renderWithStore({
      name: "Confident Sit",
      hint: "Lean back, arm on armrest",
    });
    const nameEl = screen.getByText("Confident Sit");
    const hintEl = screen.getByText("Lean back, arm on armrest");
    expect(nameEl).toBeInTheDocument();
    expect(hintEl).toBeInTheDocument();
  });

  it('card has aria-live="polite" and role="status"', () => {
    renderWithStore({ name: "Test", hint: "Test hint" });
    const card = screen.getByTestId("pose-hint-card");
    expect(card).toHaveAttribute("aria-live", "polite");
    expect(card).toHaveAttribute("role", "status");
  });
});

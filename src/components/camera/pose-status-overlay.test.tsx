import {
  detectionErrorAtom,
  detectionLostAtom,
  poseFpsAtom,
} from "@/lib/stores/pose-store";
import { act, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { PoseStatusOverlay } from "./pose-status-overlay";

function renderWithStore({
  fps = 0,
  lost = false,
  error = null,
}: {
  fps?: number;
  lost?: boolean;
  error?: string | null;
} = {}) {
  const store = createStore();
  store.set(poseFpsAtom, fps);
  store.set(detectionLostAtom, lost);
  store.set(detectionErrorAtom, error);

  const result = render(
    <Provider store={store}>
      <PoseStatusOverlay />
    </Provider>,
  );

  return { store, ...result };
}

describe("PoseStatusOverlay", () => {
  it("shows an initial pose-finding status with a legible live announcement", () => {
    renderWithStore();

    const status = screen.getByTestId("pose-fps-indicator");
    expect(status).toHaveTextContent("Finding you");
    expect(status).toHaveAttribute("role", "status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveClass("top-[94px]", "left-4", "text-base");
    expect(status).not.toHaveTextContent(/fps/i);
  });

  it("shows Guide active when frames are arriving and detection has not been lost", () => {
    renderWithStore({ fps: 24 });

    expect(screen.getByTestId("pose-fps-indicator")).toHaveTextContent(
      "Guide active",
    );
  });

  it("keeps Finding you when detection is lost, even if a recent FPS remains", () => {
    renderWithStore({ fps: 24, lost: true });

    expect(screen.getByTestId("pose-fps-indicator")).toHaveTextContent(
      "Finding you",
    );
  });

  it("updates its status when the pose store changes", () => {
    const { store } = renderWithStore({ fps: 24 });
    expect(screen.getByTestId("pose-fps-indicator")).toHaveTextContent(
      "Guide active",
    );

    act(() => {
      store.set(detectionLostAtom, true);
    });

    expect(screen.getByTestId("pose-fps-indicator")).toHaveTextContent(
      "Finding you",
    );
  });

  it("hides its status on detection errors so the camera error banner owns the message", () => {
    renderWithStore({ error: "Worker failed" });

    expect(screen.queryByTestId("pose-fps-indicator")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pose-detection-lost")).not.toBeInTheDocument();
    expect(screen.queryByText("Worker failed")).not.toBeInTheDocument();
  });
});

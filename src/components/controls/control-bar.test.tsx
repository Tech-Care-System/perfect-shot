import { liteModeAtom } from "@/lib/stores/settings-store";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { triggerHaptic } from "@/lib/utils/haptic-feedback";
import { createStore, Provider } from "jotai";
import { ControlBar } from "./control-bar";

jest.mock("@/lib/utils/haptic-feedback", () => ({
  triggerHaptic: jest.fn(),
}));

function renderWithStore(
  props: React.ComponentProps<typeof ControlBar>,
  liteMode = false,
) {
  const store = createStore();
  store.set(liteModeAtom, liteMode);
  const result = render(
    <Provider store={store}>
      <ControlBar {...props} />
    </Provider>,
  );
  return { store, ...result };
}

describe("ControlBar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the flip camera button", () => {
    const onFlipCamera = jest.fn();
    renderWithStore({ onFlipCamera });

    const flipButton = screen.getByLabelText(/flip camera/i);
    expect(flipButton).toBeInTheDocument();
  });

  it("should call onFlipCamera and triggerHaptic when clicked", () => {
    const onFlipCamera = jest.fn();

    renderWithStore({ onFlipCamera });

    const flipButton = screen.getByLabelText(/flip camera/i);
    fireEvent.click(flipButton);

    expect(onFlipCamera).toHaveBeenCalledTimes(1);
    expect(triggerHaptic).toHaveBeenCalledWith("short");
  });

  it("should disable the button when isSwitching is true", () => {
    const onFlipCamera = jest.fn();
    renderWithStore({ onFlipCamera, isSwitching: true });

    const flipButton = screen.getByLabelText(/flip camera/i);
    expect(flipButton).toBeDisabled();
  });

  it("should call onShutter and triggerHaptic when shutter button is clicked", () => {
    const onFlipCamera = jest.fn();
    const onShutter = jest.fn();
    renderWithStore({ onFlipCamera, onShutter });

    const shutterButton = screen.getByLabelText("Capture Photo");
    fireEvent.click(shutterButton);

    expect(triggerHaptic).toHaveBeenCalledWith("medium");
    expect(onShutter).toHaveBeenCalledTimes(1);
  });

  it("should not call onShutter when it is not provided", () => {
    const onFlipCamera = jest.fn();
    renderWithStore({ onFlipCamera });

    const shutterButton = screen.getByLabelText("Capture Photo");
    fireEvent.click(shutterButton);

    expect(triggerHaptic).not.toHaveBeenCalledWith("medium");
  });

  it("disables capture and next-pose controls when their handlers are missing", () => {
    renderWithStore({ onFlipCamera: jest.fn() });

    expect(
      screen.getByRole("button", { name: "Capture Photo" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next Pose" })).toBeDisabled();
  });

  it("disables capture and next-pose controls while the camera is switching", () => {
    renderWithStore({
      onFlipCamera: jest.fn(),
      onShutter: jest.fn(),
      onNextPose: jest.fn(),
      isSwitching: true,
    });

    expect(
      screen.getByRole("button", { name: "Capture Photo" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next Pose" })).toBeDisabled();
  });

  it("should render settings button", () => {
    renderWithStore({ onFlipCamera: jest.fn() });
    expect(screen.getByLabelText("Settings")).toBeInTheDocument();
  });

  it("should open settings sheet when settings button is clicked", () => {
    renderWithStore({ onFlipCamera: jest.fn() });
    fireEvent.click(screen.getByLabelText("Settings"));
    expect(screen.getByText("Lite Mode")).toBeInTheDocument();
  });

  it("should toggle lite mode via settings switch", () => {
    const { store } = renderWithStore({ onFlipCamera: jest.fn() }, false);
    fireEvent.click(screen.getByLabelText("Settings"));
    fireEvent.click(screen.getByLabelText("Toggle Lite Mode"));
    expect(store.get(liteModeAtom)).toBe(true);
  });

  it("toggles Lite Mode with the keyboard switch control", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore({ onFlipCamera: jest.fn() }, false);
    await user.click(screen.getByRole("button", { name: "Settings" }));

    const toggle = screen.getByRole("switch", { name: "Toggle Lite Mode" });
    toggle.focus();
    await user.keyboard(" ");

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(store.get(liteModeAtom)).toBe(true);
  });

  it("should show lite mode toggle as on when liteModeAtom is true", () => {
    renderWithStore({ onFlipCamera: jest.fn() }, true);
    fireEvent.click(screen.getByLabelText("Settings"));
    const toggle = screen.getByLabelText("Toggle Lite Mode");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});

import { capturedPhotoAtom } from "@/lib/stores/camera-store";
import { fireEvent, render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";
import { PreviewScreen } from "./preview-screen";

jest.mock("@/lib/utils/save-photo", () => ({
  savePhoto: jest.fn(),
}));

import { savePhoto } from "@/lib/utils/save-photo";

const mockSavePhoto = savePhoto as jest.MockedFunction<typeof savePhoto>;

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe("PreviewScreen", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    jest.useFakeTimers();
    store = createStore();
    mockSavePhoto.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the captured photo", () => {
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const img = screen.getByTestId("preview-image") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe("data:image/jpeg;base64,test");
    expect(img.alt).toBe("Captured photo");
    expect(img).toHaveClass("object-contain");
  });

  it("clears capturedPhotoAtom when Retake is clicked", () => {
    store.set(capturedPhotoAtom, "data:image/jpeg;base64,test");

    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    fireEvent.click(screen.getByTestId("retake-button"));
    expect(store.get(capturedPhotoAtom)).toBeNull();
  });

  it("retakes the photo when Escape is pressed", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    store.set(capturedPhotoAtom, "data:image/jpeg;base64,test");

    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    await user.keyboard("{Escape}");

    expect(store.get(capturedPhotoAtom)).toBeNull();
  });

  it("renders Save button as enabled", () => {
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const saveButton = screen.getByTestId("save-button");
    expect(saveButton).toBeEnabled();
  });

  it('has role="dialog" and aria-label="Photo Preview"', () => {
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "Photo Preview");
  });

  it('has aria-modal="true" on the dialog', () => {
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("returns focus to Capture Photo even if lazy loading lost the original focus", () => {
    const { rerender } = render(
      <div>
        <button aria-label="Capture Photo">Capture</button>
        <PreviewScreen imageUrl="data:image/jpeg;base64,test" />
      </div>,
      { wrapper: createWrapper(store) },
    );
    expect(document.activeElement).toBe(screen.getByTestId("preview-screen"));
    rerender(
      <div>
        <button aria-label="Capture Photo">Capture</button>
      </div>,
    );
    expect(screen.getByRole("button", { name: "Capture Photo" })).toHaveFocus();
  });

  it("returns keyboard focus to the camera control when photo review closes", () => {
    const shutter = document.createElement("button");
    document.body.appendChild(shutter);
    shutter.focus();
    const { unmount } = render(
      <PreviewScreen imageUrl="data:image/jpeg;base64,test" />,
      { wrapper: createWrapper(store) },
    );
    expect(document.activeElement).toBe(screen.getByTestId("preview-screen"));
    unmount();
    expect(document.activeElement).toBe(shutter);
    shutter.remove();
  });

  it("focuses the dialog container on mount", () => {
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const dialog = screen.getByTestId("preview-screen");
    expect(document.activeElement).toBe(dialog);
  });

  it("traps focus within dialog on Tab", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const retakeButton = screen.getByTestId("retake-button");
    const saveButton = screen.getByTestId("save-button");
    retakeButton.focus();
    expect(document.activeElement).toBe(retakeButton);

    await user.tab();
    expect(document.activeElement).toBe(saveButton);

    await user.tab();
    expect(document.activeElement).toBe(retakeButton);
  });

  it("traps focus within dialog on Shift+Tab", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const retakeButton = screen.getByTestId("retake-button");
    const saveButton = screen.getByTestId("save-button");
    retakeButton.focus();
    expect(document.activeElement).toBe(retakeButton);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(saveButton);
  });

  it("traps Tab from dialog container to first focusable element", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const dialog = screen.getByTestId("preview-screen");
    const retakeButton = screen.getByTestId("retake-button");
    expect(document.activeElement).toBe(dialog);

    await user.tab();
    expect(document.activeElement).toBe(retakeButton);
  });

  it("traps Shift+Tab from dialog container to last focusable element", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    const dialog = screen.getByTestId("preview-screen");
    const saveButton = screen.getByTestId("save-button");
    expect(document.activeElement).toBe(dialog);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(saveButton);
  });

  it("does not dismiss when clicking the backdrop", () => {
    store.set(capturedPhotoAtom, "data:image/jpeg;base64,test");

    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    fireEvent.click(screen.getByTestId("preview-screen"));
    expect(store.get(capturedPhotoAtom)).toBe("data:image/jpeg;base64,test");
  });

  it("calls savePhoto with imageUrl when Save is clicked", () => {
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    fireEvent.click(screen.getByTestId("save-button"));
    expect(mockSavePhoto).toHaveBeenCalledWith("data:image/jpeg;base64,test");
    expect(mockSavePhoto).toHaveBeenCalledTimes(1);
  });

  it('shows "Saved!" text after Save is clicked', () => {
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    fireEvent.click(screen.getByTestId("save-button"));
    expect(screen.getByTestId("save-button")).toHaveTextContent("Saved!");
  });

  it('disables Save button during "Saved!" state', () => {
    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    fireEvent.click(screen.getByTestId("save-button"));
    expect(screen.getByTestId("save-button")).toBeDisabled();
  });

  it("clears capturedPhotoAtom after 1.5s confirmation", () => {
    store.set(capturedPhotoAtom, "data:image/jpeg;base64,test");

    render(<PreviewScreen imageUrl="data:image/jpeg;base64,test" />, {
      wrapper: createWrapper(store),
    });

    fireEvent.click(screen.getByTestId("save-button"));
    expect(store.get(capturedPhotoAtom)).toBe("data:image/jpeg;base64,test");

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(store.get(capturedPhotoAtom)).toBeNull();
  });
});

"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { liteModeAtom } from "@/lib/stores/settings-store";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptic-feedback";
import { useAtom } from "jotai";
import { Maximize2, Minimize2, Settings, SwitchCamera } from "lucide-react";
import { useState } from "react";

interface ControlBarProps {
  onFlipCamera: () => void;
  onShutter?: () => void;
  onNextPose?: () => void;
  onToggleFitMode?: () => void;
  fitMode?: "cover" | "contain";
  isSwitching?: boolean;
}

export function ControlBar({
  onFlipCamera,
  onShutter,
  onNextPose,
  onToggleFitMode,
  fitMode = "cover",
  isSwitching = false,
}: ControlBarProps) {
  const [liteMode, setLiteMode] = useAtom(liteModeAtom);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleFlip = () => {
    if (isSwitching) return;
    triggerHaptic("short");
    onFlipCamera();
  };

  const handleToggleFit = () => {
    if (onToggleFitMode) {
      triggerHaptic("short");
      onToggleFitMode();
    }
  };

  const handleShutter = () => {
    if (onShutter && !isSwitching) {
      triggerHaptic("medium");
      onShutter();
    }
  };

  const handleNextPose = () => {
    if (onNextPose && !isSwitching) {
      triggerHaptic("short");
      onNextPose();
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center bg-[#f8f5f0] text-[#11120d] shadow-[0_-8px_32px_rgba(17,18,13,0.12)]"
      style={{
        height:
          "var(--camera-controls-height, calc(104px + env(safe-area-inset-bottom)))",
      }}
    >
      <div className="grid h-full w-full max-w-[640px] grid-cols-[minmax(44px,1fr)_minmax(44px,1fr)_72px_minmax(44px,1fr)_minmax(44px,1fr)] items-center gap-1 px-3 pb-[env(safe-area-inset-bottom)]">
        <Button
          variant="ghost"
          size="icon"
          disabled={!onToggleFitMode}
          onClick={handleToggleFit}
          className={cn(
            "size-11 justify-self-center rounded-full text-[#11120d] transition-colors hover:bg-[#11120d]/5",
            "active:scale-95 focus-visible:ring-[#11120d]/50",
          )}
          title={fitMode === "cover" ? "Show Full Frame" : "Fill Screen"}
          aria-label={fitMode === "cover" ? "Show Full Frame" : "Fill Screen"}
        >
          {fitMode === "cover" ? (
            <Minimize2 className="size-5" />
          ) : (
            <Maximize2 className="size-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleFlip}
          disabled={isSwitching}
          className={cn(
            "size-11 justify-self-center rounded-full text-[#11120d] transition-colors hover:bg-[#11120d]/5",
            "active:scale-95 focus-visible:ring-[#11120d]/50",
          )}
          title="Flip Camera"
          aria-label="Flip Camera"
        >
          <SwitchCamera className="size-6" />
        </Button>

        <Button
          variant="ghost"
          onClick={handleShutter}
          disabled={!onShutter || isSwitching}
          className={cn(
            "h-[72px] w-[72px] justify-self-center rounded-full border-2 border-[#11120d] bg-[#def753] p-0 text-[#11120d] transition-all hover:bg-[#d5ef48]",
            "active:scale-95 focus-visible:ring-[#11120d]/50 disabled:cursor-not-allowed",
          )}
          title="Capture Photo"
          aria-label="Capture Photo"
        >
          <span
            aria-hidden="true"
            className="h-14 w-14 rounded-full border-[3px] border-[#11120d]/50"
          />
        </Button>

        <Button
          variant="ghost"
          onClick={handleNextPose}
          disabled={!onNextPose || isSwitching}
          className={cn(
            "h-11 min-w-11 justify-self-center rounded-full bg-[#11120d]/5 px-2 text-base font-semibold text-[#11120d] transition-colors hover:bg-[#11120d]/10",
            "active:scale-95 focus-visible:ring-[#11120d]/50 disabled:cursor-not-allowed",
          )}
          title="Next Pose"
          aria-label="Next Pose"
        >
          Next
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          className={cn(
            "h-11 w-11 justify-self-center rounded-full text-[#11120d] transition-colors hover:bg-[#11120d]/5",
            "active:scale-95 focus-visible:ring-[#11120d]/50",
          )}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="size-5" />
        </Button>

        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[80dvh] border-[#11120d]/10 bg-[#f8f5f0] pb-4 text-[#11120d] [&>button]:size-11 [&>button]:text-[#11120d] [&>button]:opacity-100 [&>button]:hover:bg-[#11120d]/5 [&>button]:focus-visible:ring-[#11120d] [&>button_svg]:size-5"
            style={{
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
            }}
          >
            <SheetHeader className="border-b border-[#11120d]/10 px-5 py-4 pr-16">
              <SheetTitle className="text-base font-semibold text-[#11120d]">
                Settings
              </SheetTitle>
              <SheetDescription className="sr-only">
                App settings
              </SheetDescription>
            </SheetHeader>
            <div className="px-5 pb-2">
              <div className="flex min-h-11 items-center justify-between gap-4 rounded-xl py-3">
                <div className="min-w-0">
                  <p className="text-base font-medium">Lite Mode</p>
                  <p
                    id="lite-mode-description"
                    className="text-base leading-6 text-[#11120d]/70"
                  >
                    Reduces detection speed for smoother performance.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={liteMode}
                  aria-label="Toggle Lite Mode"
                  aria-describedby="lite-mode-description"
                  onClick={() => setLiteMode((prev) => !prev)}
                  className="inline-flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11120d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f5f0]"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative flex h-6 w-11 items-center rounded-full transition-colors",
                      liteMode ? "bg-[#def753]" : "bg-[#11120d]/20",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute size-5 rounded-full bg-[#11120d] transition-transform",
                        liteMode ? "translate-x-[22px]" : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

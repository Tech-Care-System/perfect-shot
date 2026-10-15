'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { liteModeAtom } from '@/lib/stores/settings-store';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/utils/haptic-feedback';
import { useAtom } from 'jotai';
import { Maximize2, Minimize2, Settings, SwitchCamera } from 'lucide-react';
import { useState } from 'react';

interface ControlBarProps {
  onFlipCamera: () => void;
  onShutter?: () => void;
  onNextPose?: () => void;
  onToggleFitMode?: () => void;
  fitMode?: 'cover' | 'contain';
  isSwitching?: boolean;
}


export function ControlBar({
  onFlipCamera,
  onShutter,
  onNextPose,
  onToggleFitMode,
  fitMode = 'cover',
  isSwitching = false,
}: ControlBarProps) {
  const [liteMode, setLiteMode] = useAtom(liteModeAtom);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleFlip = () => {
    triggerHaptic('short');
    onFlipCamera();
  };

  const handleToggleFit = () => {
    if (onToggleFitMode) {
      triggerHaptic('short');
      onToggleFitMode();
    }
  };

  const handleShutter = () => {
    if (onShutter) {
      triggerHaptic('medium');
      onShutter();
    }
  };

  const handleNextPose = () => {
    if (onNextPose) {
      triggerHaptic('short');
      onNextPose();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-8 pb-12 pt-6 bg-linear-to-t from-black/80 to-transparent">
      {/* Fit Mode Toggle */}
      {onToggleFitMode && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFit}
          className={cn(
            "h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all",
            "active:scale-95"
          )}
          title={fitMode === 'cover' ? "Show Full Frame" : "Fill Screen"}
          aria-label={fitMode === 'cover' ? "Show Full Frame" : "Fill Screen"}
        >
          {fitMode === 'cover' ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
        </Button>
      )}

      {/* Flip Camera Button */}

      <Button
        variant="ghost"
        size="icon"
        onClick={handleFlip}
        disabled={isSwitching}
        className={cn(
          "h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all",
          "active:scale-95 disabled:opacity-50"
        )}
        title="Flip Camera"
        aria-label="Flip Camera"
      >
        <SwitchCamera className="size-6" />
      </Button>

      {/* Shutter Button */}
      <Button
        variant="ghost"
        onClick={handleShutter}
        className={cn(
          "h-20 w-20 rounded-full border-4 border-white/50 flex items-center justify-center transition-all p-0",
          "active:scale-95",
          !onShutter && "opacity-50 cursor-not-allowed"
        )}
        title="Capture Photo"
        aria-label="Capture Photo"
      >
        <div className="h-16 w-16 rounded-full bg-white shadow-lg shadow-white/20" />
      </Button>

      {/* Next Pose Button */}
      <Button
        variant="ghost"
        onClick={handleNextPose}
        className={cn(
          "h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm transition-all",
          "active:scale-95",
          !onNextPose && "opacity-50 cursor-not-allowed"
        )}
        title="Next Pose"
        aria-label="Next Pose"
      >
        <span className="text-xs font-semibold">Next</span>
      </Button>

      {/* Settings Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSettingsOpen(true)}
        className={cn(
          "h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all",
          "active:scale-95"
        )}
        title="Settings"
        aria-label="Settings"
      >
        <Settings className="size-5" />
      </Button>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="bg-black/90 text-white border-white/10">
          <SheetHeader>
            <SheetTitle className="text-white">Settings</SheetTitle>
            <SheetDescription className="sr-only">App settings</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setLiteMode((prev) => !prev)}
            >
              <div>
                <p className="text-sm font-medium">Lite Mode</p>
                <p className="text-xs text-white/60">Reduces detection speed for smoother performance.</p>
              </div>
              <button
                role="switch"
                aria-checked={liteMode}
                aria-label="Toggle Lite Mode"
                onClick={(e) => {
                  e.stopPropagation();
                  setLiteMode((prev) => !prev);
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
                  liteMode ? "bg-green-500" : "bg-white/20"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform mt-0.5",
                    liteMode ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

"use client";

import { capturedPhotoAtom } from "@/lib/stores/camera-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { savePhoto } from "@/lib/utils/save-photo";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

interface PreviewScreenProps {
  imageUrl: string;
}

export function PreviewScreen({ imageUrl }: PreviewScreenProps) {
  const setCapturedPhoto = useSetAtom(capturedPhotoAtom);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lazy loading can reset focus before the preview mounts.
    const previousFocus =
      dialogRef.current?.parentElement?.querySelector<HTMLButtonElement>(
        'button[aria-label="Capture Photo"]',
      ) ?? document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
  }, [setCapturedPhoto]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleRetake();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === dialogRef.current
        ) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (
          document.activeElement === last ||
          document.activeElement === dialogRef.current
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleRetake],
  );

  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const handleSave = () => {
    savePhoto(imageUrl);
    setSaveState("saved");
    setTimeout(() => {
      setCapturedPhoto(null);
    }, 1500);
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      data-testid="preview-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Photo Preview"
      className="absolute inset-0 z-50 flex flex-col bg-[#f8f5f0] text-[#11120d] outline-none"
    >
      <div className="flex-1 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Captured photo"
          data-testid="preview-image"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>

      <div
        className="w-full border-t border-[#11120d]/10 bg-[#f8f5f0] px-4 pb-4 pt-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleRetake}
            data-testid="retake-button"
            className="min-h-11 rounded-full border border-[#11120d]/20 px-6 text-base font-medium text-[#11120d] hover:bg-[#11120d]/5"
          >
            Retake
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveState === "saved"}
            data-testid="save-button"
            className={cn(
              "min-h-11 rounded-full px-8 text-base font-semibold",
              saveState === "saved"
                ? "bg-[#def753] text-[#11120d]"
                : "bg-[#def753] text-[#11120d] hover:bg-[#d5ef48]",
            )}
          >
            {saveState === "saved" ? "Saved!" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

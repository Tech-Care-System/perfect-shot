'use client';

import { cameraFacingModeAtom, cameraFitModeAtom } from '@/lib/stores/camera-store';
import { targetPoseAtom } from '@/lib/stores/pose-store';
import { cn } from '@/lib/utils';
import { drawPoseSilhouette } from '@/lib/utils/drawing';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

const TARGET_SILHOUETTE_STYLE = {
  fillColor: 'rgba(255, 255, 255, 0.22)',
  outlineColor: 'rgba(255, 255, 255, 0.92)',
  lineWidth: 1.5,
};

function getObjectFitMappingStyle(canvas: HTMLCanvasElement, fitMode: 'cover' | 'contain') {
  const parent = canvas.parentElement;
  if (!parent) return {};

  const video = parent.querySelector('video[data-testid="camera-video"]') as HTMLVideoElement | null;
  if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return {};

  return {
    objectFit: fitMode,
    sourceWidth: video.videoWidth,
    sourceHeight: video.videoHeight,
  };
}


export function WireframeCanvas() {
  const targetPose = useAtomValue(targetPoseAtom);
  const facingMode = useAtomValue(cameraFacingModeAtom);
  const fitMode = useAtomValue(cameraFitModeAtom);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMirrored = facingMode === 'user';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = parent.querySelector('video[data-testid="camera-video"]');
    const draw = () => {
      const { width, height } = parent.getBoundingClientRect();
      const nextWidth = Math.round(width);
      const nextHeight = Math.round(height);

      if (nextWidth <= 0 || nextHeight <= 0) return;

      if (canvas.width !== nextWidth) {
        canvas.width = nextWidth;
      }

      if (canvas.height !== nextHeight) {
        canvas.height = nextHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mappingStyle = getObjectFitMappingStyle(canvas, fitMode);

      if (targetPose && targetPose.length > 0) {
        drawPoseSilhouette(ctx, targetPose, { ...TARGET_SILHOUETTE_STYLE, ...mappingStyle });
      }
    };

    draw();

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(draw)
      : null;
    if (observer) {
      observer.observe(parent);
    }

    window.addEventListener('resize', draw);
    video?.addEventListener('loadedmetadata', draw);
    video?.addEventListener('resize', draw);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', draw);
      video?.removeEventListener('loadedmetadata', draw);
      video?.removeEventListener('resize', draw);
    };
  }, [targetPose, fitMode]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="wireframe-canvas"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full z-10',
        isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
      )}
    />
  );
}

'use client';

import { cameraFacingModeAtom, cameraFitModeAtom, cameraStatusAtom } from '@/lib/stores/camera-store';
import { targetPoseAtom } from '@/lib/stores/pose-store';
import { drawPoseSilhouette } from '@/lib/utils/drawing';
import { projectReferencePose, type PoseGuideFrame } from '@/lib/utils/pose-projection';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

const TARGET_SILHOUETTE_STYLE = {
  fillColor: 'rgba(255, 255, 255, 0.22)',
  outlineColor: 'rgba(255, 255, 255, 0.92)',
  lineWidth: 1.5,
};

function getGuideFrame(canvas: HTMLCanvasElement, fitMode: 'cover' | 'contain'): PoseGuideFrame {
  const parent = canvas.parentElement!;
  const viewport = parent.getBoundingClientRect();
  let left = 0;
  let top = 0;
  let right = canvas.width;
  let bottom = canvas.height;
  const video = parent.querySelector<HTMLVideoElement>('video[data-testid="camera-video"]');
  if (fitMode === 'contain' && video && video.videoWidth > 0 && video.videoHeight > 0) {
    const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const width = video.videoWidth * scale;
    const height = video.videoHeight * scale;
    left = (canvas.width - width) / 2;
    top = (canvas.height - height) / 2;
    right = left + width;
    bottom = top + height;
  }

  const screen = canvas.closest('[data-testid="camera-screen"]');
  const header = screen?.querySelector('[data-testid="camera-header"]')?.getBoundingClientRect();
  const controls = screen?.querySelector('[data-testid="camera-controls"]')?.getBoundingClientRect();
  const hint = screen?.querySelector('[data-testid="pose-hint-card"]')?.getBoundingClientRect();
  if (header?.height) top = Math.max(top, header.bottom - viewport.top + 12);
  if (controls?.height) bottom = Math.min(bottom, controls.top - viewport.top - 12);
  if (hint?.height) {
    if (canvas.width > canvas.height && canvas.height <= 500) {
      left = Math.max(left, hint.right - viewport.left + 12);
    } else {
      bottom = Math.min(bottom, hint.top - viewport.top - 12);
    }
  }
  return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}


export function WireframeCanvas() {
  const targetPose = useAtomValue(targetPoseAtom);
  const facingMode = useAtomValue(cameraFacingModeAtom);
  const fitMode = useAtomValue(cameraFitModeAtom);
  const cameraStatus = useAtomValue(cameraStatusAtom);
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

      if (targetPose && targetPose.length > 0) {
        const projected = projectReferencePose(targetPose, canvas.width, canvas.height, getGuideFrame(canvas, fitMode), isMirrored);
        drawPoseSilhouette(ctx, projected, TARGET_SILHOUETTE_STYLE);
      }
    };

    draw();

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(draw)
      : null;
    if (observer) {
      observer.observe(parent);
      canvas.closest('[data-testid="camera-screen"]')
        ?.querySelectorAll('[data-testid="camera-header"], [data-testid="camera-controls"], [data-testid="pose-hint-card"]')
        .forEach((element) => observer.observe(element));
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
  }, [targetPose, fitMode, isMirrored, cameraStatus]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="wireframe-canvas"
      className="pointer-events-none absolute inset-0 h-full w-full z-10"
    />
  );
}

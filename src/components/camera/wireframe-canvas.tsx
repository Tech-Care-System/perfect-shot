'use client';

import { cameraFacingModeAtom, cameraFitModeAtom } from '@/lib/stores/camera-store';
import { poseResultAtom, targetPoseAtom } from '@/lib/stores/pose-store';
import { cn } from '@/lib/utils';
import { drawConnectors, drawLandmarks } from '@/lib/utils/drawing';
import { POSE_CONNECTIONS } from '@/lib/utils/pose-connections';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

const WIREFRAME_STYLE = {
  color: '#00FFFF',
  lineWidth: 2,
  radius: 3,
  shadowColor: '#000000',
  shadowBlur: 2,
};

const TARGET_WIREFRAME_STYLE = {
  color: 'rgba(255, 255, 255, 0.35)',
  lineWidth: 1,
  radius: 2,
  shadowColor: 'transparent',
  shadowBlur: 0,
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
  const poseResult = useAtomValue(poseResultAtom);
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

    const resizeCanvas = () => {
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
    };

    resizeCanvas();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        resizeCanvas();
      });

      observer.observe(parent);

      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mappingStyle = getObjectFitMappingStyle(canvas, fitMode);

    if (targetPose && targetPose.length > 0) {
      const targetStyle = { ...TARGET_WIREFRAME_STYLE, ...mappingStyle };
      drawConnectors(ctx, targetPose, POSE_CONNECTIONS, targetStyle);
      drawLandmarks(ctx, targetPose, targetStyle);
    }

    const landmarks = poseResult?.landmarks?.[0];
    if (landmarks && landmarks.length > 0) {
      const style = { ...WIREFRAME_STYLE, ...mappingStyle };
      drawConnectors(ctx, landmarks, POSE_CONNECTIONS, style);
      drawLandmarks(ctx, landmarks, style);
    }
  }, [poseResult, targetPose, fitMode]);

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

'use client';

import { useCamera } from '@/lib/hooks/use-camera';
import { usePoseDetection } from '@/lib/hooks/use-pose-detection';
import { cameraFitModeAtom, videoElementAtom } from '@/lib/stores/camera-store';
import { cn } from '@/lib/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { PoseStatusOverlay } from './pose-status-overlay';
import { WireframeCanvas } from './wireframe-canvas';

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, facingMode, status } = useCamera();
  const { startDetection, stopDetection } = usePoseDetection();
  
  // Use useAtomValue for reading atoms, not useCamera's facingMode 
  // (though useCamera returns context state, we want to be explicit about store usage if mixed)
  // Actually facingMode from useCamera is fine, but we need fitMode from store.
  const fitMode = useAtomValue(cameraFitModeAtom);
  const setVideoElement = useSetAtom(videoElementAtom);
  const isMirrored = facingMode === 'user';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
      
      video.onloadedmetadata = async () => {
        setVideoElement(video);
        try {
          await video.play();
        } catch {
          // Silent catch for autoplay blocks
        }
      };
      if (video.readyState >= 2) {
        setVideoElement(video);
        video.play().catch(() => {});
      }
      
    } else {
      video.srcObject = null;
      setVideoElement(null);
    }
  }, [stream, setVideoElement]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (status === 'ready' && video) {
      startDetection(video);
    } else {
      stopDetection();
    }
    
    return () => {
      stopDetection();
    };
  }, [status, startDetection, stopDetection]);

  return (
    <div className="relative h-full w-full">
      <PoseStatusOverlay />
      <WireframeCanvas />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        data-testid="camera-video"
        className={cn(
          "absolute inset-0 h-full w-full",
          fitMode === 'cover' ? 'object-cover' : 'object-contain',
          isMirrored ? "scale-x-[-1]" : "scale-x-100",
          "z-0" // Base layer
        )}
      />
    </div>
  );
}

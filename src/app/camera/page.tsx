'use client';

import { PermissionScreen } from '@/components/screens/permission-screen';
import { useCamera } from '@/lib/hooks/use-camera';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const CameraScreen = dynamic(() =>
  import('@/components/screens/camera-screen').then(m => ({ default: m.CameraScreen }))
);

export default function CameraPage() {
  const { permissionStatus, requestPermission, checkPermission } = useCamera();

  // Check permission ONLY when tab becomes visible (removed mount check to show welcome screen every time as requested)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPermission(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkPermission]);

  // Show camera screen only when permission is granted
  if (permissionStatus === 'granted') {
    return (
      <main className="flex h-screen w-screen overflow-hidden bg-black">
        <CameraScreen />
      </main>
    );
  }

  // Show permission screen for 'prompt' or 'denied' states
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-black">
      <PermissionScreen
        permissionStatus={permissionStatus}
        requestPermission={requestPermission}
        checkPermission={checkPermission}
      />
    </main>
  );
}

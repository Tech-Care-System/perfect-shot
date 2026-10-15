'use client';

import { Button } from '@/components/ui/button';
import { useCamera } from '@/lib/hooks/use-camera';
import type { CameraPermissionStatus } from '@/lib/types/camera.types';
import { logger } from '@/lib/utils/logger';
import { AlertTriangle, Camera, RefreshCw, Shield } from 'lucide-react';

const COMPONENT_NAME = 'PermissionScreen';

/**
 * Detect browser type for providing specific instructions
 */
function getBrowserType(): 'safari' | 'chrome' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
  const isChromeIOS = /CriOS/.test(ua);
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor || '');
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS/.test(ua);
  
  if (isChromeIOS) return 'chrome';
  if (isIOS || isSafari) return 'safari';
  if (isChrome) return 'chrome';
  return 'other';
}

/**
 * Get browser-specific instructions for re-enabling camera
 */
function getReEnableInstructions(browser: 'safari' | 'chrome' | 'other'): string[] {
  switch (browser) {
    case 'safari':
      return [
        'Tap the "aA" button in the address bar',
        'Select "Website Settings"',
        'Toggle "Camera" to Allow',
        'Refresh this page',
      ];
    case 'chrome':
      return [
        'Tap the lock icon in the address bar',
        'Select "Site settings"',
        'Toggle "Camera" to Allow',
        'Refresh this page',
      ];
    default:
      return [
        'Go to your browser settings',
        'Find site permissions or privacy settings',
        'Enable camera access for this site',
        'Refresh this page',
      ];
  }
}

/**
 * Welcome view - shown when permission is 'prompt'
 */
function WelcomeView({ onRequestPermission, isLoading }: { 
  onRequestPermission: () => void; 
  isLoading: boolean;
}) {
  return (
    <div className="permission-screen flex flex-col items-center justify-center gap-8 text-center">
      {/* Camera Icon */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface">
        <Camera className="h-12 w-12 text-foreground" />
      </div>
      
      {/* App Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          ai-perfect-shot
        </h1>
        <p className="text-lg text-muted-foreground">
          Real-time AI pose guidance
        </p>
      </div>
      
      {/* Value Proposition */}
      <div className="max-w-xs">
        <p className="text-base text-text-secondary">
          We need camera access to show you live pose feedback and help you take better photos.
        </p>
      </div>
      
      {/* CTA Button - 44px+ height for touch target */}
      <Button 
        size="lg" 
        className="h-12 min-w-[200px] text-base font-medium"
        onClick={onRequestPermission}
        disabled={isLoading}
      >
        {isLoading ? 'Requesting...' : 'Grant Camera Access'}
      </Button>
      
      {/* Privacy Note */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Your photos never leave your device</span>
      </div>
    </div>
  );
}

/**
 * Denied view - shown when permission is 'denied'
 */
function DeniedView({ onCheckAgain, isLoading }: { 
  onCheckAgain: () => void; 
  isLoading: boolean;
}) {
  const browser = getBrowserType();
  const instructions = getReEnableInstructions(browser);
  
  return (
    <div className="permission-screen flex flex-col items-center justify-center gap-8 text-center">
      {/* Warning Icon */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface">
        <AlertTriangle className="h-12 w-12 text-feedback-warning" />
      </div>
      
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Camera Access Needed
        </h1>
        <p className="text-base text-muted-foreground">
          No worries! Here&apos;s how to enable camera access:
        </p>
      </div>
      
      {/* Browser-specific instructions */}
      <ol className="max-w-xs list-inside list-decimal space-y-2 text-left text-sm text-text-secondary">
        {instructions.map((step, index) => (
          <li key={index} className="pl-2">
            {step}
          </li>
        ))}
      </ol>
      
      {/* Check Again Button - 44px+ height for touch target */}
      <Button 
        size="lg" 
        variant="secondary"
        className="h-12 min-w-[200px] text-base font-medium"
        onClick={onCheckAgain}
        disabled={isLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Checking...' : 'Check Again'}
      </Button>
      
      {/* Help text */}
      <p className="max-w-xs text-xs text-muted-foreground">
        Still having trouble? Try refreshing the page and tapping &quot;Grant Camera Access&quot; again.
      </p>
    </div>
  );
}

interface PermissionScreenCoreProps {
  permissionStatus: CameraPermissionStatus;
  requestPermission: () => Promise<boolean>;
  checkPermission: (silent?: boolean) => Promise<CameraPermissionStatus>;
}

/**
 * Core permission screen component (presentational)
 */
function PermissionScreenCore({ permissionStatus, requestPermission, checkPermission }: PermissionScreenCoreProps) {
  const handleRequestPermission = async () => {
    logger.log(COMPONENT_NAME, 'User requested camera permission');
    await requestPermission();
  };
  
  const handleCheckAgain = async () => {
    logger.log(COMPONENT_NAME, 'User checking permission again (non-silent probe)');
    // Use non-silent mode - this is a user gesture so we can probe
    await checkPermission(false);
  };
  
  // Don't render anything if permission is granted (main page handles this)
  if (permissionStatus === 'granted') {
    return null;
  }
  
  if (permissionStatus === 'denied') {
    return <DeniedView onCheckAgain={handleCheckAgain} isLoading={false} />;
  }
  
  return <WelcomeView onRequestPermission={handleRequestPermission} isLoading={false} />;
}

/**
 * PermissionScreen component with optional props
 * @description When used standalone, manages its own camera state via useCamera hook.
 * When used with props, acts as presentational component to avoid duplicate hook mounting.
 */
export interface PermissionScreenProps {
  permissionStatus?: CameraPermissionStatus;
  requestPermission?: () => Promise<boolean>;
  checkPermission?: (silent?: boolean) => Promise<CameraPermissionStatus>;
}

function PermissionScreenWithHook(props: PermissionScreenProps) {
  const { permissionStatus, requestPermission, checkPermission } = useCamera();

  return (
    <PermissionScreenCore
      permissionStatus={props.permissionStatus ?? permissionStatus}
      requestPermission={props.requestPermission ?? requestPermission}
      checkPermission={props.checkPermission ?? checkPermission}
    />
  );
}

export function PermissionScreen(props: PermissionScreenProps = {}) {
  // If all props are provided, render without initializing hook state.
  if (props.permissionStatus && props.requestPermission && props.checkPermission) {
    return (
      <PermissionScreenCore
        permissionStatus={props.permissionStatus}
        requestPermission={props.requestPermission}
        checkPermission={props.checkPermission}
      />
    );
  }

  return <PermissionScreenWithHook {...props} />;
}

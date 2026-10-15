/**
 * Camera permission status type
 * @description Maps to browser PermissionState for camera access
 */
export type CameraPermissionStatus = 'prompt' | 'granted' | 'denied';

/**
 * Camera facing mode type
 * @description 'user' = front camera, 'environment' = back camera
 */
export type CameraFacingMode = 'user' | 'environment';

/**
 * Camera configuration interface
 */
export interface CameraConstraints {
  video: {
    facingMode: CameraFacingMode;
    width?: { ideal: number };
    height?: { ideal: number };
    aspectRatio?: { ideal: number };
  };
  audio: boolean;
}

/**
 * Camera configuration interface
 */
export interface CameraConfig {
  facingMode: CameraFacingMode;
  width: number;
  height: number;
}

/**
 * Camera error codes
 */
export type CameraErrorCode = 'PERMISSION_DENIED' | 'NOT_FOUND' | 'NOT_READABLE' | 'UNKNOWN';

/**
 * Camera error interface
 */
export interface CameraError {
  code: CameraErrorCode;
  message: string;
}

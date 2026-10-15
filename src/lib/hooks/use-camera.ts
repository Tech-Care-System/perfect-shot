'use client';


import {
  activeStreamAtom,
  cameraErrorAtom,
  cameraFacingModeAtom,
  cameraPermissionAtom,
  cameraStatusAtom
} from '@/lib/stores/camera-store';
import type { CameraConstraints, CameraError, CameraErrorCode, CameraFacingMode, CameraPermissionStatus } from '@/lib/types/camera.types';
import { logger } from '@/lib/utils/logger';
import { useAtom } from 'jotai';
import { useCallback } from 'react';

const COMPONENT_NAME = 'useCamera';

/**
 * Maps DOMException names to CameraErrorCode
 */
function mapErrorToCode(error: unknown): CameraErrorCode {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'PERMISSION_DENIED';
      case 'NotFoundError':
        return 'NOT_FOUND';
      case 'NotReadableError':
        return 'NOT_READABLE';
      default:
        return 'UNKNOWN';
    }
  }
  return 'UNKNOWN';
}

/**
 * Check permission state without triggering prompt
 * @param silent If true, avoids getUserMedia probe (gesture-safe). If false, probes with getUserMedia.
 * @description Uses Permissions API when available, falls back to enumerateDevices or probe
 */
async function checkPermissionState(silent = true): Promise<CameraPermissionStatus> {
  try {
    // Standard Permissions API
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state as CameraPermissionStatus;
    }
    throw new Error('Permissions API not supported');
  } catch {
    // Fallback for browsers (Safari) that don't support permissions.query for camera
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) return 'prompt';
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasPermission = devices.some(d => d.kind === 'videoinput' && d.label);
      if (hasPermission) return 'granted';
      
      // If silent mode, we cannot probe further (iOS gesture requirement)
      if (silent) {
        return 'prompt';
      }
      
      // Non-silent mode: probe with getUserMedia (must be called from user gesture)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return 'granted';
      } catch (err) {
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          return 'denied';
        }
        return 'prompt';
      }
    } catch {
      return 'prompt';
    }
  }
}

/**
 * useCamera hook
 * @description Manages camera permission state and provides functions to request/check permissions
 * @critical Camera request MUST be triggered by user gesture (iOS Safari requirement)
 */
export function useCamera() {
  const [permissionStatus, setPermissionStatus] = useAtom(cameraPermissionAtom);
  const [error, setError] = useAtom(cameraErrorAtom);
  const [stream, setStream] = useAtom(activeStreamAtom);
  const [status, setStatus] = useAtom(cameraStatusAtom);
  const [facingMode, setFacingMode] = useAtom(cameraFacingModeAtom);

  /**
   * Check current permission state
   * @param silent If true (default), does not probe with getUserMedia. Safe for automatic checks.
   * @description Safe to call anytime - does not trigger browser prompt in silent mode
   */
  const checkPermission = useCallback(async (silent = true): Promise<CameraPermissionStatus> => {
    const permStatus = await checkPermissionState(silent);
    
    // Update to new status
    setPermissionStatus(permStatus);
    
    logger.log(COMPONENT_NAME, 'Permission checked', { status: permStatus, silent });
    return permStatus;
  }, [setPermissionStatus]);

  /**
   * Request camera permission
   * @critical MUST be called from user gesture (click handler) for iOS Safari
   * @returns true if permission granted, false otherwise
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setError(null);
    
    try {
      logger.log(COMPONENT_NAME, 'Requesting camera permission');
      
      // Request camera access - this triggers the browser permission prompt
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera
        } 
      });
      
      // Immediately stop the stream - we just needed to get permission
      tempStream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      logger.log(COMPONENT_NAME, 'Camera permission granted');
      return true;
    } catch (err) {
      const errorCode = mapErrorToCode(err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      const cameraError: CameraError = {
        code: errorCode,
        message: errorMessage,
      };
      
      setError(cameraError);
      
      if (errorCode === 'PERMISSION_DENIED') {
        setPermissionStatus('denied');
      }
      
      logger.log(COMPONENT_NAME, 'Camera permission request failed', { 
        code: errorCode, 
        message: errorMessage 
      });
      
      return false;
    }
  }, [setPermissionStatus, setError]);

  /**
   * Start the camera stream
   * @param requestedFacingMode 'user' or 'environment' (default: 'environment')
   */
  const startCamera = useCallback(async (requestedFacingMode: CameraFacingMode = 'environment') => {
    setStatus('loading');
    setError(null);
    setFacingMode(requestedFacingMode);

    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      logger.log(COMPONENT_NAME, 'Starting camera', { facingMode: requestedFacingMode });

      const constraints: CameraConstraints = {
        video: {
          facingMode: requestedFacingMode,
          aspectRatio: { ideal: 9/16 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(
        constraints as unknown as MediaStreamConstraints
      );

      setStream(newStream);
      setPermissionStatus('granted');
      setStatus('ready');
      logger.log(COMPONENT_NAME, 'Camera started successfully');
    } catch (err) {
      const errorCode = mapErrorToCode(err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      const cameraError: CameraError = {
        code: errorCode,
        message: errorMessage,
      };

      setError(cameraError);
      setStream(null);
      setStatus('error');

      if (errorCode === 'PERMISSION_DENIED') {
        setPermissionStatus('denied');
      }

      logger.log(COMPONENT_NAME, 'Failed to start camera', { code: errorCode, message: errorMessage });
    }
  }, [stream, setError, setPermissionStatus, setStatus, setStream, setFacingMode]);

  /**
   * Stop the camera stream
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setStatus('idle');
      logger.log(COMPONENT_NAME, 'Camera stopped');
    }
  }, [stream, setStream, setStatus]);

  // Side effects removed from hook to avoid loops and accidental track stopping
  // These should be handled by the top-level app component or dedicated screens


  return {
    permissionStatus,
    requestPermission,
    checkPermission,
    startCamera,
    stopCamera,
    stream,
    status,
    facingMode,
    error,
  };
}

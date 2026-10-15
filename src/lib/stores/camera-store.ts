import type { CameraError, CameraFacingMode, CameraPermissionStatus } from '@/lib/types/camera.types';
import type { AsyncStatus } from '@/lib/types/status.types';
import { atom } from 'jotai';

/**
 * Camera permission state atom
 * @description Tracks the current permission status for camera access
 */
export const cameraPermissionAtom = atom<CameraPermissionStatus>('prompt');

/**
 * Camera async status atom
 * @description Tracks the loading/ready state of the camera
 */
export const cameraStatusAtom = atom<AsyncStatus>('idle');

/**
 * Camera facing mode atom
 * @description 'environment' = back camera (default), 'user' = front camera
 */
export const cameraFacingModeAtom = atom<CameraFacingMode>('environment');

/**
 * Camera error atom
 * @description Stores any camera-related errors
 */
export const cameraErrorAtom = atom<CameraError | null>(null);

/**
 * Active media stream atom
 * @description The current active camera stream
 */
export const activeStreamAtom = atom<MediaStream | null>(null);

/**
 * Camera fit mode atom
 * @description 'cover' = fill screen (cropped), 'contain' = fit screen (letterboxed)
 */
export const cameraFitModeAtom = atom<'cover' | 'contain'>('cover');

/**
 * The live HTMLVideoElement from CameraPreview, set when the video is playing.
 * Used by useSmartShutter and manual capture to call capturePhoto().
 * Null when camera is stopped or not yet started.
 */
export const videoElementAtom = atom<HTMLVideoElement | null>(null);

/**
 * The captured photo as a JPEG data URL, or null when no photo is captured.
 * Non-null value renders PreviewScreen overlay in CameraScreen.
 * Cleared by "Retake" action to return to camera view.
 */
export const capturedPhotoAtom = atom<string | null>(null);


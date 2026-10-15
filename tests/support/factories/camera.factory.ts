/**
 * Camera Data Factory for Playwright
 * Provides mocks for MediaDevices and MediaStream
 */

export const createMockMediaStream = () => {
  return {
    id: 'mock-stream-' + Math.random().toString(36).substring(7),
    active: true,
    getTracks: () => [createMockMediaStreamTrack()],
    getVideoTracks: () => [createMockMediaStreamTrack('video')],
    getAudioTracks: () => [],
  };
};

export const createMockMediaStreamTrack = (kind = 'video') => {
  return {
    kind,
    label: `Mock ${kind} track`,
    enabled: true,
    readyState: 'live',
    id: 'mock-track-' + Math.random().toString(36).substring(7),
    stop: () => {},
    applyConstraints: async () => {},
    getSettings: () => ({
      width: 1080,
      height: 1920,
      aspectRatio: 1080 / 1920,
      facingMode: 'environment',
    }),
  };
};

export const createMockCameraDevice = (facingMode = 'environment') => {
  return {
    deviceId: 'mock-device-' + facingMode,
    kind: 'videoinput',
    label: `Mock Camera (${facingMode})`,
    groupId: 'mock-group',
  };
};

let dingSound: HTMLAudioElement | null = null;

export function preloadAudio(): void {
  if (typeof window === 'undefined' || dingSound) return;
  try {
    dingSound = new Audio('/sounds/ding.mp3');
    dingSound.preload = 'auto';
    dingSound.load();
  } catch {
    // Audio API not available
  }
}

export function playDing(): void {
  if (!dingSound) return;
  try {
    dingSound.currentTime = 0;
    dingSound.play().catch(() => {});
  } catch {
    // Playback failed (muted, blocked, etc.)
  }
}

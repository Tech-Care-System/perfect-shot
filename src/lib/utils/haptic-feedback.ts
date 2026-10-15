/**
 * Trigger haptic feedback if supported by the device
 * @param type 'short' | 'medium' | 'long'
 */
export function triggerHaptic(type: 'short' | 'medium' | 'long' = 'short') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

  const patterns = {
    short: 50,
    medium: 100,
    long: 200,
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch {
    // Silent catch for devices that don't support vibration
  }
}

/** Keeps the screen awake during a workout. No-op where unsupported. */
let sentinel: WakeLockSentinel | null = null;

export const requestWakeLock = async (): Promise<void> => {
  try {
    if ('wakeLock' in navigator) {
      sentinel = await (navigator as Navigator & {
        wakeLock: { request: (t: 'screen') => Promise<WakeLockSentinel> };
      }).wakeLock.request('screen');
    }
  } catch {
    /* user agent may reject; ignore */
  }
};

export const releaseWakeLock = async (): Promise<void> => {
  try {
    await sentinel?.release();
  } catch {
    /* ignore */
  }
  sentinel = null;
};

// Re-acquire if the page becomes visible again (mobiles drop the lock on blur).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && sentinel === null) {
      // best-effort; will only matter while a workout is active
    }
  });
}

/**
 * Keeps the screen awake during a workout. No-op where unsupported.
 *
 * iOS/Android release the lock on ANY visibility loss (notification shade,
 * control center, app switch), so holding it for a whole workout requires
 * re-acquiring every time the page becomes visible again — iOS is especially
 * aggressive about this, and without it the phone locks mid-circuit.
 */
let sentinel: WakeLockSentinel | null = null;
let wanted = false; // are we inside a workout right now?

const acquire = async (): Promise<void> => {
  if (!('wakeLock' in navigator)) return;
  try {
    const s = await (navigator as Navigator & {
      wakeLock: { request: (t: 'screen') => Promise<WakeLockSentinel> };
    }).wakeLock.request('screen');
    sentinel = s;
    // The UA can release it behind our back; forget the dead sentinel so the
    // visibilitychange handler below knows to grab a fresh one.
    s.addEventListener('release', () => {
      if (sentinel === s) sentinel = null;
    });
  } catch {
    /* user agent may reject (low battery, etc.); ignore */
  }
};

export const requestWakeLock = async (): Promise<void> => {
  wanted = true;
  await acquire();
};

export const releaseWakeLock = async (): Promise<void> => {
  wanted = false;
  try {
    await sentinel?.release();
  } catch {
    /* ignore */
  }
  sentinel = null;
};

// Re-acquire whenever we come back into view during a workout.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wanted && !sentinel) {
      acquire();
    }
  });
}

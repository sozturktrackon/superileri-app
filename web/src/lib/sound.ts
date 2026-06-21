/**
 * Tiny WebAudio beeper. No assets — tones are synthesized so there's nothing to
 * download and it works offline. Must be unlocked by a user gesture first
 * (call unlock() inside a tap handler) to satisfy mobile autoplay policies.
 */
let ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
};

export const unlockAudio = async (): Promise<void> => {
  const c = getCtx();
  if (c && c.state === 'suspended') {
    try {
      await c.resume();
    } catch {
      /* ignore */
    }
  }
  // Play an inaudible blip to fully unlock on iOS.
  if (c) {
    const o = c.createOscillator();
    const g = c.createGain();
    g.gain.value = 0.0001;
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.01);
  }
};

const tone = (freq: number, durationMs: number, volume = 0.25) => {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  const now = c.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(volume, now + 0.01);
  g.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
  o.connect(g).connect(c.destination);
  o.start(now);
  o.stop(now + durationMs / 1000 + 0.02);
};

/** Short countdown blip for the last seconds of an "on" interval. */
export const beepCountdown = () => tone(880, 150, 0.3);
/** Long tone marking the end of an interval / start of rest. */
export const beepEnd = () => tone(523.25, 450, 0.35);
/** Rising tone marking the start of an "on" interval. */
export const beepGo = () => tone(1046.5, 300, 0.35);
/** Triumphant little flourish when a workout completes. */
export const beepFinish = () => {
  tone(659.25, 180, 0.3);
  setTimeout(() => tone(783.99, 180, 0.3), 160);
  setTimeout(() => tone(1046.5, 350, 0.35), 320);
};

/** Vibrate if the device supports it (nice on phones). */
export const buzz = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
};

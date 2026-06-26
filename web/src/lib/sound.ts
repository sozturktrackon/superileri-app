/**
 * Tiny WebAudio beeper. No assets; tones are synthesized so there's nothing to
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

/* ---- Voice cues (Amazon Polly "Matthew" neural clips) ------------------- */
const VOICE_NAMES = ['ready', 'three', 'two', 'one', 'rest', 'go'] as const;
const clips: Record<string, AudioBuffer> = {};

/** Fetch + decode the voice clips. Safe to call repeatedly; no-op if loaded. */
export const loadVoice = async (): Promise<void> => {
  const c = getCtx();
  if (!c) return;
  await Promise.all(
    VOICE_NAMES.map(async (n) => {
      if (clips[n]) return;
      try {
        const res = await fetch(`/audio/${n}.mp3`);
        if (!res.ok) return;
        clips[n] = await c.decodeAudioData(await res.arrayBuffer());
      } catch {
        /* clip unavailable -> caller falls back to a beep */
      }
    })
  );
};

/** Speak a cue. Returns false if the clip isn't ready (caller can fall back). */
export const say = (name: string, volume = 1): boolean => {
  const c = getCtx();
  if (!c || !clips[name]) return false;
  if (c.state === 'suspended') c.resume();
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = volume;
  src.buffer = clips[name];
  src.connect(g).connect(c.destination);
  src.start();
  return true;
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

/** Loud countdown blip for the last 3 seconds of an "on" interval. */
export const beepCountdown = () => tone(1000, 200, 0.7);
/** Long tone marking the end of an interval / start of rest. */
export const beepEnd = () => tone(523.25, 450, 0.4);
/** Rising tone marking the start of an "on" interval. */
export const beepGo = () => tone(1046.5, 300, 0.4);

/**
 * Boxing-ring bell: a bright metallic triple "ding" that marks the start of a
 * work round. Synthesized (two detuned partials + fast decay), played 3x.
 */
export const beepBell = () => {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  const ding = (t: number) => {
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    o1.type = 'triangle';
    o2.type = 'sine';
    o1.frequency.value = 880;
    o2.frequency.value = 1318.5; // a fifth up (metallic shimmer)
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.7, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.5);
    o1.connect(g);
    o2.connect(g);
    g.connect(c.destination);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.55);
    o2.stop(t + 0.55);
  };
  const now = c.currentTime;
  ding(now);
  ding(now + 0.2);
  ding(now + 0.4);
};
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

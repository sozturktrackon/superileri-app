/**
 * Tiny WebAudio beeper. No assets for tones; they're synthesized so there's
 * nothing to download and it works offline. Voice cues are short pre-recorded
 * clips. Must be unlocked by a user gesture first (call unlock() inside a tap
 * handler) to satisfy mobile autoplay policies.
 *
 * All cues route through one master gain -> compressor chain so we can push
 * loudness up (to cut through background music) without harsh clipping, and
 * so the music player can duck itself in response to a cue (see duckMusic in
 * ytPlayer.ts, fired from say()/beep*() below).
 */
import { duckMusic } from './ytPlayer';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    // iOS: by default WebAudio routes through the channel muted by the
    // ring/silent side switch — with the switch on silent, every cue is
    // inaudible. Declaring the session as 'playback' (iOS 17+) routes us like
    // a media app, which ignores the switch (same as YouTube or Spotify).
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) {
      try {
        nav.audioSession.type = 'playback';
      } catch {
        /* older iOS */
      }
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
};

/** iOS suspends (or marks 'interrupted') the context on screen lock, Siri,
 *  calls, and app switches — and it does NOT always come back by itself. Kick
 *  it before every cue and whenever the app returns to view. (A bare
 *  `state === 'suspended'` check misses Safari's 'interrupted' state.) */
const ensureRunning = (c: AudioContext): void => {
  if (c.state !== 'running') {
    c.resume().catch(() => {});
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx) ensureRunning(ctx);
  });
}

/** Shared master bus: gain (headroom for boosted cues) -> limiter -> speakers. */
const getMaster = (c: AudioContext): GainNode => {
  if (master) return master;
  const compressor = c.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 6;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.15;
  master = c.createGain();
  master.gain.value = 1;
  master.connect(compressor);
  compressor.connect(c.destination);
  return master;
};

export const unlockAudio = async (): Promise<void> => {
  const c = getCtx();
  if (c && c.state !== 'running') {
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
    o.connect(g).connect(getMaster(c));
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

/** Speak a cue, ducking any playing music for its rough duration. Returns
 *  false if the clip isn't ready (caller can fall back to a beep). */
export const say = (name: string, volume = 1.5): boolean => {
  const c = getCtx();
  if (!c || !clips[name]) return false;
  ensureRunning(c);
  const buf = clips[name];
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = volume;
  src.buffer = buf;
  src.connect(g).connect(getMaster(c));
  src.start();
  duckMusic(Math.max(700, buf.duration * 1000 + 250));
  return true;
};

const tone = (freq: number, durationMs: number, volume = 0.25) => {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  const now = c.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(volume, now + 0.01);
  g.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
  o.connect(g).connect(getMaster(c));
  o.start(now);
  o.stop(now + durationMs / 1000 + 0.02);
};

/** Loud countdown blip for the last 3 seconds of an "on" interval. */
export const beepCountdown = () => {
  duckMusic(700);
  tone(1000, 200, 1.1);
};
/** Long tone marking the end of an interval / start of rest. */
export const beepEnd = () => {
  duckMusic(900);
  tone(523.25, 450, 0.75);
};
/** Rising tone marking the start of an "on" interval. */
export const beepGo = () => {
  duckMusic(700);
  tone(1046.5, 300, 0.75);
};
/** Fallback tone for the "Ready" cue if the voice clip isn't loaded yet. */
export const beepReady = () => {
  duckMusic(700);
  tone(700, 220, 0.85);
};

/**
 * Boxing-ring bell: a bright metallic triple "ding" that marks the start of a
 * work round. Synthesized (two detuned partials + fast decay), played 3x.
 */
export const beepBell = () => {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);
  duckMusic(1000);
  const ding = (t: number) => {
    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    o1.type = 'triangle';
    o2.type = 'sine';
    o1.frequency.value = 880;
    o2.frequency.value = 1318.5; // a fifth up (metallic shimmer)
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1.2, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.5);
    o1.connect(g);
    o2.connect(g);
    g.connect(getMaster(c));
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
  duckMusic(900);
  tone(659.25, 180, 0.55);
  setTimeout(() => tone(783.99, 180, 0.55), 160);
  setTimeout(() => tone(1046.5, 350, 0.6), 320);
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

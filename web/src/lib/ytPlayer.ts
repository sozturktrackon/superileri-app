/**
 * Loads the official YouTube IFrame Player API once. Using the real API
 * (instead of a bare <iframe src=...>) gives us: volume control (so we can
 * duck the music under voice cues) and onError/state callbacks (so we can
 * detect a blocked/sign-in-walled embed and fall back to "Open in YouTube"
 * automatically, instead of silently doing nothing).
 */
declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

let apiPromise: Promise<NonNullable<Window['YT']>> | null = null;

export const loadYouTubeApi = (): Promise<NonNullable<Window['YT']>> => {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
};

/** Tell any mounted player(s) to duck volume briefly (voice cue is playing). */
export const duckMusic = (ms: number): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('superileri:duck', { detail: { ms } }));
};

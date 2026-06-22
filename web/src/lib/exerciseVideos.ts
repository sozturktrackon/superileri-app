/**
 * Per-exercise YouTube demo links, stored in the browser (no redeploy needed to
 * add them). When set, the workout box autoplays the clip — muted and looping —
 * the moment the timer reaches (or preps/rests for) that exercise.
 */
export type ExVid = { ytId: string; start?: number };

const LS_KEY = 'superileri.exVideos.v1';

/** Parse a YouTube URL (or bare id) into a video id + optional start second. */
export const parseVideo = (raw: string): ExVid | null => {
  const s = raw.trim();
  if (!s) return null;
  const startFrom = (u: URL): number | undefined => {
    const t = u.searchParams.get('t') || u.searchParams.get('start');
    if (!t) return undefined;
    const m = /^(\d+)(s)?$/.exec(t);
    return m ? Number(m[1]) : undefined;
  };
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtu.be')) {
      return { ytId: u.pathname.slice(1), start: startFrom(u) };
    }
    if (u.pathname.startsWith('/shorts/')) {
      return { ytId: u.pathname.split('/')[2], start: startFrom(u) };
    }
    const v = u.searchParams.get('v');
    if (v) return { ytId: v, start: startFrom(u) };
  } catch {
    // bare id
    if (/^[A-Za-z0-9_-]{6,}$/.test(s)) return { ytId: s };
  }
  return null;
};

export const loadExVideos = (): Record<string, ExVid> => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
};

const save = (map: Record<string, ExVid>) =>
  localStorage.setItem(LS_KEY, JSON.stringify(map));

export const setExVideo = (
  map: Record<string, ExVid>,
  exerciseId: string,
  raw: string
): Record<string, ExVid> => {
  const parsed = parseVideo(raw);
  const next = { ...map };
  if (parsed) next[exerciseId] = parsed;
  else delete next[exerciseId];
  save(next);
  return next;
};

export const removeExVideo = (
  map: Record<string, ExVid>,
  exerciseId: string
): Record<string, ExVid> => {
  const next = { ...map };
  delete next[exerciseId];
  save(next);
  return next;
};

/** Autoplay, muted, looping, minimal-chrome embed that fills the box. */
export const exEmbedUrl = (v: ExVid): string => {
  const p = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: v.ytId, // required for single-video loop
    controls: '0',
    playsinline: '1',
    modestbranding: '1',
    rel: '0',
  });
  if (v.start) p.set('start', String(v.start));
  return `https://www.youtube-nocookie.com/embed/${v.ytId}?${p}`;
};

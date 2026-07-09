/**
 * Per-exercise YouTube demo links, stored in the browser (no redeploy needed to
 * add them). When set, the workout box autoplays the clip (muted and looping)
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

// Curated YouTube demos that ship by default (override the AI clips for
// everyone). A user's own link for an exercise still takes precedence.
const DEFAULT_VIDEOS: Record<string, string> = {
  // Chest
  'traditional-push-up': 'https://youtu.be/QzoKX46eVRU',
  'wide-push-up': 'https://youtu.be/b4qT2NLX4Ws',
  'diamond-push-up': 'https://youtu.be/XtU2VQVuLYs',
  'incline-push-up': 'https://youtu.be/Gvm5Q29UHbk',
  'decline-push-up': 'https://youtube.com/shorts/lx-49Yjqm-Q',
  'fly-slides': 'https://youtu.be/YVl73yBgO2o',
  // Back
  'back-extensions': 'https://youtu.be/Q6w2cCCojHY',
  'supermans': 'https://youtu.be/NHkILjfYrN8',
  'hindu-push-ups': 'https://youtube.com/shorts/QraO1UIy1Uw',
  'lat-slides': 'https://youtu.be/qgawPyQpt6Y',
  // Shoulders
  'pike-push-up': 'https://youtu.be/XckEEwa1BPI',
  'pulling-lat-raise': 'https://youtu.be/9znwemlha0U',
  'tomahawk-shoulder-raise': 'https://youtu.be/yuXnSshSxh4',
  'front-raise': 'https://youtu.be/ncwdQUl5Apw',
  'y-up-to-pull-down': 'https://youtu.be/RepHlMy9m60',
  // Legs
  'timed-squats': 'https://youtu.be/X2tq7-S_Uv4',
  'wall-sits': 'https://youtu.be/u6xqmVUxaf0',
  'alternating-reverse-lunge': 'https://youtu.be/xrPteyQLGAo',
  'isolated-lunge-pulse': 'https://youtube.com/shorts/ZLWXFlp55n4',
  'alternating-curtsy-lunge': 'https://youtu.be/2EyH9MN7hYE',
  'isolated-curtsy-lunge-pulse': 'https://youtu.be/HzUneLDK4xk',
  'hip-thrusts': 'https://youtube.com/shorts/tqGid2LoyEw',
  // Upper Body HIIT
  'plank-jacks': 'https://youtu.be/9A7ZAXxMV0Q',
  'crawl-outs': 'https://youtu.be/4Bnsqb_1SmI',
  'plank-oblique-hops': 'https://youtu.be/BWvUFHnW8jc',
  'plank-toe-taps': 'https://youtu.be/tuyemiJMv1g',
  // Lower Body HIIT
  'alternating-side-lunges': 'https://youtu.be/WKg_FedO-EE',
  'lunge-jumps': 'https://youtu.be/iJMsF7fzrOM',
  'low-in-out-squats': 'https://youtube.com/shorts/ntvNU3PJvLg',
  'jump-squats': 'https://youtube.com/shorts/36vnWAkL7ZQ',
  // Cardio HIIT
  'high-knees': 'https://youtube.com/shorts/mTIvJgQK7Ec',
  'jumping-jacks': 'https://youtu.be/uLVt6u15L98',
  'burpees': 'https://youtube.com/shorts/gYiE_2BtSTg',
  'mountain-climbers': 'https://youtu.be/kLh-uczlPLg',
  // Full Body Growth Circuit
  'plank-push-ups': 'https://youtube.com/shorts/mHzGyMLN144',
  'isolated-chest-hold-oblique-toe-taps': 'https://youtu.be/ke6DoSMW6tg',
  'scapular-holds-wide-push-up': 'https://youtu.be/1na_MR8s_MM',
  'chair-dips': 'https://youtu.be/wYUXyGQQ3Rk',
  // Core & Abs Circuit
  'squat-to-oblique-cross': 'https://youtu.be/eQnFX1FYvXk',
  'v-sit': 'https://youtu.be/ILyGW-V0gGw',
  'single-side-bicycle-crunch-isolations': 'https://youtu.be/OhW2ez1OsFs',
  'plank-slides': 'https://youtu.be/cv-CTjDskBc',
  // Glutes & Booty Circuit (reconstructed)
  'glute-bridge': 'https://youtu.be/wPM8icPu6H8',
  'single-leg-glute-bridge': 'https://youtu.be/sVfp4LN9niA',
  'donkey-kicks': 'https://youtu.be/KgghFOMKnkE',
  'fire-hydrants': 'https://youtu.be/7LnuhLi-78I',
  'sumo-squats': 'https://youtu.be/DAD6BkE5hKs',
  // ---- Level II circuits (curated Shorts / short demos, oEmbed-verified) ----
  // Chest Strength II
  'tempo-push-up': 'https://www.youtube.com/shorts/It9gzXTgc2o',
  'archer-push-up': 'https://www.youtube.com/shorts/HXiwGFWx1mU',
  'pseudo-planche-push-up': 'https://www.youtube.com/shorts/AvRdl1cnXo8',
  'push-up-shoulder-tap': 'https://www.youtube.com/shorts/EEztH7RG4V4',
  // Back Strength II
  'ytw-swimmers': 'https://www.youtube.com/shorts/F9EXy6psIzU',
  'superman-pull-down': 'https://www.youtube.com/shorts/DpdF_-aUSoo',
  'dive-bombers': 'https://www.youtube.com/shorts/BX8xNNRV1eE',
  'self-resisted-towel-row': 'https://www.youtube.com/watch?v=Ee3zIs2Rb9c',
  // Shoulder Strength II
  'elevated-pike-push-up': 'https://www.youtube.com/shorts/3d-xLoUAP0o',
  'plank-up-down': 'https://www.youtube.com/shorts/SZ8ZQiQcAt4',
  'lateral-raise-iso-hold': 'https://www.youtube.com/shorts/0czE9AXnWCg',
  'wall-angels': 'https://www.youtube.com/shorts/X8aFCLvh5lM',
  // Leg Strength II
  'tempo-squat': 'https://www.youtube.com/shorts/9imncDx8eQg',
  'bulgarian-split-squat': 'https://www.youtube.com/shorts/9p5e2BSvoLs',
  'single-leg-rdl': 'https://www.youtube.com/watch?v=JQZqPsmeesc',
  'sliding-hamstring-curl': 'https://www.youtube.com/shorts/hzcQDCm3sQ0',
  'squat-calf-raise': 'https://www.youtube.com/shorts/-rU8QHnx9Tw',
  // Upper Body HIIT II
  'bear-crawl': 'https://www.youtube.com/shorts/-9L3rTrYo4Q',
  'plank-jack-shoulder-tap': 'https://www.youtube.com/shorts/07i-UiTpTm0',
  'cross-body-climbers': 'https://www.youtube.com/shorts/vA576wwzUAg',
  'shadow-boxing': 'https://www.youtube.com/shorts/oB_xHVeXhxA',
  // Lower Body HIIT II
  'speed-skaters': 'https://www.youtube.com/watch?v=9_jLW6VkU8A',
  'squat-calf-pop': 'https://www.youtube.com/shorts/31JMTItqvo8',
  'quick-feet-pulses': 'https://www.youtube.com/watch?v=mP2zippJ4SQ',
  'reverse-lunge-knee-drive': 'https://www.youtube.com/shorts/8_LD0WinwwU',
  // Cardio HIIT II ('burpees' reuses the Level I entry above)
  'invisible-jump-rope': 'https://www.youtube.com/watch?v=B3Z28sZg9y0',
  'seal-jacks': 'https://www.youtube.com/shorts/oSX1tIhD_7I',
  'high-knee-sprints': 'https://www.youtube.com/shorts/82pdtHaANGk',
  // Core & Abs Circuit II
  'hollow-body-hold': 'https://www.youtube.com/shorts/MY6_stJuy7M',
  'side-plank-hip-dips': 'https://www.youtube.com/shorts/4yylMqlnjwU',
  'body-saw-slides': 'https://www.youtube.com/shorts/bqayZLi8heE',
  'squat-cross-pulse': 'https://www.youtube.com/shorts/hw5ahMi0anA',
  // Full Body Circuit II
  'plank-push-up-tap': 'https://www.youtube.com/shorts/EEztH7RG4V4',
  'crab-reach': 'https://www.youtube.com/shorts/DY6b2D9oRvc',
  'elevated-chair-dips': 'https://www.youtube.com/watch?v=hx8RX9x3dUE',
  'sprawls': 'https://www.youtube.com/shorts/mqZNxmlnZOw',
  // Glutes & Booty Circuit II
  'single-leg-hip-thrust': 'https://www.youtube.com/watch?v=GoqoWSAiOsA',
  'cossack-squat': 'https://www.youtube.com/shorts/pJzSDpcehuQ',
  'fire-hydrant-kick': 'https://www.youtube.com/shorts/FrvA1bjz-PU',
  'tempo-sumo-calf-raise': 'https://www.youtube.com/watch?v=GD5IaDVlGhA',
};

export const loadExVideos = (): Record<string, ExVid> => {
  const out: Record<string, ExVid> = {};
  for (const [id, raw] of Object.entries(DEFAULT_VIDEOS)) {
    const p = parseVideo(raw);
    if (p) out[id] = p;
  }
  try {
    Object.assign(out, JSON.parse(localStorage.getItem(LS_KEY) || '{}'));
  } catch {
    /* ignore */
  }
  return out;
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

/** Autoplay, muted, looping, minimal-chrome embed that fills the box. Uses
 *  youtube.com (not the "-nocookie" domain) — nocookie mode is specifically
 *  designed to NOT use the viewer's YouTube session, which is the opposite of
 *  what we want; the regular domain can use it wherever the browser allows
 *  third-party cookies (varies by platform). */
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
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  });
  if (v.start) p.set('start', String(v.start));
  return `https://www.youtube.com/embed/${v.ytId}?${p}`;
};

/** Real youtube.com watch page for this exercise's clip (fallback link). */
export const exWatchUrl = (v: ExVid): string =>
  `https://www.youtube.com/watch?v=${v.ytId}`;

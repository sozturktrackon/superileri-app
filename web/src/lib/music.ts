/**
 * Music library, persisted in localStorage (no backend round-trip; works
 * offline). Supports multiple named playlists, a default "active" one, and an
 * optional mapping from a workout category (group key) to a specific playlist —
 * so e.g. "Cardio HIIT" can blast a different mix than "Chest Strength".
 */

export type Playlist = {
  id: string; // local id
  label: string;
  kind: 'playlist' | 'video';
  ytId: string; // YouTube playlist or video id
  raw: string; // original pasted link/id
};

export type MusicConfig = {
  playlists: Playlist[];
  activeId: string | null;
  categoryMap: Record<string, string>; // groupKey -> playlist.id
};

const LS_KEY = 'superileri.music.v2';

const STARTER: Playlist[] = [
  {
    id: 'starter-mix',
    label: 'Workout Mix',
    kind: 'playlist',
    ytId: 'PLcirGkCPmbmFeQ1sm4wFciF03D_EroIfr',
    raw: 'PLcirGkCPmbmFeQ1sm4wFciF03D_EroIfr',
  },
];

export const parseYouTube = (
  raw: string
): { kind: 'playlist' | 'video'; ytId: string } | null => {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    const list = u.searchParams.get('list');
    if (list) return { kind: 'playlist', ytId: list };
    const v = u.searchParams.get('v');
    if (v) return { kind: 'video', ytId: v };
    if (u.hostname.includes('youtu.be'))
      return { kind: 'video', ytId: u.pathname.slice(1) };
  } catch {
    if (/^(PL|UU|OL|RD|FL)/.test(s)) return { kind: 'playlist', ytId: s };
    return { kind: 'video', ytId: s };
  }
  return null;
};

export const loadMusic = (): MusicConfig => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved) as MusicConfig;
  } catch {
    /* fall through */
  }
  return { playlists: STARTER, activeId: STARTER[0].id, categoryMap: {} };
};

export const saveMusic = (cfg: MusicConfig): void => {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
};

export const addPlaylist = (
  cfg: MusicConfig,
  label: string,
  raw: string
): MusicConfig => {
  const parsed = parseYouTube(raw);
  if (!parsed) return cfg;
  const id = `pl-${Date.now()}`;
  const pl: Playlist = { id, label: label || 'My Playlist', raw, ...parsed };
  const next: MusicConfig = {
    ...cfg,
    playlists: [...cfg.playlists, pl],
    activeId: cfg.activeId ?? id,
  };
  saveMusic(next);
  return next;
};

export const removePlaylist = (cfg: MusicConfig, id: string): MusicConfig => {
  const playlists = cfg.playlists.filter((p) => p.id !== id);
  const categoryMap = Object.fromEntries(
    Object.entries(cfg.categoryMap).filter(([, v]) => v !== id)
  );
  const next: MusicConfig = {
    ...cfg,
    playlists,
    categoryMap,
    activeId: cfg.activeId === id ? (playlists[0]?.id ?? null) : cfg.activeId,
  };
  saveMusic(next);
  return next;
};

export const setActive = (cfg: MusicConfig, id: string): MusicConfig => {
  const next = { ...cfg, activeId: id };
  saveMusic(next);
  return next;
};

export const setCategoryPlaylist = (
  cfg: MusicConfig,
  groupKey: string,
  playlistId: string | null
): MusicConfig => {
  const categoryMap = { ...cfg.categoryMap };
  if (playlistId) categoryMap[groupKey] = playlistId;
  else delete categoryMap[groupKey];
  const next = { ...cfg, categoryMap };
  saveMusic(next);
  return next;
};

/** Resolve which playlist should play for a given workout category. */
export const playlistForCategory = (
  cfg: MusicConfig,
  groupKey?: string
): Playlist | null => {
  if (groupKey && cfg.categoryMap[groupKey]) {
    const mapped = cfg.playlists.find((p) => p.id === cfg.categoryMap[groupKey]);
    if (mapped) return mapped;
  }
  return cfg.playlists.find((p) => p.id === cfg.activeId) ?? null;
};

export const embedSrc = (pl: Playlist): string => {
  const base = 'https://www.youtube-nocookie.com/embed';
  return pl.kind === 'playlist'
    ? `${base}/videoseries?list=${pl.ytId}&autoplay=1&loop=1`
    : `${base}/${pl.ytId}?autoplay=1&loop=1&playlist=${pl.ytId}`;
};

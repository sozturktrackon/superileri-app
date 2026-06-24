/**
 * Music library, persisted in localStorage. Ships with a curated set of popular,
 * validated workout playlists and auto-assigns them by workout type + day, so
 * the music fits the circuit and varies day to day. Fully editable in-app.
 */

export type Genre = 'hype' | 'phonk' | 'edm' | 'rock' | 'pop' | 'general';

export type Playlist = {
  id: string;
  label: string;
  kind: 'playlist' | 'video';
  ytId: string;
  raw: string;
  genre?: Genre;
};

export type MusicConfig = {
  playlists: Playlist[];
  activeId: string | null;
  categoryMap: Record<string, string>; // groupKey -> playlist.id (manual override)
};

const LS_KEY = 'superileri.music.v3';

// Curated, validated popular workout playlists (big stable channels).
const lib = (
  id: string,
  label: string,
  genre: Genre,
  ytId: string
): Playlist => ({ id, label, genre, ytId, raw: ytId, kind: 'playlist' });

export const LIBRARY: Playlist[] = [
  lib('hype-1', 'Rap & Hip-Hop Gym Mix', 'hype', 'PLV3-VaS2sVqkEsOsXJv5BSzdk3pJQaLc1'),
  lib('hype-2', 'Aggressive Rap (Eminem/2Pac)', 'hype', 'PLP4bxWU0z_z33Urz5Rh588UB_TtAAVXSL'),
  lib('phonk-1', 'Aggressive Phonk Gym', 'phonk', 'PL-FvsdtT_PICePSvo7yaxIEoFvlxjQft9'),
  lib('phonk-2', 'Best Gym Phonk', 'phonk', 'PLh87C2CL3pZsZbEo9TUY3a9CWqJkKuBD4'),
  lib('edm-1', 'Best EDM Workout Songs', 'edm', 'PLQdn7YisXz3Nzy1sgAMMXA8P4Qd-RMGL7'),
  lib('edm-2', 'Workout Remixes EDM', 'edm', 'PLJQrUSvEtfTgsF5VH0fiNSkzqLDmpKLFV'),
  lib('edm-3', 'EPIC EDM / Deep House', 'edm', 'PLFj_EC8GWnpsxzUYjqzXltpL28_jVv3Zv'),
  lib('rock-1', 'Metal & Hard Rock Workout', 'rock', 'PLChOO_ZAB22XrMCOigeFfSgYpZY9HFo3h'),
  lib('rock-2', 'Rock Gym Songs', 'rock', 'PLjwbNj9NASKPEh2jXIJdVSzWcOy_FRjbC'),
  lib('pop-1', 'Pop Workout Music', 'pop', 'PLChOO_ZAB22UB3y-qFBmFi_dk0tQhbn5C'),
  lib('pop-2', 'EDM & Pop Workout', 'pop', 'PLChOO_ZAB22WuyDODJ3kjJiU0oQzWOTyb'),
  lib('gen-1', 'Workout Beats Gym Hits', 'general', 'PLwHPDVxB8ZaJZg-dUrRLOfnCgsp2AhU3s'),
  lib('gen-2', 'LoudKult Workout Music', 'general', 'PLwHPDVxB8ZaLIgkEpy2tmNC3HMjDUQfDU'),
  lib('gen-3', 'Pump Up Music & Songs', 'general', 'PLFqEc99ShGt0oLHeANyCbVnZ74VyspdrY'),
];

// Which genres fit each workout category (priority order). Used to auto-pick +
// rotate music when the user hasn't pinned a specific playlist.
const CATEGORY_GENRES: Record<string, Genre[]> = {
  Chest: ['hype', 'rock', 'phonk'],
  Back: ['rock', 'hype', 'phonk'],
  Shoulders: ['phonk', 'hype', 'rock'],
  Legs: ['phonk', 'edm', 'hype'],
  GAME: ['hype', 'phonk', 'general'],
  UPH: ['edm', 'phonk', 'general'],
  LBH: ['edm', 'phonk', 'general'],
  CH: ['edm', 'general', 'pop'],
  Royce: ['pop', 'hype', 'general'],
  'J-Lo': ['pop', 'edm', 'general'],
};

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
    if (saved) {
      const cfg = JSON.parse(saved) as MusicConfig;
      if (cfg.playlists?.length) return cfg;
    }
  } catch {
    /* fall through */
  }
  return { playlists: LIBRARY, activeId: 'gen-1', categoryMap: {} };
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
  const id = `pl-${cfg.playlists.length}-${raw.slice(-6)}`;
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
    activeId: cfg.activeId === id ? playlists[0]?.id ?? null : cfg.activeId,
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

/**
 * Resolve which playlist should play for a workout circuit:
 *  1. a playlist the user pinned to this category, else
 *  2. an auto pick from the category's genres, rotated by day so it varies, else
 *  3. the active/default playlist.
 */
export const playlistForCategory = (
  cfg: MusicConfig,
  groupKey?: string,
  day?: number
): Playlist | null => {
  if (groupKey && cfg.categoryMap[groupKey]) {
    const pinned = cfg.playlists.find((p) => p.id === cfg.categoryMap[groupKey]);
    if (pinned) return pinned;
  }
  if (groupKey && CATEGORY_GENRES[groupKey]) {
    const genres = CATEGORY_GENRES[groupKey];
    const pool = cfg.playlists.filter((p) => p.genre && genres.includes(p.genre));
    if (pool.length) {
      const idx = ((day ?? 1) - 1 + genres.length) % pool.length;
      return pool[Math.abs(idx) % pool.length];
    }
  }
  return cfg.playlists.find((p) => p.id === cfg.activeId) ?? cfg.playlists[0] ?? null;
};

export const embedSrc = (pl: Playlist): string => {
  const base = 'https://www.youtube-nocookie.com/embed';
  return pl.kind === 'playlist'
    ? `${base}/videoseries?list=${pl.ytId}&autoplay=1&loop=1`
    : `${base}/${pl.ytId}?autoplay=1&loop=1&playlist=${pl.ytId}`;
};

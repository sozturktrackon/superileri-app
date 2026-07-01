import { client } from './amplify';
import type { Schema } from './amplify';

export type LiveSession = Schema['LiveSession']['type'];

const CODE_KEY = 'superileri.tvCode';

/** A stable per-device code, reused across workouts so you only pair once. */
export const getOrCreateCode = (): string => {
  let code = localStorage.getItem(CODE_KEY);
  if (!code) {
    code = Array.from({ length: 6 }, () =>
      '23456789ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 32)]
    ).join('');
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
};

export type LiveSessionUpdate = Partial<
  Omit<LiveSession, 'code' | 'id' | 'owner' | 'createdAt' | 'updatedAt'>
>;

/** Create or update this device's broadcast record (upsert by code). */
export const publishLiveSession = async (
  code: string,
  patch: LiveSessionUpdate
): Promise<void> => {
  const { data: existing } = await client.models.LiveSession.get({ code });
  if (existing) {
    await client.models.LiveSession.update({ code, ...patch });
  } else {
    await client.models.LiveSession.create({ code, ...patch });
  }
};

/** Guest-readable fetch by code — used by the TV page (no login needed). */
export const fetchLiveSession = async (
  code: string
): Promise<LiveSession | null> => {
  try {
    const { data } = await client.models.LiveSession.get({ code });
    return data ?? null;
  } catch {
    return null;
  }
};

export const endLiveSession = async (code: string): Promise<void> => {
  try {
    await client.models.LiveSession.update({ code, status: 'finished' });
  } catch {
    /* best effort */
  }
};

export const tvUrl = (code: string): string =>
  `${window.location.origin}${window.location.pathname}#/tv/${code}`;

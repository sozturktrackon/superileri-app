import { client } from './amplify';
import type { Schema } from './amplify';

export type LiveSession = Schema['LiveSession']['type'];

const CODE_KEY = 'superileri.tvCode.v2'; // the TV's own generated code
const PAIR_KEY = 'superileri.pairedTv'; // the code the phone last connected to

/** The short, fixed address to type on the TV (custom domain). */
export const TV_HOST = 'app.superileri.com';
export const TV_ENTRY_URL = `${TV_HOST}/tv`;

/** TV side: a stable NUMERIC code for THIS display, generated once and reused
 *  so it shows the same QR / code every time. 6 digits. */
export const getOrCreateCode = (): string => {
  let code = localStorage.getItem(CODE_KEY);
  if (!code || !/^\d{6}$/.test(code)) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
};

/** Phone side: remember the TV we last paired with, so casting is one tap on
 *  future workouts (no re-scan needed). */
export const getSavedTvCode = (): string | null => {
  const c = localStorage.getItem(PAIR_KEY);
  return c && /^\d{6}$/.test(c) ? c : null;
};
export const saveTvCode = (code: string) => localStorage.setItem(PAIR_KEY, code);
export const clearTvCode = () => localStorage.removeItem(PAIR_KEY);

export type LiveSessionUpdate = Partial<
  Omit<LiveSession, 'code' | 'id' | 'owner' | 'createdAt' | 'updatedAt'>
>;

/** Create or update this device's broadcast record (upsert by code). Runs as
 *  the signed-in owner (default userPool auth). */
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

/** Guest-readable fetch by code - used by the TV page (no login). Uses the
 *  identity-pool (guest) auth mode, since the TV has no user-pool session. */
export const fetchLiveSession = async (
  code: string
): Promise<LiveSession | null> => {
  const { data } = await client.models.LiveSession.get(
    { code },
    { authMode: 'identityPool' }
  );
  return data ?? null;
};

/**
 * Real-time updates for the TV: AppSync subscriptions (guest auth) push every
 * change the phone publishes, no polling. `onError` fires if the socket can't
 * be established - the caller should fall back to polling then. Returns an
 * unsubscribe function.
 */
export const subscribeLiveSession = (
  code: string,
  onData: (s: LiveSession) => void,
  onError: (e: unknown) => void
): (() => void) => {
  const opts = {
    filter: { code: { eq: code } },
    authMode: 'identityPool' as const,
  };
  const subs = [
    client.models.LiveSession.onCreate(opts).subscribe({ next: onData, error: onError }),
    client.models.LiveSession.onUpdate(opts).subscribe({ next: onData, error: onError }),
  ];
  return () => subs.forEach((s) => s.unsubscribe());
};

export const endLiveSession = async (code: string): Promise<void> => {
  try {
    await client.models.LiveSession.update({ code, status: 'finished' });
  } catch {
    /* best effort */
  }
};

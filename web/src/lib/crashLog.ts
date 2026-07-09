/**
 * On-device crash recorder. There's no backend telemetry in this app, so when
 * something breaks mid-workout the only evidence lives on the phone — capture
 * it. Stores the last few errors in localStorage; surfaced in Progress →
 * Crash reports with a copy button.
 *
 * Note: an OS-level tab kill (out of memory) fires no events — if the app
 * "crashed" but nothing is recorded here, memory pressure is the likely cause.
 */
const KEY = 'superileri.crashLog';
const MAX = 5;

export type CrashEntry = {
  at: string; // ISO timestamp
  type: 'error' | 'unhandledrejection' | 'react';
  message: string;
  stack?: string;
  ua: string;
};

export const logCrash = (
  type: CrashEntry['type'],
  message: unknown,
  stack?: string
): void => {
  try {
    const list = getCrashLog();
    list.unshift({
      at: new Date().toISOString(),
      type,
      message: String(message).slice(0, 500),
      stack: stack?.slice(0, 2000),
      ua: navigator.userAgent,
    });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* storage unavailable */
  }
};

export const getCrashLog = (): CrashEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as CrashEntry[];
  } catch {
    return [];
  }
};

export const clearCrashLog = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

/** Install global hooks. Call once at startup, before anything else runs. */
export const installCrashCapture = (): void => {
  window.addEventListener('error', (e) => {
    logCrash('error', e.message, (e.error as Error | undefined)?.stack);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { message?: string; stack?: string } | undefined;
    logCrash('unhandledrejection', r?.message ?? String(e.reason), r?.stack);
  });
};

/**
 * First-run guided tips ("help mode"). On by default; each screen's tips show
 * once, and the user can kill the whole thing with one tap. Device-local by
 * design: a returning user on a new phone gets a quick refresher, which is
 * a feature, not a bug.
 */
const OFF_KEY = 'hop30.tourOff';
const SEEN_KEY = 'hop30.tourSeen';

export const tourEnabled = (): boolean => {
  try {
    return localStorage.getItem(OFF_KEY) !== '1';
  } catch {
    return false;
  }
};

export const disableTour = (): void => {
  try {
    localStorage.setItem(OFF_KEY, '1');
  } catch {
    /* ignore */
  }
};

export const resetTour = (): void => {
  try {
    localStorage.removeItem(OFF_KEY);
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* ignore */
  }
};

export const isTourSeen = (screen: string): boolean => {
  try {
    return !!JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')[screen];
  } catch {
    return false;
  }
};

export const markTourSeen = (screen: string): void => {
  try {
    const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    seen[screen] = true;
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    /* ignore */
  }
};

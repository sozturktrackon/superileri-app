import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { tr } from '../i18n/tr';
import { hi } from '../i18n/hi';
import { fr } from '../i18n/fr';
import { de } from '../i18n/de';
import { es } from '../i18n/es';
import { pt } from '../i18n/pt';
import { tl } from '../i18n/tl';
import { id } from '../i18n/id';
import { it } from '../i18n/it';
import { ja } from '../i18n/ja';
import { vi } from '../i18n/vi';
import { th } from '../i18n/th';
import { ru } from '../i18n/ru';
import { uk } from '../i18n/uk';
import { ar } from '../i18n/ar';
import { he } from '../i18n/he';

/**
 * Tiny English-keyed i18n: t('English text') looks the string up in the
 * active language's dictionary and falls back to the English key itself, so
 * missing translations degrade gracefully instead of breaking. {var}
 * placeholders are interpolated. No external deps.
 *
 * Language resolution: explicit choice (localStorage, synced to the user's
 * profile) -> browser language -> English.
 */
export type Lang =
  | 'en' | 'tr' | 'hi' | 'fr' | 'de' | 'es' | 'pt' | 'tl'
  | 'id' | 'it' | 'ja' | 'vi' | 'th' | 'ru' | 'uk' | 'ar' | 'he';

// Picker order: English pinned first (the default), then native names
// (endonyms) alphabetically - Latin script A-Z, then other scripts grouped
// (Cyrillic, Devanagari, Thai, CJK). Users scan for their own language in
// their own script, so endonyms + stable script blocks beat any single
// "alphabetical" rule across writing systems.
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'th', label: 'ไทย' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
  { code: 'he', label: 'עברית' },
];

/** Human-readable language name, for the AI "respond in X" instruction. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English', tr: 'Turkish', hi: 'Hindi', fr: 'French',
  de: 'German', es: 'Spanish', pt: 'Portuguese', tl: 'Filipino (Tagalog)',
  id: 'Indonesian', it: 'Italian', ja: 'Japanese', vi: 'Vietnamese', th: 'Thai',
  ru: 'Russian', uk: 'Ukrainian', ar: 'Arabic', he: 'Hebrew',
};

/** Right-to-left languages: flips the whole document's direction. */
export const isRTL = (l: Lang): boolean => l === 'ar' || l === 'he';

const applyDir = (l: Lang): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isRTL(l) ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  }
};

/** Amplify's Authenticator translations use 'ua' for Ukrainian. */
export const amplifyLangCode = (l: Lang): string => (l === 'uk' ? 'ua' : l);

const LS_KEY = 'superileri.lang';
const DICTS: Partial<Record<Lang, Record<string, string>>> = {
  tr, hi, fr, de, es, pt, tl, id, it, ja, vi, th, ru, uk, ar, he,
};

export const detectLang = (): Lang => {
  try {
    const saved = localStorage.getItem(LS_KEY) as Lang | null;
    if (saved && LANGS.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore */
  }
  // First visit with no saved choice: honor the browser language if we
  // support it (the landing page should greet article visitors in their own
  // language). Any explicit pick, or the profile language, wins from then on.
  try {
    const nav = (navigator.languages?.[0] ?? navigator.language ?? '')
      .toLowerCase()
      .split('-')[0] as Lang;
    if (LANGS.some((l) => l.code === nav)) return nav;
  } catch {
    /* ignore */
  }
  return 'en';
};

export const persistLang = (l: Lang): void => {
  try {
    localStorage.setItem(LS_KEY, l);
  } catch {
    /* ignore */
  }
};

const interpolate = (s: string, vars?: Record<string, string | number>): string =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;

/** Non-hook translate for code outside React (sound cues, etc.). */
let currentLang: Lang = detectLang();
applyDir(currentLang);
export const getLang = (): Lang => currentLang;
export const tGlobal = (
  key: string,
  vars?: Record<string, string | number>
): string => interpolate(DICTS[currentLang]?.[key] ?? key, vars);

type I18nCtx = {
  lang: Lang;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLang: (l: Lang) => void;
};

const Ctx = createContext<I18nCtx | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(detectLang);
  currentLang = lang;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      interpolate(DICTS[lang]?.[key] ?? key, vars),
    [lang]
  );

  const setLang = useCallback((l: Lang) => {
    currentLang = l;
    persistLang(l);
    applyDir(l);
    setLangState(l);
  }, []);

  return <Ctx.Provider value={{ lang, t, setLang }}>{children}</Ctx.Provider>;
};

export const useT = (): I18nCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  return ctx;
};

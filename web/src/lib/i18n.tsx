import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { tr } from '../i18n/tr';

/**
 * Tiny English-keyed i18n: t('English text') looks the string up in the
 * active language's dictionary and falls back to the English key itself, so
 * missing translations degrade gracefully instead of breaking. {var}
 * placeholders are interpolated. No external deps.
 *
 * Language resolution: explicit choice (localStorage, synced to the user's
 * profile) -> browser language -> English.
 */
export type Lang = 'en' | 'tr' | 'hi' | 'ru' | 'fr' | 'de' | 'es' | 'pt';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ru', label: 'Русский' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];

/** Human-readable language name, for the AI "respond in X" instruction. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English', tr: 'Turkish', hi: 'Hindi', ru: 'Russian',
  fr: 'French', de: 'German', es: 'Spanish', pt: 'Portuguese',
};

const LS_KEY = 'superileri.lang';
const DICTS: Partial<Record<Lang, Record<string, string>>> = { tr };

export const detectLang = (): Lang => {
  try {
    const saved = localStorage.getItem(LS_KEY) as Lang | null;
    if (saved && LANGS.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return (LANGS.some((l) => l.code === nav) ? nav : 'en') as Lang;
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
    setLangState(l);
  }, []);

  return <Ctx.Provider value={{ lang, t, setLang }}>{children}</Ctx.Provider>;
};

export const useT = (): I18nCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  return ctx;
};

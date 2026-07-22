import { useEffect, useState } from 'react';
import { useT } from '../lib/i18n';
import {
  disableTour,
  isTourSeen,
  markTourSeen,
  tourEnabled,
} from '../lib/tourState';

export type TourStep = { target: string; text: string };

/**
 * Minimal coach-marks (driver.js style, zero dependencies). Mount one per
 * screen with that screen's steps; it spotlights each target element in turn
 * with a short explanation. Shows once per screen per device.
 */
const Tour = ({ screen, steps }: { screen: string; steps: TourStep[] }) => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Delay a tick so the screen's real content (cards, buttons) is in the DOM.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (tourEnabled() && !isTourSeen(screen)) setOpen(true);
    }, 400);
    return () => window.clearTimeout(id);
  }, [screen]);

  useEffect(() => {
    if (!open) return;
    const el = document.querySelector(steps[idx]?.target ?? '');
    if (!el) {
      // Target not on screen (e.g. rest day has no Start button): skip ahead.
      if (idx < steps.length - 1) setIdx((i) => i + 1);
      else {
        markTourSeen(screen);
        setOpen(false);
      }
      return;
    }
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
  }, [open, idx, steps, screen]);

  if (!open || !rect) return null;

  const done = () => {
    markTourSeen(screen);
    setOpen(false);
  };
  const last = idx >= steps.length - 1;
  const below = rect.top + rect.height < window.innerHeight * 0.55;

  return (
    <div className="tour" role="dialog" aria-modal="true">
      <div
        className="tour-spot"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
      />
      <div
        className="tour-tip"
        style={
          below
            ? { top: rect.top + rect.height + 14 }
            : { bottom: window.innerHeight - rect.top + 14 }
        }
      >
        <p style={{ margin: 0, lineHeight: 1.5, fontSize: 14 }}>{t(steps[idx].text)}</p>
        <div className="tour-actions">
          <button
            className="tour-off"
            onClick={() => {
              disableTour();
              setOpen(false);
            }}
          >
            {t('Turn off tips')}
          </button>
          <span className="muted" style={{ fontSize: 12 }}>
            {idx + 1}/{steps.length}
          </span>
          <button
            className="btn primary"
            style={{ padding: '8px 16px', fontSize: 14 }}
            onClick={() => (last ? done() : setIdx((i) => i + 1))}
          >
            {last ? t('Done') : t('Next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tour;

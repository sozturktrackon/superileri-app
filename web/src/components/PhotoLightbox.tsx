import { useEffect, useMemo, useState } from 'react';
import {
  ANGLES,
  checkInPhotos,
  photoUrl,
  type Angle,
  type CheckIn,
} from '../lib/api';
import { useT } from '../lib/i18n';

/**
 * Fullscreen photo viewer for check-ins. One shot = browse its angles;
 * two shots = side-by-side comparison of the same angle (oldest left).
 * Tap an image to zoom (2.5x, scroll to pan), tap again to fit.
 */
const PhotoLightbox = ({
  shots,
  onClose,
}: {
  shots: CheckIn[];
  onClose: () => void;
}) => {
  const { t } = useT();
  const ordered = useMemo(
    () => [...shots].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [shots]
  );
  const [angle, setAngle] = useState<Angle>('front');
  const [urls, setUrls] = useState<Record<string, string>>({}); // `${id}:${angle}` -> url
  const [zoomed, setZoomed] = useState(false);

  // Angles that exist in at least one of the shots being shown.
  const availableAngles = useMemo(() => {
    const present = new Set(
      ordered.flatMap((s) => checkInPhotos(s).map((p) => p.angle))
    );
    return ANGLES.filter((a) => present.has(a.id));
  }, [ordered]);

  useEffect(() => {
    if (!availableAngles.some((a) => a.id === angle) && availableAngles[0]) {
      setAngle(availableAngles[0].id);
    }
  }, [availableAngles, angle]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        ordered.flatMap((s) =>
          checkInPhotos(s).map(async (p) => {
            try {
              next[`${s.id}:${p.angle}`] = await photoUrl(p.path);
            } catch {
              /* leave missing; a placeholder renders instead */
            }
          })
        )
      );
      if (alive) setUrls(next);
    })();
    return () => {
      alive = false;
    };
  }, [ordered]);

  // Lock body scroll while open; Escape closes.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const pane = (shot: CheckIn) => {
    const url = urls[`${shot.id}:${angle}`];
    return (
      <div className="lightbox-pane" key={shot.id}>
        <span className="pill" style={{ alignSelf: 'center', marginBottom: 6 }}>
          {shot.date}
        </span>
        {url ? (
          <div
            className={`lightbox-imgwrap ${zoomed ? 'zoomed' : ''}`}
            onClick={() => setZoomed((z) => !z)}
          >
            <img src={url} alt={`${shot.date} ${angle}`} />
          </div>
        ) : (
          <div className="lightbox-missing muted">
            {t('No {angle} photo in this check-in.', {
              angle: t(ANGLES.find((a) => a.id === angle)?.label ?? angle),
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lightbox" role="dialog" aria-modal="true">
      <div className="lightbox-top">
        <span className="muted" style={{ fontSize: 12 }}>
          {t('Tap the photo to zoom.')}
        </span>
        <button className="lightbox-close" onClick={onClose} aria-label={t('Close')}>
          ✕
        </button>
      </div>

      <div className={`lightbox-body ${ordered.length > 1 ? 'compare' : ''}`}>
        {ordered.map(pane)}
      </div>

      <div className="lightbox-angles">
        {availableAngles.map((a) => (
          <button
            key={a.id}
            className={`pill ${angle === a.id ? 'accent' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setAngle(a.id);
              setZoomed(false);
            }}
          >
            {t(a.label)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PhotoLightbox;

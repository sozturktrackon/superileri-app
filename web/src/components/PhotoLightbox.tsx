import { useEffect, useMemo, useRef, useState } from 'react';
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
 *
 * Each pane supports free-form pinch-zoom and drag (mouse: wheel + drag,
 * double-tap resets), so torsos can be lined up at the same size with legs
 * cropped out of frame. "Share" renders the arrangement (dates on top,
 * small hop30 mark below) to an image and opens the native share sheet.
 */

type Transform = { s: number; tx: number; ty: number };
const IDENTITY: Transform = { s: 1, tx: 0, ty: 0 };

const clampScale = (s: number) => Math.min(6, Math.max(1, s));

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
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [tf, setTf] = useState<Record<string, Transform>>({});
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const paneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const imgRefs = useRef<Record<string, HTMLImageElement | null>>({});
  // Live pointer state per pane (pinch needs both pointers of that pane).
  const pointers = useRef<Record<string, Map<number, { x: number; y: number }>>>({});
  const lastTap = useRef<Record<string, number>>({});

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
              /* placeholder renders instead */
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

  // Transforms reset when switching angles: alignment is per-angle work.
  useEffect(() => {
    setTf({});
  }, [angle]);

  const getTf = (id: string): Transform => tf[id] ?? IDENTITY;
  const putTf = (id: string, next: Transform) =>
    setTf((prev) => ({ ...prev, [id]: next }));

  /** Zoom pane `id` by factor k around the pane-local point (cx, cy). */
  const zoomAt = (id: string, k: number, cx: number, cy: number) => {
    const cur = getTf(id);
    const s = clampScale(cur.s * k);
    const real = s / cur.s; // after clamping
    putTf(id, {
      s,
      tx: cx - real * (cx - cur.tx),
      ty: cy - real * (cy - cur.ty),
    });
  };

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const m = (pointers.current[id] ??= new Map());
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (m.size === 1) {
      const now = Date.now();
      if (now - (lastTap.current[id] ?? 0) < 300) putTf(id, IDENTITY); // double-tap reset
      lastTap.current[id] = now;
    }
  };

  const onPointerMove = (id: string) => (e: React.PointerEvent) => {
    const m = pointers.current[id];
    if (!m?.has(e.pointerId)) return;
    const prev = m.get(e.pointerId)!;
    const rect = paneRefs.current[id]?.getBoundingClientRect();
    if (!rect) return;

    if (m.size === 2) {
      const [p1, p2] = [...m.values()];
      const other = p1.x === prev.x && p1.y === prev.y ? p2 : p1;
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
      const d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if (d0 > 0) {
        const mid = {
          x: (e.clientX + other.x) / 2 - rect.left,
          y: (e.clientY + other.y) / 2 - rect.top,
        };
        zoomAt(id, d1 / d0, mid.x, mid.y);
      }
    } else if (m.size === 1) {
      const cur = getTf(id);
      putTf(id, { ...cur, tx: cur.tx + e.clientX - prev.x, ty: cur.ty + e.clientY - prev.y });
    }
    m.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const onPointerEnd = (id: string) => (e: React.PointerEvent) => {
    pointers.current[id]?.delete(e.pointerId);
  };

  const onWheel = (id: string) => (e: React.WheelEvent) => {
    const rect = paneRefs.current[id]?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(id, e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
  };

  /** Render the current arrangement to a canvas and share/download it. */
  const share = async () => {
    setSharing(true);
    setShareError(false);
    try {
      const SCALE = 2;
      const headerH = 56;
      const footerH = 44;
      const panes = ordered.map((s) => ({
        shot: s,
        el: paneRefs.current[s.id],
        img: imgRefs.current[s.id],
      }));
      if (panes.some((p) => !p.el || !p.img)) throw new Error('not ready');
      const paneW = panes[0].el!.clientWidth;
      const paneH = panes[0].el!.clientHeight;
      const gap = 6;
      const W = (paneW * panes.length + gap * (panes.length - 1)) * SCALE;
      const H = (headerH + paneH + footerH) * SCALE;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < panes.length; i++) {
        const { shot, img } = panes[i];
        const ox = i * (paneW + gap) * SCALE;
        const oy = headerH * SCALE;
        const { s, tx, ty } = getTf(shot.id);

        // Reload with CORS so the canvas stays exportable.
        const clean = new Image();
        clean.crossOrigin = 'anonymous';
        clean.src = img!.src;
        await clean.decode();

        // The on-screen img is object-fit:contain inside the pane; replicate
        // that base box, then the user's transform on top of it.
        const fit = Math.min(paneW / clean.naturalWidth, paneH / clean.naturalHeight);
        const bw = clean.naturalWidth * fit;
        const bh = clean.naturalHeight * fit;
        const bx = (paneW - bw) / 2;
        const by = (paneH - bh) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(ox, oy, paneW * SCALE, paneH * SCALE);
        ctx.clip();
        ctx.translate(ox, oy);
        ctx.scale(SCALE, SCALE);
        ctx.translate(tx, ty);
        ctx.scale(s, s);
        ctx.drawImage(clean, bx, by, bw, bh);
        ctx.restore();

        // Date centered above each pane.
        ctx.fillStyle = '#eef2f8';
        ctx.font = `600 ${15 * SCALE}px -apple-system, Helvetica, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(shot.date, ox + (paneW * SCALE) / 2, (headerH * SCALE) / 2 + 6 * SCALE);
      }

      // Small brand mark under the photos.
      ctx.fillStyle = '#9aa7bd';
      ctx.font = `700 ${13 * SCALE}px -apple-system, Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('hop30.com', W / 2, H - (footerH * SCALE) / 2 + 5 * SCALE);

      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', 0.92)
      );
      const file = new File([blob], `hop30-progress-${ordered[ordered.length - 1].date}.jpg`, {
        type: 'image/jpeg',
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] }).catch((e) => {
          if ((e as Error).name !== 'AbortError') throw e;
        });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      }
    } catch (e) {
      console.error('share failed', e);
      setShareError(true);
    } finally {
      setSharing(false);
    }
  };

  const pane = (shot: CheckIn) => {
    const url = urls[`${shot.id}:${angle}`];
    const { s, tx, ty } = getTf(shot.id);
    return (
      <div className="lightbox-pane" key={shot.id}>
        <span className="pill" style={{ alignSelf: 'center', marginBottom: 6 }}>
          {shot.date}
        </span>
        {url ? (
          <div
            className="lightbox-imgwrap free"
            ref={(el) => {
              paneRefs.current[shot.id] = el;
            }}
            onPointerDown={onPointerDown(shot.id)}
            onPointerMove={onPointerMove(shot.id)}
            onPointerUp={onPointerEnd(shot.id)}
            onPointerCancel={onPointerEnd(shot.id)}
            onWheel={onWheel(shot.id)}
          >
            <img
              src={url}
              alt={`${shot.date} ${angle}`}
              crossOrigin="anonymous"
              draggable={false}
              ref={(el) => {
                imgRefs.current[shot.id] = el;
              }}
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${s})`,
                transformOrigin: '0 0',
              }}
            />
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
          {t('Pinch to zoom, drag to position each photo.')}
        </span>
        <button className="lightbox-close" onClick={onClose} aria-label={t('Close')}>
          ✕
        </button>
      </div>

      <div className={`lightbox-body ${ordered.length > 1 ? 'compare' : ''}`}>
        {ordered.map(pane)}
      </div>

      {shareError && (
        <p className="error-text" style={{ textAlign: 'center', margin: '8px 0 0' }}>
          {t('Could not prepare the image. Take a screenshot instead.')}
        </p>
      )}

      <div className="lightbox-angles">
        {availableAngles.map((a) => (
          <button
            key={a.id}
            className={`pill ${angle === a.id ? 'accent' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setAngle(a.id)}
          >
            {t(a.label)}
          </button>
        ))}
        <button
          className="btn primary"
          style={{ padding: '8px 18px', fontSize: 14 }}
          onClick={share}
          disabled={sharing}
        >
          {sharing ? '…' : `📤 ${t('Share')}`}
        </button>
      </div>
    </div>
  );
};

export default PhotoLightbox;

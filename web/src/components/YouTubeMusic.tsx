import { useEffect, useMemo, useState } from 'react';
import {
  addPlaylist,
  embedSrc,
  loadMusic,
  playlistForCategory,
  setActive,
  type MusicConfig,
} from '../lib/music';

/**
 * In-workout music controller. Audio plays on the phone. Auto-selects the
 * playlist mapped to this workout's category (if any), else the active one.
 * Manage the full library in the Music settings screen.
 */
const YouTubeMusic = ({
  active,
  groupKey,
  day,
}: {
  active: boolean;
  groupKey?: string;
  day?: number;
}) => {
  const [cfg, setCfg] = useState<MusicConfig>(loadMusic);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  const current = useMemo(
    () => playlistForCategory(cfg, groupKey, day),
    [cfg, groupKey, day]
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(var(--safe-t) + 60px)',
        left: 12,
        right: 12,
        zIndex: 60,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          className="tctrl"
          onClick={() => setPlaying((p) => !p)}
          aria-label="Toggle music"
        >
          {playing ? '🔊' : '🎵'}
        </button>
        <button
          className="tctrl"
          onClick={() => setOpen((o) => !o)}
          aria-label="Music settings"
        >
          ⚙️
        </button>
        {playing && current && (
          <span
            className="pill"
            style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}
          >
            ♪ {current.label}
          </span>
        )}
      </div>

      {open && (
        <div
          className="card"
          style={{ marginTop: 8, color: 'var(--text)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Pick a playlist</h3>
          <div className="stack">
            {cfg.playlists.map((p) => (
              <label key={p.id} className="card-row" style={{ margin: 0 }}>
                <span>{p.label}</span>
                <input
                  type="radio"
                  name="active-pl"
                  checked={cfg.activeId === p.id}
                  onChange={() => setCfg(setActive(cfg, p.id))}
                />
              </label>
            ))}
          </div>
          <div className="field" style={{ marginTop: 12, marginBottom: 6 }}>
            <label>Add a playlist</label>
            <input
              placeholder="Name (e.g. Beast Mode)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <input
              placeholder="Paste YouTube link"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
            />
          </div>
          <button
            className="btn primary block"
            onClick={() => {
              if (!newLink.trim()) return;
              setCfg(addPlaylist(cfg, newLabel, newLink));
              setNewLabel('');
              setNewLink('');
            }}
          >
            Add
          </button>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Tip: assign playlists to specific workout types in Progress → Music.
          </p>
        </div>
      )}

      {playing && current && (
        <iframe
          title="workout-music"
          src={embedSrc(current)}
          allow="autoplay; encrypted-media"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0.01,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default YouTubeMusic;

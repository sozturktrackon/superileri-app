import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addPlaylist,
  loadMusic,
  playlistForCategory,
  playlistWatchUrl,
  setActive,
  type MusicConfig,
  type Playlist,
} from '../lib/music';
import { loadYouTubeApi, type YTPlayer } from '../lib/ytPlayer';

/**
 * In-workout music controller. Uses the real YouTube IFrame Player API (not a
 * bare iframe) so we can: control volume (duck it under voice cues, see
 * sound.ts), and detect a blocked/sign-in-walled embed and fall back to
 * "Open in YouTube" automatically — which opens the REAL youtube.com in the
 * user's own logged-in tab/app (that's the only way to use their own YouTube
 * session; a cross-site embed can't borrow it due to browser privacy rules).
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
  const [failed, setFailed] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLink, setNewLink] = useState('');

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  const current = useMemo(
    () => playlistForCategory(cfg, groupKey, day),
    [cfg, groupKey, day]
  );

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // Mount / swap the player whenever we should be playing a (new) playlist.
  useEffect(() => {
    clearTimers();
    if (!playing || !current || !hostRef.current) {
      playerRef.current?.destroy();
      playerRef.current = null;
      return;
    }
    setFailed(false);
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      playerRef.current?.destroy();

      const opts =
        current.kind === 'playlist'
          ? { listType: 'playlist', list: current.ytId }
          : { videoId: current.ytId };

      playerRef.current = new YT.Player(hostRef.current, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
          ...opts,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.setVolume(100);
            e.target.playVideo();
            // Some blocked/sign-in-walled embeds never error, they just never
            // reach "playing". If that happens, retry muted (autoplay is
            // always allowed muted), then unmute; if it STILL never plays,
            // surface the "Open in YouTube" fallback instead of staying silent.
            timers.current.push(
              window.setTimeout(() => {
                if (playerRef.current?.getPlayerState() !== 1) {
                  playerRef.current?.mute();
                  playerRef.current?.playVideo();
                  timers.current.push(
                    window.setTimeout(() => playerRef.current?.unMute(), 500)
                  );
                }
              }, 1800)
            );
            timers.current.push(
              window.setTimeout(() => {
                if (playerRef.current?.getPlayerState() !== 1) setFailed(true);
              }, 4200)
            );
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) setFailed(false); // 1 = PLAYING
          },
          onError: () => setFailed(true),
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, current?.ytId]);

  // Duck under voice cues (dispatched from sound.ts).
  useEffect(() => {
    const onDuck = (e: Event) => {
      const ms = (e as CustomEvent<{ ms: number }>).detail?.ms ?? 900;
      const p = playerRef.current;
      if (!p) return;
      p.setVolume(8);
      window.setTimeout(() => playerRef.current?.setVolume(100), ms);
    };
    window.addEventListener('superileri:duck', onDuck);
    return () => window.removeEventListener('superileri:duck', onDuck);
  }, []);

  useEffect(() => () => playerRef.current?.destroy(), []);

  const openInYouTube = (pl: Playlist) =>
    window.open(playlistWatchUrl(pl), '_blank', 'noopener');

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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
        {playing && current && !failed && (
          <span
            className="pill"
            style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}
          >
            ♪ {current.label}
          </span>
        )}
        {playing && current && failed && (
          <button
            className="pill accent"
            style={{ border: 'none' }}
            onClick={() => openInYouTube(current)}
          >
            ▶ Can't embed — open in YouTube
          </button>
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
            If a playlist won't embed, tap "open in YouTube" to play it in your
            own YouTube app/tab instead.
          </p>
        </div>
      )}

      {/* Real IFrame Player API target — tiny and invisible but must stay
          mounted (not display:none) for playback to work reliably. */}
      {playing && current && (
        <div
          ref={hostRef}
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

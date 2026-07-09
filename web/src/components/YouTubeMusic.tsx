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
import { loadYouTubeApi, ytCall, type YTPlayer } from '../lib/ytPlayer';

export type MusicState = {
  playing: boolean;
  ytId: string | null;
  kind: 'playlist' | 'video' | null;
  label: string | null;
};

/**
 * In-workout music controller. Uses the real YouTube IFrame Player API (not a
 * bare iframe) so we can: control volume (duck it under voice cues, see
 * sound.ts), and detect a blocked/sign-in-walled embed and fall back to
 * "Open in YouTube" automatically - which opens the REAL youtube.com in the
 * user's own logged-in tab/app (that's the only way to use their own YouTube
 * session; a cross-site embed can't borrow it due to browser privacy rules).
 *
 * When `broadcast` is true (casting to a TV), this player is paused so audio
 * doesn't double up - the TV mounts its own player and plays the sound.
 */
const YouTubeMusic = ({
  active,
  groupKey,
  day,
  broadcast = false,
  onStateChange,
}: {
  active: boolean;
  groupKey?: string;
  day?: number;
  broadcast?: boolean;
  onStateChange?: (s: MusicState) => void;
}) => {
  const [cfg, setCfg] = useState<MusicConfig>(loadMusic);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLink, setNewLink] = useState('');

  // The YT IFrame API REPLACES the element we hand it with its own <iframe>.
  // If that element is React-rendered, React later tries to remove a node
  // that no longer exists ("removeChild ... not a child") and the whole app
  // crashes. So the host lives on document.body, fully outside React's tree,
  // and each player gets a fresh non-React child element.
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;overflow:hidden;';
    document.body.appendChild(host);
    hostRef.current = host;
    return () => {
      ytCall(playerRef.current, 'destroy');
      playerRef.current = null;
      hostRef.current = null;
      host.remove();
    };
  }, []);

  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);

  const current = useMemo(
    () => playlistForCategory(cfg, groupKey, day),
    [cfg, groupKey, day]
  );

  // Report state upward (so it can be broadcast to a paired TV).
  useEffect(() => {
    onStateChange?.({
      playing,
      ytId: current?.ytId ?? null,
      kind: current?.kind ?? null,
      label: current?.label ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, current?.ytId, current?.kind, current?.label]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // Mount / swap the player whenever we should be playing a (new) playlist.
  // While casting, NO local player exists at all - the TV owns the audio.
  // (Creating one and pausing it was racy: pause is a no-op on a player that
  // hasn't finished booting, so phone + TV would both play, out of sync.)
  useEffect(() => {
    clearTimers();
    if (!playing || !current || broadcast) {
      ytCall(playerRef.current, 'destroy');
      playerRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = '';
      return;
    }
    setFailed(false);
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      const host = hostRef.current;
      if (cancelled || !host) return;
      ytCall(playerRef.current, 'destroy');
      host.innerHTML = ''; // clear leftovers even if destroy failed
      const el = document.createElement('div');
      host.appendChild(el);

      const opts =
        current.kind === 'playlist'
          ? { listType: 'playlist', list: current.ytId }
          : { videoId: current.ytId };

      playerRef.current = new YT.Player(el, {
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
            ytCall(e.target, 'setVolume', 100);
            ytCall(e.target, 'playVideo');
            // Some blocked/sign-in-walled embeds never error, they just never
            // reach "playing". If that happens, retry muted (autoplay is
            // always allowed muted), then unmute; if it STILL never plays,
            // surface the "Open in YouTube" fallback instead of staying silent.
            timers.current.push(
              window.setTimeout(() => {
                if (ytCall(playerRef.current, 'getPlayerState') !== 1) {
                  ytCall(playerRef.current, 'mute');
                  ytCall(playerRef.current, 'playVideo');
                  timers.current.push(
                    window.setTimeout(() => ytCall(playerRef.current, 'unMute'), 500)
                  );
                }
              }, 1800)
            );
            timers.current.push(
              window.setTimeout(() => {
                if (ytCall(playerRef.current, 'getPlayerState') !== 1) setFailed(true);
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
  }, [playing, current?.ytId, broadcast]);

  // Duck under voice cues (dispatched from sound.ts). Overlapping ducks
  // extend each other: the volume only restores once the LATEST duck window
  // has passed - otherwise an earlier cue's restore timer would pop the music
  // back to full volume mid-countdown, swallowing "two" and "one".
  const duckUntilRef = useRef(0);
  useEffect(() => {
    const onDuck = (e: Event) => {
      const ms = (e as CustomEvent<{ ms: number }>).detail?.ms ?? 900;
      const p = playerRef.current;
      if (!p || broadcast) return;
      duckUntilRef.current = Math.max(duckUntilRef.current, performance.now() + ms);
      ytCall(p, 'setVolume', 8);
      window.setTimeout(() => {
        if (performance.now() >= duckUntilRef.current - 25) {
          ytCall(playerRef.current, 'setVolume', 100);
        }
      }, ms + 30);
    };
    window.addEventListener('superileri:duck', onDuck);
    return () => window.removeEventListener('superileri:duck', onDuck);
  }, [broadcast]);

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
            {broadcast ? ' (on TV)' : ''}
          </span>
        )}
        {playing && current && failed && !broadcast && (
          <button
            className="pill accent"
            style={{ border: 'none' }}
            onClick={() => openInYouTube(current)}
          >
            ▶ Can't embed. Open in YouTube
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

    </div>
  );
};

export default YouTubeMusic;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  fetchLiveSession,
  getOrCreateCode,
  subscribeLiveSession,
  TV_ENTRY_URL,
  type LiveSession,
} from '../lib/liveSession';
import { exEmbedUrl, loadExVideos } from '../lib/exerciseVideos';
import { loadYouTubeApi, ytCall, type YTPlayer } from '../lib/ytPlayer';

const phaseTitle: Record<string, string> = {
  prep: 'Get Ready',
  on: 'Work',
  rest: 'Rest',
  done: 'Complete',
};

/**
 * Seconds left, preferring the phone's published wall-clock phase end (zero
 * latency skew; both devices are NTP-synced). If the TV's clock disagrees
 * with the phone's last reported secondsLeft by more than 3s, the TV clock is
 * off — fall back to ticking from the receipt time instead.
 */
const computeLeft = (
  endsAt: number | null,
  sync: { left: number; at: number } | null
): number | null => {
  const fromSync = sync
    ? Math.max(0, sync.left - Math.floor((performance.now() - sync.at) / 1000))
    : null;
  if (endsAt) {
    const fromClock = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (fromSync == null || Math.abs(fromClock - fromSync) <= 3) return fromClock;
  }
  return fromSync;
};

/**
 * Public, no-login "big screen" display. Receives the paired phone's live
 * workout state over an AppSync SUBSCRIPTION (real-time push; falls back to
 * polling only if the socket can't connect), renders a synced countdown + the
 * exercise demo video, and plays the music through the TV's own speakers.
 *
 * The bottom control bar (remote-focusable buttons) covers what a TV can
 * control locally: its own sound on/off and volume. The workout itself is
 * driven from the phone — the TV is read-only by design (guests can't write).
 */
const TvDisplay = () => {
  const params = useParams();
  // `/tv` self-generates a stable code for this display; `/tv/:code` honors a
  // code passed in the URL. The TV shows this as a QR for the phone to scan.
  const code = useMemo(() => params.code ?? getOrCreateCode(), [params.code]);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [stale, setStale] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  // TV-local music override: null = follow the phone; true/false = the viewer
  // explicitly started/stopped music from the TV (works even if the phone
  // never turned music on).
  const [musicOn, setMusicOn] = useState<boolean | null>(null);
  const [volume, setVolume] = useState(100);
  const volumeRef = useRef(100);
  // YT.Player REPLACES the element it's given with an <iframe>, so the host
  // must NOT be React-rendered (React would later remove a node that's gone
  // -> "removeChild" crash). It lives on document.body instead.
  const musicHost = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const currentYtId = useRef<string | null>(null);
  const lastEventAt = useRef(0);
  // Local smooth countdown. Preferred source: the phone's published
  // phase-end WALL-CLOCK time — the TV counts down against its own clock, so
  // network latency doesn't skew the number at all. Fallback (older phone
  // builds / a badly wrong TV clock): tick from the last received secondsLeft.
  const syncRef = useRef<{ left: number; at: number } | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const [displayLeft, setDisplayLeft] = useState<number | null>(null);

  useEffect(() => {
    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;overflow:hidden;';
    document.body.appendChild(host);
    musicHost.current = host;
    return () => {
      ytCall(playerRef.current, 'destroy');
      playerRef.current = null;
      musicHost.current = null;
      host.remove();
    };
  }, []);

  const apply = useCallback((s: LiveSession | null) => {
    if (!s) return;
    lastEventAt.current = Date.now();
    setErr(null);
    setStale(false);
    setSession(s);
    endsAtRef.current = s.phaseEndsAt ?? null;
    if (s.secondsLeft != null) {
      syncRef.current = { left: s.secondsLeft, at: performance.now() };
      setDisplayLeft(computeLeft(s.phaseEndsAt ?? null, { left: s.secondsLeft, at: performance.now() }));
    }
  }, []);

  // Live feed: initial fetch + subscription; polling only as a fallback.
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    let pollId: number | null = null;

    const poll = () =>
      fetchLiveSession(code)
        .then((s) => !cancelled && apply(s))
        .catch((e) => {
          if (!cancelled && !session) {
            setErr(e instanceof Error ? e.message : 'Connection error');
          }
        });

    poll(); // initial state
    const unsubscribe = subscribeLiveSession(
      code,
      (s) => !cancelled && apply(s),
      () => {
        // Subscription socket failed (odd TV browsers / proxies): poll instead.
        if (!cancelled && pollId == null) {
          pollId = window.setInterval(poll, 1500);
        }
      }
    );

    // Staleness watchdog: the phone publishes ~1x/s while broadcasting, so a
    // long silence means it's gone (app closed, network lost).
    const staleId = window.setInterval(() => {
      if (lastEventAt.current && Date.now() - lastEventAt.current > 12000) {
        setStale(true);
      }
    }, 3000);

    return () => {
      cancelled = true;
      unsubscribe();
      if (pollId != null) window.clearInterval(pollId);
      window.clearInterval(staleId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, apply]);

  // Tick the countdown locally between updates (only while running).
  useEffect(() => {
    if (session?.status !== 'running') return;
    const id = window.setInterval(() => {
      const left = computeLeft(endsAtRef.current, syncRef.current);
      if (left != null) setDisplayLeft(left);
    }, 150);
    return () => window.clearInterval(id);
  }, [session?.status]);

  // One user gesture (OK on the remote / a click / any key) unlocks sound for
  // the whole session — without it the browser refuses un-muted playback.
  useEffect(() => {
    if (soundOn) return;
    const unlock = () => setSoundOn(true);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [soundOn]);

  // The phone publishes the selected playlist (musicYtId) even when it isn't
  // playing, so the TV can start it on its own.
  const wantMusic = musicOn ?? !!session?.musicPlaying;

  // Mount / swap / stop the TV's own music player to match the phone's state
  // (and the TV-local override). Only after the sound unlock above.
  useEffect(() => {
    const want = soundOn && wantMusic ? session?.musicYtId ?? null : null;
    if (want === currentYtId.current) return;
    currentYtId.current = want;
    ytCall(playerRef.current, 'destroy');
    playerRef.current = null;
    if (musicHost.current) musicHost.current.innerHTML = '';
    if (!want) return;

    loadYouTubeApi().then((YT) => {
      const host = musicHost.current;
      if (!host || currentYtId.current !== want) return;
      host.innerHTML = '';
      const el = document.createElement('div');
      host.appendChild(el);
      const opts =
        session?.musicKind === 'playlist'
          ? { listType: 'playlist', list: want }
          : { videoId: want };
      playerRef.current = new YT.Player(el, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          playsinline: 1,
          origin: window.location.origin,
          ...opts,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            ytCall(e.target, 'setVolume', volumeRef.current);
            ytCall(e.target, 'playVideo');
          },
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn, wantMusic, session?.musicYtId, session?.musicKind]);

  // Volume control + countdown ducking: keep the music at the chosen volume,
  // dropping it low during the last seconds so the phone's voice cues carry.
  useEffect(() => {
    volumeRef.current = volume;
    const counting =
      displayLeft != null && displayLeft <= 4 && session?.status === 'running';
    ytCall(playerRef.current, 'setVolume', counting ? Math.min(10, volume) : volume);
  }, [volume, displayLeft, session?.status]);

  const controls = (
    <div className="tv-controls">
      {!soundOn ? (
        <button className="btn primary" autoFocus onClick={() => setSoundOn(true)}>
          🔊 Press OK for sound
        </button>
      ) : (
        <>
          <button
            className="btn ghost"
            autoFocus
            onClick={() => setMusicOn(!wantMusic)}
            aria-label="Start or stop music"
          >
            {wantMusic ? '⏸ Stop music' : '▶ Start music'}
          </button>
          <button
            className="btn ghost"
            onClick={() => setVolume((v) => Math.max(0, v - 10))}
            aria-label="Volume down"
          >
            −
          </button>
          <span className="tv-vol">{volume}</span>
          <button
            className="btn ghost"
            onClick={() => setVolume((v) => Math.min(100, v + 10))}
            aria-label="Volume up"
          >
            +
          </button>
        </>
      )}
    </div>
  );

  if (err && !session) {
    return (
      <div className="tv-screen tv-waiting">
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h1>Couldn't connect</h1>
        <p className="muted" style={{ maxWidth: 600 }}>{err}</p>
        <p className="muted">Code: {code}</p>
      </div>
    );
  }

  if (!session || stale) {
    return (
      <div className="tv-screen tv-waiting">
        <h1 style={{ marginBottom: 4 }}>📺 Superileri Fit</h1>
        <p className="muted" style={{ marginBottom: 22 }}>
          {stale
            ? 'Phone disconnected. Start a workout and tap 📺 to reconnect.'
            : 'Open a workout on your phone, tap 📺 Send to TV, and scan this code.'}
        </p>
        <div className="tv-qr">
          <QRCodeSVG value={code} size={240} level="M" includeMargin />
        </div>
        <div className="tv-code">{code}</div>
        {soundOn ? (
          <p className="muted" style={{ marginTop: 10 }}>
            🔊 Sound ready · No camera? Enter this code in the app · {TV_ENTRY_URL}
          </p>
        ) : (
          <button className="btn primary tv-sound-btn" autoFocus onClick={() => setSoundOn(true)}>
            Press OK to enable sound 🔊
          </button>
        )}
      </div>
    );
  }

  const type = session.phaseType ?? 'prep';
  const left = displayLeft ?? session.secondsLeft;
  const pct =
    session.totalSeconds && left != null
      ? Math.max(
          0,
          Math.min(100, ((session.totalSeconds - left) / session.totalSeconds) * 100)
        )
      : 0;

  if (type === 'done' || session.status === 'finished') {
    return (
      <div className="tv-screen done">
        <div style={{ fontSize: 96 }}>🎉</div>
        <h1>Workout complete</h1>
      </div>
    );
  }

  // Demo clip: prefer what the phone resolved (includes its custom overrides);
  // fall back to the bundled defaults by exercise id (older phone builds).
  const fallback = session.exerciseId ? loadExVideos()[session.exerciseId] : undefined;
  const video = session.videoYtId
    ? { ytId: session.videoYtId, start: session.videoStart ?? undefined }
    : fallback;

  return (
    <div className={`tv-screen ${type}`}>
      <div className="tv-top">
        <div className="tv-phase-label">{phaseTitle[type] ?? type}</div>
        {session.round && (
          <div className="tv-round">
            Round {session.round}/{session.totalRounds} · {session.groupName}
          </div>
        )}
      </div>

      <div className="tv-layout">
        {video && (
          <div className="tv-video">
            {/* key => reload only when the clip actually changes */}
            <iframe
              key={video.ytId}
              src={exEmbedUrl(video)}
              title={session.exerciseName ?? 'Exercise demo'}
              allow="autoplay; encrypted-media"
              frameBorder="0"
            />
          </div>
        )}
        <div className="tv-info">
          <div className="tv-count">{left ?? '-'}</div>
          <div className="tv-exercise">{session.exerciseName}</div>
          {wantMusic && session.musicLabel && (
            <div className="tv-music">♪ {session.musicLabel}</div>
          )}
        </div>
      </div>

      {controls}
      <div className="tv-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default TvDisplay;

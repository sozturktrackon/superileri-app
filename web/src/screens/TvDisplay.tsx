import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  fetchLiveSession,
  getOrCreateCode,
  TV_ENTRY_URL,
  type LiveSession,
} from '../lib/liveSession';
import { exEmbedUrl, loadExVideos } from '../lib/exerciseVideos';
import { loadYouTubeApi, type YTPlayer } from '../lib/ytPlayer';

const phaseTitle: Record<string, string> = {
  prep: 'Get Ready',
  on: 'Work',
  rest: 'Rest',
  done: 'Complete',
};

/**
 * Public, no-login "big screen" display. Open this on a smart TV / laptop
 * browser and it polls the paired phone's live workout state, rendering a
 * synced countdown + the exercise demo video — and plays the music through
 * the TV's own speakers via its own YouTube player instance.
 *
 * Browsers block un-muted autoplay on a page with no user interaction, so the
 * waiting screen asks for one press of OK (a single click/keypress) to unlock
 * sound before the workout starts. The demo video is always muted, so it
 * plays regardless.
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
  const musicHost = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const currentYtId = useRef<string | null>(null);
  // Local smooth countdown: polls arrive every ~1-2s over the network, which
  // makes the number stutter ("freeze") if we only render on poll responses.
  // We tick locally and use each poll as a correction.
  const syncRef = useRef<{ left: number; at: number } | null>(null);
  const [displayLeft, setDisplayLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const s = await fetchLiveSession(code);
        if (cancelled) return;
        setErr(null);
        setSession(s);
        if (s?.secondsLeft != null) {
          syncRef.current = { left: s.secondsLeft, at: performance.now() };
          setDisplayLeft(s.secondsLeft);
        }
        setStale(
          !s?.updatedAt || Date.now() - new Date(s.updatedAt).getTime() > 8000
        );
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Connection error');
      }
    };
    poll();
    const id = window.setInterval(poll, 900);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [code]);

  // Tick the countdown locally between polls (only while running).
  useEffect(() => {
    if (session?.status !== 'running') return;
    const id = window.setInterval(() => {
      const sync = syncRef.current;
      if (!sync) return;
      const elapsed = Math.floor((performance.now() - sync.at) / 1000);
      setDisplayLeft(Math.max(0, sync.left - elapsed));
    }, 250);
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

  // Mount / swap / stop the TV's own music player to match the phone's state.
  // Requires the sound unlock above; the player is only created after it.
  useEffect(() => {
    const want = soundOn && session?.musicPlaying ? session?.musicYtId ?? null : null;
    if (want === currentYtId.current) {
      if (!want) return;
      return;
    }
    currentYtId.current = want;
    playerRef.current?.destroy();
    playerRef.current = null;
    if (!want || !musicHost.current) return;

    loadYouTubeApi().then((YT) => {
      if (!musicHost.current || currentYtId.current !== want) return;
      const opts =
        session?.musicKind === 'playlist'
          ? { listType: 'playlist', list: want }
          : { videoId: want };
      playerRef.current = new YT.Player(musicHost.current, {
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
            e.target.setVolume(100);
            e.target.playVideo();
          },
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn, session?.musicYtId, session?.musicPlaying, session?.musicKind]);

  // Duck the TV's music during the countdown so the phone's voice cues
  // ("three, two, one") stay audible over the TV speakers.
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const counting =
      displayLeft != null && displayLeft <= 4 && session?.status === 'running';
    try {
      p.setVolume(counting ? 10 : 100);
    } catch {
      /* player still booting */
    }
  }, [displayLeft, session?.status]);

  useEffect(() => () => playerRef.current?.destroy(), []);

  if (err) {
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
          Open a workout on your phone, tap <strong>📺 Send to TV</strong>, and
          scan this code.
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
          {session.musicPlaying && session.musicLabel && (
            <div className="tv-music">
              ♪ {session.musicLabel}
              {!soundOn && ' · press OK for sound'}
            </div>
          )}
        </div>
      </div>

      <div className="tv-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <div ref={musicHost} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
    </div>
  );
};

export default TvDisplay;

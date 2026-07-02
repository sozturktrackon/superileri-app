import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  fetchLiveSession,
  getOrCreateCode,
  TV_ENTRY_URL,
  type LiveSession,
} from '../lib/liveSession';
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
 * synced countdown + exercise + progress bar — and plays the music itself
 * (through the TV's own speakers) via its own YouTube player instance.
 */
const TvDisplay = () => {
  const params = useParams();
  // `/tv` self-generates a stable code for this display; `/tv/:code` honors a
  // code passed in the URL. The TV shows this as a QR for the phone to scan.
  const code = useMemo(() => params.code ?? getOrCreateCode(), [params.code]);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [stale, setStale] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const musicHost = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const currentYtId = useRef<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const s = await fetchLiveSession(code);
        if (cancelled) return;
        setErr(null);
        setSession(s);
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

  // Mount / swap / stop the TV's own music player to match the phone's state.
  useEffect(() => {
    const want = session?.musicPlaying ? session?.musicYtId ?? null : null;
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
  }, [session?.musicYtId, session?.musicPlaying, session?.musicKind]);

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
        <p className="muted" style={{ marginTop: 10 }}>
          No camera? Enter this code in the app · {TV_ENTRY_URL}
        </p>
      </div>
    );
  }

  const type = session.phaseType ?? 'prep';
  const pct =
    session.totalSeconds && session.secondsLeft != null
      ? Math.max(
          0,
          Math.min(
            100,
            ((session.totalSeconds - session.secondsLeft) /
              session.totalSeconds) *
              100
          )
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
      <div className="tv-count">{session.secondsLeft ?? '-'}</div>
      <div className="tv-exercise">{session.exerciseName}</div>
      {session.musicPlaying && session.musicLabel && (
        <div className="tv-music">♪ {session.musicLabel}</div>
      )}
      <div className="tv-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <div ref={musicHost} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
    </div>
  );
};

export default TvDisplay;

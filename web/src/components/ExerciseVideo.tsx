import { useEffect, useRef, useState } from 'react';
import { exerciseVideoUrl } from '../lib/api';
import {
  exEmbedUrl,
  exWatchUrl,
  loadExVideos,
  type ExVid,
} from '../lib/exerciseVideos';

type VideoWithAirplay = HTMLVideoElement & {
  webkitShowPlaybackTargetPicker?: () => void;
};

/** YouTube search for a real human form demo (a search link never rots). */
const formSearchUrl = (name?: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${name ?? 'exercise'} proper form how to`
  )}`;

/**
 * Shows the exercise demo. Prefers an owned, silent, looping clip from S3; when
 * none exists it falls back to a "Watch real form" button that opens a YouTube
 * search for the move (always-correct human demos, zero maintenance). A "Cast to
 * TV" button appears when a nearby display is detected (Remote Playback/AirPlay).
 */
const ExerciseVideo = ({
  exerciseId,
  exerciseName,
}: {
  exerciseId?: string;
  exerciseName?: string;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canCast, setCanCast] = useState(false);

  // A curated YouTube clip for this exercise (if the user has set one).
  const curated: ExVid | undefined = exerciseId
    ? loadExVideos()[exerciseId]
    : undefined;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setUrl(null);
    // A curated YouTube link OVERRIDES the AI clip, so skip the S3 lookup entirely.
    if (!exerciseId || curated) {
      setLoading(false);
      return;
    }
    exerciseVideoUrl(exerciseId).then((u) => {
      if (active) {
        setUrl(u);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, curated?.ytId]);

  // Detect whether a cast/AirPlay target exists.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let callbackId: number | undefined;
    const remote = (v as HTMLVideoElement & { remote?: RemotePlayback }).remote;
    if (remote && 'watchAvailability' in remote) {
      remote
        .watchAvailability((available: boolean) => setCanCast(available))
        .then((id: number) => (callbackId = id))
        .catch(() => {});
    } else if ('webkitShowPlaybackTargetPicker' in v) {
      v.setAttribute('x-webkit-airplay', 'allow'); // enable AirPlay route
      setCanCast(true); // Safari/AirPlay: show the button, OS decides targets
    }
    return () => {
      if (remote && callbackId !== undefined) {
        remote.cancelWatchAvailability(callbackId).catch(() => {});
      }
    };
  }, [url]);

  const cast = async () => {
    const v = ref.current as VideoWithAirplay | null;
    if (!v) return;
    const remote = (v as HTMLVideoElement & { remote?: RemotePlayback }).remote;
    try {
      if (remote && 'prompt' in remote) {
        await remote.prompt();
      } else if (v.webkitShowPlaybackTargetPicker) {
        v.webkitShowPlaybackTargetPicker();
      }
    } catch {
      /* user dismissed */
    }
  };

  const openForm = () =>
    window.open(formSearchUrl(exerciseName), '_blank', 'noopener');

  return (
    <div className="timer-video">
      {loading && <div className="placeholder">Loading…</div>}

      {/* Curated YouTube clip wins: autoplays MUTED (music plays separately) +
          looping, and overrides any AI clip. A bare iframe can't tell us if
          YouTube blocked/sign-in-walled it, so we always offer a one-tap
          escape to the real video (opens in the user's own YouTube session). */}
      {!loading && curated && (
        <>
          <iframe
            key={`${exerciseId}-${curated.ytId}`}
            title="exercise-demo"
            src={exEmbedUrl(curated)}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 0 }}
          />
          <div className="video-actions">
            <button
              className="tctrl sm"
              onClick={() => window.open(exWatchUrl(curated), '_blank', 'noopener')}
              aria-label="Open in YouTube"
            >
              ▶
            </button>
          </div>
        </>
      )}

      {!loading && !curated && url && (
        <>
          <video ref={ref} src={url} autoPlay muted loop playsInline />
          <div className="video-actions">
            <button className="tctrl sm" onClick={openForm} aria-label="Watch real form on YouTube">
              ▶
            </button>
            {canCast && (
              <button className="tctrl sm" onClick={cast} aria-label="Cast video to TV">
                📺
              </button>
            )}
          </div>
        </>
      )}

      {!loading && !curated && !url && (
        <div className="placeholder">
          <div style={{ fontSize: 40, marginBottom: 6 }}>🏋️</div>
          <button className="btn primary" onClick={openForm}>
            ▶ Watch real form
          </button>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
            Opens a YouTube demo · add a clip in Progress → Demo videos
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseVideo;

import { useEffect, useRef, useState } from 'react';
import { exerciseVideoUrl } from '../lib/api';

type VideoWithAirplay = HTMLVideoElement & {
  webkitShowPlaybackTargetPicker?: () => void;
};

/**
 * Plays the looping demo video for an exercise (muted — music + beeps come from
 * elsewhere). Shows a "Cast to TV" button only when a nearby display is
 * detected, using the Remote Playback API (Chromecast) with an AirPlay fallback.
 */
const ExerciseVideo = ({ exerciseId }: { exerciseId?: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canCast, setCanCast] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setUrl(null);
    if (!exerciseId) {
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
  }, [exerciseId]);

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

  return (
    <div className="timer-video">
      {loading && <div className="placeholder">Loading…</div>}
      {!loading && url && (
        <>
          <video ref={ref} src={url} autoPlay muted loop playsInline />
          {canCast && (
            <button
              className="tctrl"
              style={{ position: 'absolute', top: 10, right: 10 }}
              onClick={cast}
              aria-label="Cast video to TV"
            >
              📺
            </button>
          )}
        </>
      )}
      {!loading && !url && (
        <div className="placeholder">
          🎬 No demo video yet.
          <br />
          Upload one to <code>videos/{exerciseId}.mp4</code>
        </div>
      )}
    </div>
  );
};

export default ExerciseVideo;

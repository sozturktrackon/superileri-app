import { useState } from 'react';
import { allGroups } from '../lib/content';
import {
  loadExVideos,
  parseVideo,
  setExVideo,
  type ExVid,
} from '../lib/exerciseVideos';

/**
 * Paste a YouTube link per exercise. Saved in-browser (no redeploy). During a
 * workout the box autoplays the matching clip (muted, looping) the moment the
 * timer reaches (or preps/rests for) that exercise.
 */
const ExerciseVideoSettings = () => {
  const [map, setMap] = useState<Record<string, ExVid>>(loadExVideos);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const groups = allGroups().filter((g) => g.exercises.length > 0);
  const setCount = Object.keys(map).length;

  const commit = (id: string, raw: string) => {
    setMap(setExVideo(map, id, raw));
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: 4 }}>🎬 Demo videos</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        Paste a YouTube link for any exercise. It autoplays in the box during
        that move. {setCount} set so far.
      </p>

      {groups.map((g) => (
        <details key={g.key} style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            {g.name}
          </summary>
          <div className="stack" style={{ marginTop: 8 }}>
            {g.exercises.map((ex) => {
              const current = map[ex.id];
              const draft = drafts[ex.id] ?? (current ? `https://youtu.be/${current.ytId}` : '');
              const valid = draft ? !!parseVideo(draft) : true;
              return (
                <div key={ex.id} className="field" style={{ marginBottom: 4 }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{ex.name}</span>
                    {current && <span className="pill rest" style={{ fontSize: 10 }}>● set</span>}
                  </label>
                  <input
                    value={draft}
                    placeholder="Paste YouTube link…"
                    style={!valid ? { borderColor: 'var(--accent-2)' } : undefined}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [ex.id]: e.target.value }))
                    }
                    onBlur={(e) => commit(ex.id, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
};

export default ExerciseVideoSettings;

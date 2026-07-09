import { useState } from 'react';
import { allGroups } from '../lib/content';
import {
  addPlaylist,
  loadMusic,
  removePlaylist,
  setActive,
  setCategoryPlaylist,
  type MusicConfig,
} from '../lib/music';
import { useT } from '../lib/i18n';

/** Full music manager: multiple playlists, a default, and per-category mapping. */
const MusicSettings = () => {
  const { t } = useT();
  const [cfg, setCfg] = useState<MusicConfig>(loadMusic);
  const [label, setLabel] = useState('');
  const [link, setLink] = useState('');

  const groups = allGroups().filter((g) => g.exercises.length > 0);

  return (
    <div className="card">
      <h3 style={{ marginBottom: 4 }}>{t('🎵 Music')}</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        {t('Your playlists are remembered on this device.')}
      </p>

      <div className="stack" style={{ marginTop: 10 }}>
        {cfg.playlists.map((p) => (
          <div className="card-row" key={p.id} style={{ margin: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                name="active"
                checked={cfg.activeId === p.id}
                onChange={() => setCfg(setActive(cfg, p.id))}
              />
              {p.label}
              {cfg.activeId === p.id && (
                <span className="pill accent">{t('default')}</span>
              )}
            </label>
            <button
              className="btn ghost"
              style={{ padding: '6px 10px' }}
              onClick={() => setCfg(removePlaylist(cfg, p.id))}
            >
              ✕
            </button>
          </div>
        ))}
        {cfg.playlists.length === 0 && (
          <p className="muted">{t('No playlists yet. Add one below.')}</p>
        )}
      </div>

      <div className="field" style={{ marginTop: 14, marginBottom: 6 }}>
        <label>{t('Add a playlist')}</label>
        <input
          placeholder={t('Name (e.g. Beast Mode)')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <input
          placeholder={t('Paste a YouTube playlist or song link')}
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <button
        className="btn primary block"
        onClick={() => {
          if (!link.trim()) return;
          setCfg(addPlaylist(cfg, label, link));
          setLabel('');
          setLink('');
        }}
      >
        {t('Add playlist')}
      </button>

      {cfg.playlists.length > 0 && (
        <>
          <h3 style={{ marginTop: 22, marginBottom: 4, fontSize: 15 }}>
            {t('Music per workout type')}
          </h3>
          <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
            {t('Optional. Pick a specific playlist for certain circuits. Defaults to your default playlist.')}
          </p>
          <div className="stack" style={{ marginTop: 10 }}>
            {groups.map((g) => (
              <div className="card-row" key={g.key} style={{ margin: 0 }}>
                <span style={{ fontSize: 14 }}>{g.name}</span>
                <select
                  value={cfg.categoryMap[g.key] ?? ''}
                  onChange={(e) =>
                    setCfg(
                      setCategoryPlaylist(cfg, g.key, e.target.value || null)
                    )
                  }
                  style={{ maxWidth: 160 }}
                >
                  <option value="">{t('Default')}</option>
                  {cfg.playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MusicSettings;

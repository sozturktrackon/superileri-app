import { useEffect, useState } from 'react';
import {
  addPartner,
  getMyEmail,
  listPartners,
  removePartner,
  type Partner,
} from '../lib/api';

/**
 * Manage training partners (separate accounts you train with). Both people must
 * add each other for shared-session logging to work. Adding someone here means
 * "I allow them to mark my workouts complete," and lets you mark theirs.
 */
const PartnerSettings = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [myEmail, setMyEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPartners().then(setPartners);
    getMyEmail().then(setMyEmail);
  }, []);

  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    if (e === myEmail.toLowerCase()) {
      setError("That's your own email.");
      return;
    }
    if (partners.some((p) => p.email.toLowerCase() === e)) {
      setError('Already added.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const p = await addPartner(e, name);
      setPartners((prev) => [...prev, p]);
      setEmail('');
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add partner.');
    } finally {
      setBusy(false);
    }
  };

  const drop = async (p: Partner) => {
    if (!window.confirm(`Remove ${p.name || p.email} as a partner?`)) return;
    await removePartner(p.id);
    setPartners((prev) => prev.filter((x) => x.id !== p.id));
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: 4 }}>🤝 Training partners</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        Train together on one phone, mark both calendars. Add your partner's
        email, and have them add yours (
        <strong>{myEmail || 'your email'}</strong>) so it works both ways.
      </p>

      <div className="stack" style={{ marginTop: 10 }}>
        {partners.map((p) => (
          <div key={p.id} className="card-row" style={{ margin: 0 }}>
            <div>
              <strong>{p.name || p.email}</strong>
              {p.name && (
                <div className="muted" style={{ fontSize: 12 }}>{p.email}</div>
              )}
            </div>
            <button
              className="btn ghost"
              style={{ padding: '6px 10px' }}
              onClick={() => drop(p)}
            >
              ✕
            </button>
          </div>
        ))}
        {partners.length === 0 && (
          <p className="muted">No partners yet.</p>
        )}
      </div>

      <div className="field" style={{ marginTop: 14, marginBottom: 6 }}>
        <label>Add a partner</label>
        <input
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <input
          placeholder="partner@email.com"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="btn primary block" onClick={add} disabled={busy}>
        {busy ? 'Adding…' : 'Add partner'}
      </button>
    </div>
  );
};

export default PartnerSettings;

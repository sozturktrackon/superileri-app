import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logCrash } from '../lib/crashLog';

/**
 * Last line of defense: without this, ANY uncaught error in a render or
 * effect makes React 18 unmount the whole tree — a blank screen with no way
 * back. Show a recovery card instead. Reloading re-enters the same hash
 * route, and the workout screen restores its saved progress.
 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crash:', error, info.componentStack);
    logCrash('react', error.message, error.stack ?? info.componentStack ?? undefined);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const err = this.state.error as Error;
    return (
      <div className="center-screen" style={{ flexDirection: 'column', gap: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>😵</div>
        <h2>Something went wrong</h2>
        <p className="muted" style={{ maxWidth: 420 }}>
          The app hit an unexpected error. Your progress is saved — tap below
          to pick up where you left off.
        </p>
        <p
          className="muted"
          style={{
            maxWidth: 420,
            fontSize: 11,
            fontFamily: 'monospace',
            wordBreak: 'break-word',
            background: 'var(--bg-elev-2)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          {err?.message ?? String(this.state.error)} · v{__APP_VERSION__}
        </p>
        <button className="btn primary" onClick={() => window.location.reload()}>
          Resume
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;

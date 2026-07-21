# hop30 💪

A personal home-workout app rebuilt from the old "Motivated Fit" program: a
30-day Lean/Bulk calendar, an interval timer that talks you through every
30s-on / 30s-off circuit, exercise demo videos, music, TV casting, and
monthly photo check-ins with AI body-composition estimates.

Built to start tiny (just you) and scale to millions without a rewrite —
because it runs on standard serverless AWS primitives via **AWS Amplify Gen 2**.

**🌐 Live:** https://main.d1jwmrz4ddo322.amplifyapp.com

---

## Architecture

```
┌── web/  (Vite + React + TS PWA, mobile-first) ──────────────┐
│   • Auth UI, interval timer engine, calendar, check-ins      │
│   • Talks directly to the cloud at runtime (no middle tier)  │
└──────────────┬───────────────────────────────────────────────┘
               │  aws-amplify (Cognito + AppSync + S3)
┌──────────────▼─ amplify/ (Gen 2 backend, TypeScript/CDK) ────┐
│   auth      → Cognito user pool (email login)                 │
│   data      → AppSync GraphQL + DynamoDB (owner-scoped):      │
│               UserProfile · WorkoutLog · CheckIn              │
│   storage   → S3: photos/{you}/* (private) · videos/* (read)  │
│   function  → check-in-analyzer → Bedrock (Claude vision)     │
└───────────────────────────────────────────────────────────────┘
```

The exercise catalog and Lean/Bulk calendars are **static content** bundled in
the frontend (`content/*.json`), so the database only stores genuinely per-user
data. Each user can only ever read/write their own rows and their own photos.

## Quick start

```bash
make install          # install backend + web deps
make backend          # deploy cloud backend once (AWS_PROFILE=sandbox, us-east-1)
make web              # run the app locally (open the Network URL on your phone)
```

`make web` prints a `http://<your-laptop-ip>:5173` URL — open it on your phone
(same Wi-Fi) and "Add to Home Screen" for the full-screen PWA experience.

> ⚠️ One-time manual steps (Bedrock access, hosting) are in
> [`MANUAL-SETUP.md`](./MANUAL-SETUP.md). The AI check-in needs Bedrock model
> access enabled; everything else works without it.

## Features

- **Interval timer** — 30s prep → 30s work (last 3s beep) → green rest screen →
  next exercise; 4 rounds, prep only once. Accurate (wall-clock anchored),
  with haptics, audio cues, and a screen wake-lock.
- **Auto-tracked calendar** — finishing a circuit logs it; calendar days check
  off automatically. Closing the app or skipping ahead does **not** count.
- **Exercise videos** — per-exercise demo clips from S3 (`videos/<id>.mp4`).
- **Music** — multiple YouTube playlists, a default, and optional per-workout-
  type playlists. Remembered on your device.
- **Cast to TV** — send the demo video to a Chromecast/AirPlay display while the
  phone keeps the timer + music + beeps. Plus a fullscreen "TV mode".
- **Check-ins** — monthly full-body photo (private) + AI body-fat estimate via
  Bedrock, with a photo timeline and trend.

## Uploading exercise videos

Name each clip after the exercise id (see `content/exercises.json`), e.g.
`traditional-push-up.mp4`, then:

```bash
make upload-videos DIR=./my-videos
```

## Repo layout

```
amplify/            Gen 2 backend (auth, data, storage, functions)
content/            Source-of-truth JSON (exercises, calendars) — also copied to web/
web/                React PWA (src/lib timer/sound/api, src/screens, src/components)
Makefile            install / backend / web / upload-videos / delete
MANUAL-SETUP.md     One-time manual configuration steps
```

## Make targets

| Command | What it does |
| --- | --- |
| `make backend` | Deploy cloud backend once |
| `make backend-watch` | Deploy + watch (live backend dev) |
| `make web` | Run the PWA locally |
| `make web-build` | Production build → `web/dist` |
| `make host` | Build + deploy to Amplify Hosting (public URL) |
| `make upload-videos DIR=…` | Push exercise videos to S3 |
| `make delete` | Tear down the cloud backend |
| `make sandbox-info` | Print backend resource IDs |

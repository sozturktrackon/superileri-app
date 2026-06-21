# Manual setup steps

Things I can't do for you from code — each is one-time and quick. The app runs
without #1 and #2 (you just won't get AI analysis / a public URL until then).

---

## 1. Enable Bedrock model access (required for AI check-ins)

The check-in analyzer calls Anthropic Claude on Amazon Bedrock. Model access is
off by default and can only be enabled from the console.

1. Sign in to the AWS console as the **sandbox** account (`339713124513`).
2. Region selector → **US East (N. Virginia) / us-east-1**.
3. Go to **Bedrock → Model access** (left nav).
4. Click **Enable specific models** (or "Manage model access").
5. Tick **Anthropic – Claude 3.5 Sonnet** (and Claude 3.5 Haiku if you want a
   cheaper option). Submit. Access is usually granted within a minute.

That's it — the app already has IAM permission to invoke it. If you enable a
different model, set its inference-profile id in
`amplify/functions/check-in-analyzer/resource.ts` (`BEDROCK_MODEL_ID`) and
re-run `make backend`.

> Until this is done, onboarding/check-in still work — the photo uploads and the
> record is saved; only the AI summary will be empty.

---

## 2. Public hosting via CloudFront (when you're ready to share)

For tomorrow's workout you don't need this — `make web` serves the app on your
laptop and you open it on your phone over Wi-Fi. When you want a real URL:

**Easiest (Amplify Hosting, gives you CloudFront automatically):**

1. Push this repo to GitHub.
2. AWS console → **Amplify** → **Create app** → **Host web app** → connect the
   GitHub repo/branch.
3. Set the app root to `web` (build) and confirm the build settings; Amplify
   detects Vite. It builds, deploys behind CloudFront, and gives you an HTTPS
   URL. Add a custom domain there if you want one.

(Alternative: `make web-build` then `aws s3 sync web/dist s3://<bucket>` to your
own S3+CloudFront, mirroring the tradingdocs-ui flow. Amplify Hosting is less
work and includes CI/CD.)

---

## 3. Note: your shell forces a region

Your shell sets `AWS_REGION=ap-south-1`, which overrides the `sandbox` profile's
`us-east-1`. The Makefile pins `us-east-1` on every AWS target, so `make`
commands are safe. If you run `npx ampx …` by hand, prefix it with
`AWS_REGION=us-east-1`.

---

## Content you still need to provide

These are data gaps, not bugs — the app handles them gracefully:

- **Exercise videos** — none exist yet. The timer shows a clean placeholder
  until you upload `videos/<exerciseId>.mp4` (`make upload-videos DIR=…`). Ids
  are in `content/exercises.json`.
- **"Booty Like J-Lo" circuit** — referenced in both Lean and Bulk calendars but
  its exercise list is **missing from the source Exercises PDF**. It's marked
  `_missing` in `content/exercises.json` with an empty exercise list; add the 4
  exercises there when you have them and the circuit lights up automatically.

---

## Roadmap (not built yet)

- **Native in-app Google Cast button** — the current "Cast to TV" uses the web
  Remote Playback API (AirPlay/Chromecast for the video element) plus a
  fullscreen TV mode you mirror via the OS. A true in-app Cast button needs a
  registered Google Cast app id + a custom receiver — a larger, separate effort.
- **Background audio with screen locked** — browsers pause YouTube audio when the
  app isn't foreground; that's a platform restriction (needs YouTube Premium /
  a native app shell to override).
- **Sync music library to your account** — playlists are currently per-device
  (localStorage); moving them into `UserProfile` would sync across devices.

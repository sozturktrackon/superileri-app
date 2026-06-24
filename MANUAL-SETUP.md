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
5. Tick **Anthropic – Claude Opus 4.8** (the app uses the
   `global.anthropic.claude-opus-4-8` inference profile). Submit. Access is
   usually granted within a minute.

That's it — the app already has IAM permission to invoke it. To use a different
model, set its id in `amplify/functions/check-in-analyzer/resource.ts`
(`BEDROCK_MODEL_ID`) and re-run `make backend`.

> Until this is done, onboarding/check-in still work — the photo uploads and the
> record is saved; only the AI summary will be empty.

---

## 2. Public hosting via CloudFront — ✅ DONE

The app is live behind Amplify Hosting (CloudFront) at:

**https://main.d1jwmrz4ddo322.amplifyapp.com**

This was deployed with a CLI **manual deploy** (no GitHub needed) — see
`scripts/deploy-hosting.sh`. To ship a new version after any frontend change:

```bash
make host        # rebuilds web/ and redeploys to the same URL
```

Optional later: connect a custom domain in the Amplify console (Hosting →
Custom domains), or wire GitHub for automatic CI/CD deploys on push.

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

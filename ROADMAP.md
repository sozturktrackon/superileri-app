# hop30 — Roadmap / Parked Ideas

Working list of agreed-but-not-yet-built items. Ship order is owner's call.

## Engagement (discussed 2026-07-17)
- [x] AI coach daily encouragement line on Today (classy, 1-2 sentences, user's language)
- [x] Streak milestone celebrations (7/14/30/50/100 days) with recovery-flavored
      real-world reward suggestions (massage, gear, sauna; never food)
- [x] Streak-break comeback framing: emphasize never-resetting totals
- [ ] "Joker day" - 1 per cycle, consciously spends a pass instead of breaking the streak
- [ ] Express mode - "just 2 rounds today" button; counts as partial, not full check
- [ ] Partner-completed nudge ("Anna finished today") - needs cross-user read via Lambda
- [ ] Achievement emails - requires SES production-access request (manual AWS step);
      keep restrained: milestones only, opt-out in Progress

## Commercialization gate (~100 users)
- [ ] Lawyer review of Terms/Privacy (template-grade today; UAE governing law)
- [ ] Translate full legal docs for actively-targeted markets
- [ ] SSO, Google first (Microsoft OIDC consumers-tenant recipe + PreSignUp
      linking Lambda pattern: ../trackon-aws-backend/templates/cloudformation.yaml
      + src/lambdas/pre_sign_up.py). Apple only if App Store.
- [ ] Consider Fable upgrade for the AI coach/analysis when reasoning depth matters
- [ ] Enable AWS WAF on Amplify Hosting (the console "Firewall" tab) - skipped for
      now: ~$8-10/mo minimum makes no sense for 2 users behind Cognito auth
- [ ] Leaderboard (opt-in, best streak) + prizes
- [ ] Admin mini-dashboard (user count, activity)

## Programs
- [ ] Cycle-aware workout logs (dayNumber + cycle) - enables exact multi-cycle streaks
- [ ] AI coach cycle-end recommendation (propose, never auto-switch; add 1-tap
      post-circuit difficulty rating first to feed it)
- [ ] More programs (beginner / 3-day maintenance); per-plan lengths already supported
- [ ] Optional pull-up-bar variant pack (fixes pull/biceps ceiling of bodyweight)

## Languages
- [ ] Next wave candidates: Indonesian done; consider Korean, Bengali, Italian on demand
- [ ] Native-speaker review loop stays: writer agent -> monolingual audit -> user reports

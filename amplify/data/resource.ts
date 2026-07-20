import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { checkInAnalyzer } from '../functions/check-in-analyzer/resource';
import { coach } from '../functions/coach/resource';
import { partnerLogger } from '../functions/partner-logger/resource';

/**
 * Data model for Superileri Fitness.
 *
 * The exercise catalog and the Lean/Bulk calendars are STATIC content bundled
 * in the frontend (see /content/*.json) — they are not stored here. This schema
 * only holds genuinely per-user, dynamic data. Every model is owner-scoped:
 * a signed-in user can only read/write their own rows.
 */
const schema = a.schema({
  // One row per user: their plan choice and where they are in it.
  UserProfile: a
    .model({
      plan: a.enum(['lean', 'bulk', 'lean2', 'bulk2']), // II = graduate programs
      language: a.string(), // BCP-47-ish code (en, tr, hi, fr, de, es, pt, ...)
      // GDPR consent audit trail: when the user accepted which terms version,
      // and the separate explicit consent for health-related data (body
      // photos + AI analysis; GDPR Art. 9 requires it to be distinct).
      termsAcceptedAt: a.datetime(),
      termsVersion: a.string(),
      healthConsentAt: a.datetime(),
      // Streak milestones already celebrated (7, 14, 30, ...). Server-side so
      // dismissing the celebration once dismisses it on every device.
      milestonesSeen: a.integer().array(),
      startDate: a.date(),
      currentDay: a.integer().default(1), // raw ever-increasing; wraps per plan length
      displayName: a.string(),
      sex: a.enum(['male', 'female', 'other']),
      birthYear: a.integer(),
      heightCm: a.float(),
      goal: a.string(),
      onboardedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // One row per completed (or attempted) workout session.
  WorkoutLog: a
    .model({
      date: a.date().required(),
      planId: a.string().required(), // 'lean' | 'bulk'
      dayNumber: a.integer().required(), // 1..30 (normalized program day)
      cycle: a.integer(), // which repeat of the plan; missing = cycle 1 (legacy)
      groupKeys: a.string().array(), // e.g. ["Chest","CH"]
      participants: a.string().array(), // names of people who did this circuit
      completed: a.boolean().default(false),
      durationSec: a.integer(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  // Monthly progress check-in: one or more angle photos (front/back/left/right)
  // + optional measurements + AI analysis.
  CheckIn: a
    .model({
      date: a.date().required(),
      kind: a.enum(['onboarding', 'monthly']),
      photoPath: a.string(), // legacy/primary (front) photo, kept for quick thumbnails
      photos: a.json(), // AnglePhoto[]: [{ angle: 'front'|'back'|'left'|'right', path }]
      weightKg: a.float(),
      aiBodyFatPct: a.float(),
      aiSummary: a.string(),
      aiComparison: a.string(), // honest progress vs the first/baseline photo set
      aiRaw: a.json(),
      analyzed: a.boolean().default(false),
    })
    .authorization((allow) => [allow.owner()]),

  // Shape returned by the AI analysis mutation.
  CheckInAnalysis: a.customType({
    bodyFatPct: a.float(),
    summary: a.string(),
    estimatedWeightNote: a.string(),
    comparison: a.string(), // progress vs baseline (null if no baseline given)
    raw: a.json(),
  }),

  // Custom mutation: hand it this check-in's angle photos (front/back/left/
  // right); it calls Bedrock (Claude vision) to estimate body composition using
  // all angles together. If baselinePhotos is given, it also compares angle by
  // angle against the first check-in and reports honest progress.
  analyzeCheckIn: a
    .mutation()
    .arguments({
      photos: a.json().required(), // AnglePhoto[]
      baselinePhotos: a.json(), // AnglePhoto[] | undefined
      language: a.string(), // respond in this language (default English)
    })
    .returns(a.ref('CheckInAnalysis'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(checkInAnalyzer)),

  // One warm daily coaching sentence for the Today screen, in the user's
  // language. Cheap by design: the client caches it per (date, language).
  coachLine: a
    .query()
    .arguments({
      language: a.string(),
      name: a.string(),
      dayNumber: a.integer(),
      cycle: a.integer(),
      streak: a.integer(),
      totalCircuits: a.integer(),
      isRest: a.boolean(),
      doneToday: a.boolean(), // today's session already completed → congratulate, don't preview
      groups: a.string(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(coach)),

  // A training partner you've linked by email. Logging on a partner's behalf is
  // only allowed when BOTH have added each other (mutual consent), enforced in
  // the partner-logger Lambda.
  Partner: a
    .model({
      email: a.string().required(),
      name: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  PartnerLogResult: a.customType({
    ok: a.boolean(),
    message: a.string(),
  }),

  // Mark a completed circuit on a linked partner's calendar too. The Lambda
  // verifies the mutual link, then writes a WorkoutLog owned by the partner.
  logForPartner: a
    .mutation()
    .arguments({
      partnerEmail: a.string().required(),
      planId: a.string().required(),
      dayNumber: a.integer().required(),
      groupKeys: a.string().array().required(),
      date: a.string().required(),
      durationSec: a.integer(),
    })
    .returns(a.ref('PartnerLogResult'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(partnerLogger)),

  // "Send to TV": the phone writes the live workout state here (~1x/sec) under
  // a short shareable code; the TV page (no login) polls it by that code to
  // render a synced, big-screen display. Guests can only READ — the phone
  // (owner) is the only writer, so a TV can't be hijacked to control playback.
  LiveSession: a
    .model({
      code: a.string().required(),
      phaseType: a.string(), // 'prep' | 'on' | 'rest' | 'done'
      exerciseName: a.string(),
      exerciseId: a.string(),
      groupName: a.string(),
      secondsLeft: a.integer(),
      // Wall-clock epoch ms when the current phase ends. The TV counts down
      // from its OWN clock against this, so network latency doesn't skew the
      // display (secondsLeft alone always trails by the publish+push delay).
      phaseEndsAt: a.float(),
      totalSeconds: a.integer(),
      round: a.integer(),
      totalRounds: a.integer(),
      status: a.string(), // 'running' | 'paused' | 'finished'
      musicYtId: a.string(),
      musicKind: a.string(), // 'playlist' | 'video'
      musicLabel: a.string(),
      musicPlaying: a.boolean(),
      videoYtId: a.string(), // current exercise's demo clip (resolved on the phone)
      videoStart: a.integer(),
    })
    .identifier(['code'])
    .authorization((allow) => [allow.owner(), allow.guest().to(['read'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // Per-user owner auth requires the Cognito user pool as the default mode.
    defaultAuthorizationMode: 'userPool',
  },
});

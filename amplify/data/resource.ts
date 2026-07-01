import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { checkInAnalyzer } from '../functions/check-in-analyzer/resource';
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
      plan: a.enum(['lean', 'bulk']),
      startDate: a.date(),
      currentDay: a.integer().default(1), // 1..30 within the Month-1 cycle
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
      dayNumber: a.integer().required(), // 1..30
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
    })
    .returns(a.ref('CheckInAnalysis'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(checkInAnalyzer)),

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
      totalSeconds: a.integer(),
      round: a.integer(),
      totalRounds: a.integer(),
      status: a.string(), // 'running' | 'paused' | 'finished'
      musicYtId: a.string(),
      musicKind: a.string(), // 'playlist' | 'video'
      musicLabel: a.string(),
      musicPlaying: a.boolean(),
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

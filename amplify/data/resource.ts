import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { checkInAnalyzer } from '../functions/check-in-analyzer/resource';

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
      completed: a.boolean().default(false),
      durationSec: a.integer(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  // Monthly progress check-in: a photo + optional measurements + AI analysis.
  CheckIn: a
    .model({
      date: a.date().required(),
      kind: a.enum(['onboarding', 'monthly']),
      photoPath: a.string().required(), // S3 key under photos/{identity}/...
      weightKg: a.float(),
      aiBodyFatPct: a.float(),
      aiSummary: a.string(),
      aiRaw: a.json(),
      analyzed: a.boolean().default(false),
    })
    .authorization((allow) => [allow.owner()]),

  // Shape returned by the AI analysis mutation.
  CheckInAnalysis: a.customType({
    bodyFatPct: a.float(),
    summary: a.string(),
    estimatedWeightNote: a.string(),
    raw: a.json(),
  }),

  // Custom mutation: hand it the S3 path of an uploaded photo; it calls Bedrock
  // (Claude vision) to estimate body composition and returns a structured result.
  analyzeCheckIn: a
    .mutation()
    .arguments({ photoPath: a.string().required() })
    .returns(a.ref('CheckInAnalysis'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(checkInAnalyzer)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // Per-user owner auth requires the Cognito user pool as the default mode.
    defaultAuthorizationMode: 'userPool',
  },
});

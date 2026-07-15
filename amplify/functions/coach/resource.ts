import { defineFunction } from '@aws-amplify/backend';

/** One-sentence daily encouragement for the Today screen. Sonnet-class model:
 *  this is the most-seen AI text in the app (every day, top of Today) and it
 *  must read natively warm in 16 languages; at ~1 short call per user per day
 *  the cost difference vs a smaller model is negligible. */
export const coach = defineFunction({
  name: 'coach',
  entry: './handler.ts',
  timeoutSeconds: 20,
  resourceGroupName: 'data',
  environment: {
    COACH_MODEL_ID: 'global.anthropic.claude-sonnet-5',
  },
});

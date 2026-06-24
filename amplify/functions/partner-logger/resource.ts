import { defineFunction } from '@aws-amplify/backend';

/**
 * Writes a completed WorkoutLog onto a LINKED partner's calendar (cross-account).
 * Mutual-consent check + Cognito email lookup + DDB writes happen in the handler;
 * table names, user pool id, and IAM grants are attached in amplify/backend.ts.
 * Pinned to the data stack (it's a data resolver) to avoid a circular dependency.
 */
export const partnerLogger = defineFunction({
  name: 'partner-logger',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 30,
  memoryMB: 256,
});

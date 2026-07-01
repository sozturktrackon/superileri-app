import { defineFunction } from '@aws-amplify/backend';

/**
 * Lambda that reads a progress photo from S3 and asks Bedrock (Claude vision)
 * for a rough body-composition estimate. IAM grants for Bedrock + the photos
 * bucket, and the BEDROCK_MODEL_ID / PHOTOS_BUCKET env vars, are attached in
 * amplify/backend.ts (they need the resolved bucket + region).
 */
export const checkInAnalyzer = defineFunction({
  name: 'check-in-analyzer',
  entry: './handler.ts',
  // Used as a data resolver AND granted storage read access — pin it to the
  // data stack to avoid a circular dependency between the nested stacks.
  resourceGroupName: 'data',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    // Claude Sonnet 5 via the global inference profile (verified accessible).
    BEDROCK_MODEL_ID: 'global.anthropic.claude-sonnet-5',
  },
});

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
// Copied from the repo root by the `sync:config` npm script before dev/build.
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);

/** Typed Data client for all CRUD + the analyzeCheckIn mutation. */
export const client = generateClient<Schema>();

export type { Schema };

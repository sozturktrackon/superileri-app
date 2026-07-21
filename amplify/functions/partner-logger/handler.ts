import { randomUUID } from 'node:crypto';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Schema } from '../../data/resource';

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const USER_POOL_ID = process.env.USER_POOL_ID!;
const PARTNER_TABLE = process.env.PARTNER_TABLE!;
const WORKOUTLOG_TABLE = process.env.WORKOUTLOG_TABLE!;
const USERPROFILE_TABLE = process.env.USERPROFILE_TABLE!;

// Mirror of the frontend plan lengths (content/calendars.json).
const PLAN_LENGTHS: Record<string, number> = { lean: 28, bulk: 30, lean2: 28, bulk2: 30 };

const cognito = new CognitoIdentityProviderClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const ok = (message: string) => ({ ok: true, message });
const fail = (message: string) => ({ ok: false, message });

export const handler: Schema['logForPartner']['functionHandler'] = async (
  event
) => {
  const identity = event.identity as { claims?: Record<string, unknown> } | null;
  const callerEmail = String(identity?.claims?.email ?? '').toLowerCase();
  if (!callerEmail) return fail('Could not determine your account.');

  const partnerEmail = event.arguments.partnerEmail.trim().toLowerCase();
  if (partnerEmail === callerEmail) return fail("That's your own account.");

  // 1. Find the partner's Cognito account by email.
  const users = await cognito.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${partnerEmail}"`,
      Limit: 1,
    })
  );
  const user = users.Users?.[0];
  if (!user?.Username) return fail(`No hop30 account found for ${partnerEmail}.`);
  const sub = user.Attributes?.find((a) => a.Name === 'sub')?.Value;
  if (!sub) return fail('Partner account is missing an id.');
  const partnerOwner = `${sub}::${user.Username}`;

  // 2. Consent: the partner must have added YOU (by email) as a partner.
  const consent = await ddb.send(
    new ScanCommand({
      TableName: PARTNER_TABLE,
      FilterExpression: '#o = :o AND #e = :e',
      ExpressionAttributeNames: { '#o': 'owner', '#e': 'email' },
      ExpressionAttributeValues: { ':o': partnerOwner, ':e': callerEmail },
      Limit: 1,
    })
  );
  if (!consent.Items?.length) {
    return fail(
      `${partnerEmail} hasn't added you as a partner yet. Ask them to add ${callerEmail} in Progress -> Partners.`
    );
  }

  // 3. The log belongs to the PARTNER's current cycle, not the caller's.
  let cycle = 1;
  try {
    const prof = await ddb.send(
      new ScanCommand({
        TableName: USERPROFILE_TABLE,
        FilterExpression: '#o = :o',
        ExpressionAttributeNames: { '#o': 'owner' },
        ExpressionAttributeValues: { ':o': partnerOwner },
      })
    );
    const item = prof.Items?.[0];
    const raw = Number(item?.currentDay ?? 1);
    const len = PLAN_LENGTHS[String(item?.plan ?? 'lean')] ?? 28;
    cycle = Math.floor((raw - 1) / len) + 1;
  } catch {
    /* default to cycle 1 rather than failing the log */
  }

  // 4. Write the completed WorkoutLog onto the partner's calendar.
  const now = new Date().toISOString();
  await ddb.send(
    new PutCommand({
      TableName: WORKOUTLOG_TABLE,
      Item: {
        id: randomUUID(),
        __typename: 'WorkoutLog',
        owner: partnerOwner,
        date: event.arguments.date,
        planId: event.arguments.planId,
        dayNumber: event.arguments.dayNumber,
        cycle,
        groupKeys: event.arguments.groupKeys,
        participants: [partnerEmail],
        completed: true,
        durationSec: event.arguments.durationSec ?? null,
        notes: `Logged together by ${callerEmail}`,
        createdAt: now,
        updatedAt: now,
      },
    })
  );

  return ok(`Marked complete for ${partnerEmail}.`);
};

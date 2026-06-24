import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { checkInAnalyzer } from './functions/check-in-analyzer/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  checkInAnalyzer,
});

const region = backend.stack.region;
const account = backend.stack.account;
const photosBucket = backend.storage.resources.bucket;
const analyzerFn = backend.checkInAnalyzer.resources.lambda as LambdaFunction;

// The analyzer needs the bucket name at runtime.
analyzerFn.addEnvironment('PHOTOS_BUCKET', photosBucket.bucketName);

// Allow the analyzer to invoke Claude on Bedrock. The model is the GLOBAL
// inference profile (global.anthropic.claude-opus-4-8), which routes across
// regions — so grant the profile ARN plus foundation models in every region.
analyzerFn.addToRolePolicy(
  new PolicyStatement({
    actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
    resources: [
      `arn:aws:bedrock:*::foundation-model/anthropic.*`,
      `arn:aws:bedrock:${region}:${account}:inference-profile/global.*`,
      `arn:aws:bedrock:${region}:${account}:inference-profile/*anthropic.*`,
    ],
  })
);

// Read access to progress photos (granted on the role here, not in storage, to
// keep the data->storage dependency one-directional and avoid a cycle).
analyzerFn.addToRolePolicy(
  new PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [`${photosBucket.bucketArn}/photos/*`],
  })
);

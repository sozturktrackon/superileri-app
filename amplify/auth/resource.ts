import { defineAuth } from '@aws-amplify/backend';

/**
 * Email login. Sign-up collects a preferred name; the full-body "first selfie"
 * is captured by the frontend right after first sign-in (stored in S3 + a CheckIn record).
 * @see https://docs.amplify.aws/react/build-a-backend/auth/
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    preferredUsername: { required: false, mutable: true },
    givenName: { required: false, mutable: true },
  },
});

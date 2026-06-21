import { defineStorage } from '@aws-amplify/backend';

/**
 * S3 storage:
 *  - photos/{entity_id}/*  Private progress photos. Each user can only touch
 *                          their own folder (entity_id = their Cognito identity).
 *  - videos/*              Exercise demo videos. Readable by any signed-in user;
 *                          you upload/replace them yourself (CLI/console/script).
 *
 * The check-in analyzer Lambda's S3 read access is granted directly on its IAM
 * role in amplify/backend.ts (not here) to avoid a circular stack dependency.
 */
export const storage = defineStorage({
  name: 'superileriMedia',
  access: (allow) => ({
    'photos/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'videos/*': [allow.authenticated.to(['read']), allow.guest.to(['read'])],
  }),
});

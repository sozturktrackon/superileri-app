#!/usr/bin/env python3
"""
Superileri Fit: migrate selected users from the OLD (sandbox) stack to the
NEW dedicated-account stack.

What it does, per user in USERS:
  1. DynamoDB: copies rows from every app table, rewriting the `owner`
     field from <old_sub>::<old_sub> to <new_sub>::<new_sub>.
  2. S3: copies progress photos from the old bucket's
     photos/<old_identity_id>/... prefix to the new bucket's
     photos/<new_identity_id>/... prefix (download+upload, so no
     cross-account bucket policy is needed).
  3. CheckIn rows: rewrites `photoPath` and the JSON `photos` array so the
     stored keys point at the new identity prefix.

Prerequisites (fill MAPPINGS below before running):
  - New backend deployed (ampx sandbox --once with the NEW profile).
  - Users created in the new Cognito pool AND each has logged in once
    (first login materializes their identity-pool identityId).
  - Old + new table suffixes and bucket names from each amplify_outputs.

Idempotent: re-running overwrites the same items/keys.
DRY_RUN=1 prints what it would do without writing.
"""
import json
import os
import subprocess
import sys
import tempfile

# ---------------------------------------------------------------- config ---
OLD_PROFILE = os.environ.get('OLD_PROFILE', 'sandbox')
NEW_PROFILE = os.environ.get('NEW_PROFILE')  # REQUIRED, e.g. 'superileri'
REGION = 'us-east-1'
DRY_RUN = os.environ.get('DRY_RUN') == '1'

OLD_SUFFIX = 'hhiec3u7t5egrmwioojuiu7pmi-NONE'
NEW_SUFFIX = os.environ.get('NEW_SUFFIX')  # from new amplify_outputs / table names

OLD_BUCKET = 'amplify-superileriapp-mur-superilerimediabucket90f-zwnsed0jcu3u'
NEW_BUCKET = os.environ.get('NEW_BUCKET')

TABLES = ['UserProfile', 'WorkoutLog', 'CheckIn', 'Partner']  # LiveSession is ephemeral: skip

# Per-user mapping: fill new_sub after creating users in the new pool,
# new_identity after their first login (cognito-identity list-identities).
USERS = {
    'mso@outlook.com': {
        'old_sub': 'f418f478-f0d1-7065-1143-34bbb83cd9a2',
        'new_sub': '94488478-3001-7029-674e-9f8dd79ecc97',
        'old_identity': None,  # auto-discovered from CheckIn photoPath
        'new_identity': 'us-east-1:a88d8814-d7ae-c0c6-36f4-f8b233d81dbe',
    },
    'anna11@outlook.com': {
        'old_sub': 'c4f834c8-3071-7031-8c09-2b0f1b8ca5d4',
        'new_sub': '94386428-70b1-7097-565e-c07977edc5cd',
        'old_identity': None,
        'new_identity': 'us-east-1:a88d8814-d79d-c351-1d76-c246fe8c0f4e',
    },
}
# ---------------------------------------------------------------------------


def aws(profile, *args, expect_json=True):
    cmd = ['aws', *args, '--profile', profile, '--region', REGION]
    r = subprocess.run(cmd, capture_output=True, text=True,
                       env={**os.environ, 'AWS_REGION': REGION})
    if r.returncode != 0:
        raise RuntimeError(f"aws {' '.join(args[:3])}... failed: {r.stderr[:300]}")
    return json.loads(r.stdout) if expect_json and r.stdout.strip() else None


def scan_table(profile, table):
    items, token = [], None
    while True:
        args = ['dynamodb', 'scan', '--table-name', table]
        if token:
            args += ['--exclusive-start-key', json.dumps(token)]
        page = aws(profile, *args)
        items += page.get('Items', [])
        token = page.get('LastEvaluatedKey')
        if not token:
            return items


def discover_old_identity(sub, checkins):
    """photoPath looks like photos/<identityId>/<file>; find it per user."""
    for it in checkins:
        if it.get('owner', {}).get('S', '').startswith(sub):
            path = it.get('photoPath', {}).get('S')
            if path and path.startswith('photos/'):
                return path.split('/')[1]
    return None


def rewrite_item(item, mapping):
    """Deep-rewrite subs and identity ids in every string of the item."""
    s = json.dumps(item)
    for u in mapping.values():
        s = s.replace(u['old_sub'], u['new_sub'])
        if u['old_identity'] and u['new_identity']:
            s = s.replace(u['old_identity'], u['new_identity'])
    return json.loads(s)


def main():
    assert NEW_PROFILE and NEW_SUFFIX and NEW_BUCKET, \
        'Set NEW_PROFILE, NEW_SUFFIX, NEW_BUCKET env vars first.'
    for email, u in USERS.items():
        assert u['new_sub'] and u['new_identity'], \
            f'Fill new_sub/new_identity for {email} in USERS first.'

    old_subs = {u['old_sub'] for u in USERS.values()}

    # discover old identity ids from CheckIn photo paths
    checkins = scan_table(OLD_PROFILE, f'CheckIn-{OLD_SUFFIX}')
    for u in USERS.values():
        u['old_identity'] = discover_old_identity(u['old_sub'], checkins)
        print(f"old identity for sub {u['old_sub'][:8]}…: {u['old_identity']}")

    # 1) DynamoDB copy with rewrite
    for t in TABLES:
        items = scan_table(OLD_PROFILE, f'{t}-{OLD_SUFFIX}')
        mine = [i for i in items
                if i.get('owner', {}).get('S', '').split('::')[0] in old_subs]
        print(f'{t}: {len(mine)}/{len(items)} rows to migrate')
        for item in mine:
            new_item = rewrite_item(item, USERS)
            if DRY_RUN:
                continue
            aws(NEW_PROFILE, 'dynamodb', 'put-item',
                '--table-name', f'{t}-{NEW_SUFFIX}',
                '--item', json.dumps(new_item), expect_json=False)
        print(f'{t}: done')

    # 2) S3 photos copy with prefix rewrite
    with tempfile.TemporaryDirectory() as tmp:
        for email, u in USERS.items():
            if not u['old_identity']:
                print(f'{email}: no photos found, skipping S3')
                continue
            listing = aws(OLD_PROFILE, 's3api', 'list-objects-v2',
                          '--bucket', OLD_BUCKET,
                          '--prefix', f"photos/{u['old_identity']}/")
            keys = [o['Key'] for o in (listing or {}).get('Contents', [])]
            print(f'{email}: {len(keys)} photos')
            for key in keys:
                new_key = key.replace(u['old_identity'], u['new_identity'])
                if DRY_RUN:
                    print(f'  {key} -> {new_key}')
                    continue
                local = os.path.join(tmp, 'obj')
                aws(OLD_PROFILE, 's3api', 'get-object', '--bucket', OLD_BUCKET,
                    '--key', key, local, expect_json=True)
                aws(NEW_PROFILE, 's3api', 'put-object', '--bucket', NEW_BUCKET,
                    '--key', new_key, '--body', local,
                    '--content-type', 'image/jpeg', expect_json=True)
    print('MIGRATION COMPLETE' + (' (dry run)' if DRY_RUN else ''))


if __name__ == '__main__':
    main()

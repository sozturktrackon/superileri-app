#!/usr/bin/env bash
# Build the web app and deploy it to Amplify Hosting (manual deploy, no GitHub).
# Idempotent: reuses the existing "superileri-fit" app if present, else creates it.
set -euo pipefail

APP_NAME="superileri-fit"
BRANCH="main"
PROFILE="${AWS_PROFILE:-sandbox}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="$AWS_REGION"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ Building web app…"
( cd web && npm run build >/dev/null )

echo "▶ Resolving Amplify app…"
APP_ID="$(aws amplify list-apps --profile "$PROFILE" \
  --query "apps[?name=='$APP_NAME'].appId | [0]" --output text)"
if [ "$APP_ID" = "None" ] || [ -z "$APP_ID" ]; then
  echo "  creating app $APP_NAME…"
  APP_ID="$(aws amplify create-app --name "$APP_NAME" --platform WEB \
    --profile "$PROFILE" --query "app.appId" --output text)"
  aws amplify create-branch --app-id "$APP_ID" --branch-name "$BRANCH" \
    --framework "React - Vite" --stage PRODUCTION --profile "$PROFILE" >/dev/null
fi
echo "  app: $APP_ID"

echo "▶ Zipping build…"
ZIP="$(mktemp -t superileri_site_XXXX).zip"
( cd web/dist && zip -rq "$ZIP" . )

echo "▶ Creating deployment…"
DEP="$(aws amplify create-deployment --app-id "$APP_ID" --branch-name "$BRANCH" \
  --profile "$PROFILE" --output json)"
URL="$(echo "$DEP" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).zipUploadUrl))")"
JOB="$(echo "$DEP" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).jobId))")"

echo "▶ Uploading artifact…"
curl -s -X PUT -H "Content-Type: application/zip" --upload-file "$ZIP" "$URL" \
  -o /dev/null -w "  upload HTTP %{http_code}\n"

echo "▶ Starting deployment (job $JOB)…"
aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH" \
  --job-id "$JOB" --profile "$PROFILE" >/dev/null

printf "▶ Waiting"
while true; do
  S="$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH" \
    --job-id "$JOB" --profile "$PROFILE" --query "job.summary.status" --output text)"
  case "$S" in
    SUCCEED) echo " ✓"; break ;;
    FAILED|CANCELLED) echo " ✗ ($S)"; exit 1 ;;
    *) printf "."; sleep 5 ;;
  esac
done
rm -f "$ZIP"

echo ""
echo "✅ Live: https://$BRANCH.$APP_ID.amplifyapp.com"

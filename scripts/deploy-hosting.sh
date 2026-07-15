#!/usr/bin/env bash
# Build the web app and deploy it to Amplify Hosting (manual deploy, no GitHub).
# Targets the canonical app/region explicitly so it never creates a duplicate.
set -euo pipefail

APP_ID="${APP_ID:-d2tkdh7wcv3ggv}"   # canonical Amplify Hosting app (fitness account, us-east-1)
BRANCH="main"
PROFILE="${AWS_PROFILE:-fitness}"
REGION="us-east-1"                   # pinned: your shell defaults to ap-south-1
export AWS_REGION="$REGION"
export AWS_DEFAULT_REGION="$REGION"

aws() { command aws "$@" --profile "$PROFILE" --region "$REGION"; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building web app ..."
( cd web && npm run build >/dev/null )

echo "App: $APP_ID  (branch $BRANCH, region $REGION)"

echo "Zipping build ..."
ZIP="$(mktemp -t superileri_site_XXXX).zip"
( cd web/dist && zip -rq "$ZIP" . )

echo "Creating deployment ..."
DEP="$(aws amplify create-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --output json)"
URL="$(echo "$DEP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).zipUploadUrl))')"
JOB="$(echo "$DEP" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).jobId))')"

echo "Uploading artifact ..."
curl -s -X PUT -H "Content-Type: application/zip" --upload-file "$ZIP" "$URL" \
  -o /dev/null -w "  upload HTTP %{http_code}\n"

echo "Starting deployment (job $JOB) ..."
aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB" >/dev/null

printf "Waiting"
while true; do
  S="$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB" --query "job.summary.status" --output text)"
  case "$S" in
    SUCCEED) echo " done"; break ;;
    FAILED|CANCELLED) echo " FAILED ($S)"; exit 1 ;;
    *) printf "."; sleep 5 ;;
  esac
done
rm -f "$ZIP"

echo ""
echo "Live: https://$BRANCH.$APP_ID.amplifyapp.com"

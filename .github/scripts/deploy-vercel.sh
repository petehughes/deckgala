#!/usr/bin/env bash
set -euo pipefail

app_directory="${1:?Pass the app workspace path}"
project_id="${PROJECT_ID:?Set PROJECT_ID to the Vercel project ID}"

mkdir -p "$app_directory/.vercel"
printf '{"orgId":"%s","projectId":"%s"}\n' "$VERCEL_ORG_ID" "$project_id" > "$app_directory/.vercel/project.json"

cd "$app_directory"
bunx vercel pull --yes --environment=production --token "$VERCEL_TOKEN"
bunx vercel build --prod --token "$VERCEL_TOKEN"
bunx vercel deploy --prebuilt --prod --token "$VERCEL_TOKEN"

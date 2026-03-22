#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 /path/to/your-cert.pfx pfx-password [SECRET_BASE_NAME] [repo] [--yes]"
  exit 2
fi

PFX_PATH="$1"
PFX_PASSWORD="$2"
SECRET_BASE="${3:-PFX}"
REPO_ARG="${4:-}"
SKIP_CONFIRM=0
if [ "${5:-}" = "--yes" ] || [ "$REPO_ARG" = "--yes" ]; then
  SKIP_CONFIRM=1
  if [ "$REPO_ARG" = "--yes" ]; then REPO_ARG=""; fi
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI: https://cli.github.com/" >&2
  exit 1
fi

if [ ! -f "$PFX_PATH" ]; then
  echo "PFX file not found: $PFX_PATH" >&2
  exit 1
fi

if [ $SKIP_CONFIRM -eq 0 ]; then
  echo "About to set secrets '${SECRET_BASE}_BASE64' and '${SECRET_BASE}_PASSWORD' in repository: ${REPO_ARG:-current repo}"
  read -p "Proceed? (y/N) " yn
  case "$yn" in
    [Yy]*) ;;
    *) echo "Aborted by user."; exit 3;;
  esac
fi

TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

base64 -w 0 "$PFX_PATH" > "$TMPFILE"

echo "Setting GitHub secret ${SECRET_BASE}_BASE64..."
if [ -n "$REPO_ARG" ]; then
  gh secret set "${SECRET_BASE}_BASE64" --body "$(cat "$TMPFILE")" --repo "$REPO_ARG"
else
  gh secret set "${SECRET_BASE}_BASE64" --body "$(cat "$TMPFILE")"
fi

echo "Setting GitHub secret ${SECRET_BASE}_PASSWORD..."
if [ -n "$REPO_ARG" ]; then
  gh secret set "${SECRET_BASE}_PASSWORD" --body "$PFX_PASSWORD" --repo "$REPO_ARG"
else
  gh secret set "${SECRET_BASE}_PASSWORD" --body "$PFX_PASSWORD"
fi

echo "Done. Secrets set in the target repository."
echo "Note: to set secrets for a different repo, pass the repo as the 4th argument (owner/repo). Use --yes to skip confirmation."

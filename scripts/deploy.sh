#!/usr/bin/env bash
# Deploy Bull Run to GitHub Pages.
#
# Prereqs (one-time):
#   1. gh CLI installed     (brew install gh)
#   2. authenticated with gh (gh auth login)
#
# Then just:
#   ./scripts/deploy.sh
#
# Idempotent: safe to re-run. On first run, creates the GitHub repo, pushes,
# enables Pages with GitHub Actions as the source, and waits for the live URL.

set -euo pipefail

REPO_NAME="tradinggame"
DEFAULT_VISIBILITY="public"   # GitHub Pages free tier requires public repo

cd "$(dirname "$0")/.."

# --- 1. Ensure gh is installed + authed -----------------------------------
if ! command -v gh >/dev/null 2>&1; then
  echo "✗ gh CLI not found. Install with: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "✗ Not logged in. Run: gh auth login"
  exit 1
fi

GH_USER="$(gh api user --jq .login)"
echo "→ Authed as $GH_USER"

# --- 2. Ensure git repo + initial commit ----------------------------------
if [[ ! -d .git ]]; then
  echo "→ git init"
  git init -q
  git branch -M main
fi

if [[ -z "$(git log --oneline 2>/dev/null || true)" ]]; then
  echo "→ first commit"
  git add .
  git commit -q -m "Initial commit"
fi

# --- 3. Ensure GitHub repo exists -----------------------------------------
if gh repo view "$GH_USER/$REPO_NAME" >/dev/null 2>&1; then
  echo "→ repo $GH_USER/$REPO_NAME already exists"
else
  echo "→ creating repo $GH_USER/$REPO_NAME ($DEFAULT_VISIBILITY)"
  gh repo create "$GH_USER/$REPO_NAME" --"$DEFAULT_VISIBILITY" --source=. --remote=origin --push
fi

# Ensure remote is wired even if repo existed
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
fi

git push -u origin main || true

# --- 4. Enable GitHub Pages with Actions as source ------------------------
echo "→ enabling Pages with build_type=workflow"
gh api -X POST "repos/$GH_USER/$REPO_NAME/pages" \
  -f build_type=workflow >/dev/null 2>&1 || \
gh api -X PUT "repos/$GH_USER/$REPO_NAME/pages" \
  -f build_type=workflow >/dev/null 2>&1 || true

# --- 5. Trigger first deploy if needed ------------------------------------
echo "→ kicking the deploy workflow"
gh workflow run deploy.yml --repo "$GH_USER/$REPO_NAME" >/dev/null 2>&1 || true

# --- 6. Wait for the latest run to complete -------------------------------
echo "→ waiting for build to finish (this can take 1–3 minutes)"
sleep 5
RUN_ID="$(gh run list --repo "$GH_USER/$REPO_NAME" --workflow=deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
if [[ -n "$RUN_ID" ]]; then
  gh run watch "$RUN_ID" --repo "$GH_USER/$REPO_NAME" --exit-status || true
fi

# --- 7. Print the URL -----------------------------------------------------
PAGES_URL="$(gh api "repos/$GH_USER/$REPO_NAME/pages" --jq .html_url 2>/dev/null || true)"
if [[ -z "$PAGES_URL" ]]; then
  PAGES_URL="https://$GH_USER.github.io/$REPO_NAME/"
fi

echo
echo "─────────────────────────────────────────────"
echo " ✓ Bull Run is live:"
echo "    $PAGES_URL"
echo "─────────────────────────────────────────────"
echo
echo " Push to main from now on to redeploy:"
echo "    git push"
echo

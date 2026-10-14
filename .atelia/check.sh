#!/bin/sh
# ATELIA setup check. Run from the team repository: sh .atelia/check.sh
# Prints one PASS / FAIL / WARN line per check, then a verdict, then a
# diagnostic block to send to ATELIA if something failed. Changes nothing.
# Windows without Git Bash: powershell -ExecutionPolicy Bypass -File .atelia/check.ps1

FAILS=0
pass() { printf 'PASS  %s\n' "$1"; }
fail() { printf 'FAIL  %s\n      -> %s\n' "$1" "$2"; FAILS=$((FAILS + 1)); }
warn() { printf 'WARN  %s\n      -> %s\n' "$1" "$2"; }

echo "ATELIA setup check"
echo

# 1. git
if command -v git >/dev/null 2>&1; then
  pass "git: $(git --version 2>/dev/null)"
else
  fail "git is not installed" "Mac: run xcode-select --install. Windows: install Git for Windows (git-scm.com), default options. Then open a new terminal."
fi

# 2. Node.js and npm
if command -v node >/dev/null 2>&1; then
  NV=$(node -v 2>/dev/null)
  MAJOR=$(printf '%s' "$NV" | sed 's/^v//; s/\..*//')
  if [ "${MAJOR:-0}" -ge 20 ] 2>/dev/null; then pass "Node.js: $NV"; else fail "Node.js $NV is too old" "Install the LTS version from nodejs.org, then open a new terminal."; fi
else
  fail "Node.js is not installed" "Install the LTS version from nodejs.org (default options), then open a new terminal."
fi
if command -v npm >/dev/null 2>&1 && npm -v >/dev/null 2>&1; then
  pass "npm: $(npm -v 2>/dev/null)"
else
  fail "npm does not run" "Windows: run Set-ExecutionPolicy -Scope CurrentUser RemoteSigned in PowerShell once. Otherwise reinstall Node.js."
fi

# 3. The team repository
ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
REMOTE=$(git remote get-url origin 2>/dev/null)
case "$REMOTE" in
  *github.com[:/]ateliaworkshop-ai/*) REPO="${REMOTE##*[:/]ateliaworkshop-ai/}"; pass "Team repository: ${REPO%.git}" ;;
  "") fail "This folder is not your team repository" "Start the agent inside the folder the setup prompt cloned (atelia/<your repository>)." ;;
  *) fail "This repository is not an ATELIA team repository ($REMOTE)" "Start the agent inside the folder the setup prompt cloned." ;;
esac

# 4. Who you are
NAME=$(git config user.name 2>/dev/null)
EMAIL=$(git config user.email 2>/dev/null)
LOGIN=$(git config github.user 2>/dev/null)
[ -n "$NAME" ] && pass "Name: $NAME" || fail "git user.name is not set" "Paste the setup prompt again."
[ -n "$EMAIL" ] && pass "Email: $EMAIL" || fail "git user.email is not set" "Paste the setup prompt again."
[ -n "$LOGIN" ] && pass "GitHub login: $LOGIN" || fail "git github.user is not set" "Paste the setup prompt again."

# 5. Your own branch
BRANCH=$(git symbolic-ref --short -q HEAD 2>/dev/null)
LOWER=$(printf '%s' "$LOGIN" | tr 'A-Z' 'a-z')
if [ -z "$BRANCH" ]; then
  fail "No branch checked out" "Ask your agent: switch to my own branch."
elif [ "$BRANCH" = "main" ]; then
  fail "You are on main" "Ask your agent: switch to my own branch, named after my GitHub login."
elif [ "$(printf '%s' "$BRANCH" | tr 'A-Z' 'a-z')" = "$LOWER" ]; then
  pass "Branch: $BRANCH"
else
  warn "Branch $BRANCH is not named after your GitHub login" "Fine if your team agreed on it."
fi

# 6. GitHub lets this computer in, without a password prompt
if [ -n "$REMOTE" ] && GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="ssh -o BatchMode=yes" git ls-remote --heads origin >/dev/null 2>&1; then
  pass "GitHub access: this computer reaches your repository, no password asked"
else
  fail "GitHub does not let this computer in" "Paste the setup prompt again: it connects GitHub (browser sign-in on Windows, an SSH key on Mac). Accepted the invitation on your ATELIA team page?"
fi

# 7. The prompt log caught this message
HANDLE="${ATELIA_HANDLE:-$LOGIN}"
[ -n "$HANDLE" ] || HANDLE="${EMAIL%%@*}"
HANDLE=$(printf '%s' "$HANDLE" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9._-' '-' | cut -c1-40)
LOG="${ROOT:-.}/prompts/$HANDLE-$(date +%Y-%m-%d).jsonl"
if [ -f "$LOG" ] && tail -n 1 "$LOG" | grep -q "ATELIA setup check"; then
  pass "Prompt log: your message is in prompts/$(basename "$LOG")"
elif [ -f "$LOG" ]; then
  fail "Prompt log: your last message is not the setup check" "Send the check prompt again, as a new message."
else
  fail "Prompt log: nothing saved today" "Claude: quit, start again inside this folder, accept \"trust this folder\". Codex: type /hooks, approve the ATELIA hook. Then send the check prompt again."
fi

# 8. Not in a synced folder
case "${ROOT:-$(pwd)}" in
  *OneDrive*|*Dropbox*|*"Mobile Documents"*|*iCloud*) warn "Your repository is in a synced folder (${ROOT})" "Syncing can lock or duplicate files. Move it to atelia in your home folder." ;;
  *) pass "Folder: ${ROOT:-$(pwd)}" ;;
esac

# 9. The ATELIA files are the latest (the check prompt brings them from main first)
MINE=$(tr -d ' \r\n' < "${ROOT:-.}/.atelia/VERSION" 2>/dev/null)
MAIN=$(git show origin/main:.atelia/VERSION 2>/dev/null | tr -d ' \r\n')
if [ -z "$MINE" ]; then
  fail "ATELIA files: no version on this branch" "Paste the check prompt from your ATELIA team page: it brings the latest files from main."
elif [ -n "$MAIN" ] && [ "$MAIN" != "$MINE" ]; then
  fail "ATELIA files: version $MINE here, $MAIN on main" "Paste the check prompt from your ATELIA team page: it brings the latest files from main."
else
  pass "ATELIA files: version $MINE"
fi

echo
if [ "$FAILS" -eq 0 ]; then
  echo "ATELIA: your computer is ready. Commit and push prompts/, then look for this message on your team page."
else
  echo "ATELIA: $FAILS check(s) failed. Fix them as shown above, or send everything from \"ATELIA setup check\" down to contact@ateliaworkshop.ai."
fi
echo
echo "--- diagnostic ---"
echo "system: $(uname -s 2>/dev/null) $(uname -r 2>/dev/null) $(uname -m 2>/dev/null)"
echo "shell: ${SHELL:-unknown}"
echo "git: $(git --version 2>/dev/null) / node: $(node -v 2>/dev/null) / npm: $(npm -v 2>/dev/null)"
echo "remote: $REMOTE"
echo "branch: $BRANCH"
echo "atelia files: ${MINE:-none} (main: ${MAIN:-unknown})"
[ "$FAILS" -eq 0 ]

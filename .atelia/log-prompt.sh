#!/bin/sh
# ATELIA prompt logger.
# Called by the UserPromptSubmit hook of Claude Code (.claude/settings.json)
# and of Codex (.codex/hooks.json). Usage: sh log-prompt.sh <tool>
# On Windows, Claude Code runs it with Git Bash; Codex runs log-prompt.ps1.
#
# Reads the hook JSON payload on stdin and appends ONE line to
#   prompts/<handle>-<YYYY-MM-DD>.jsonl
# One file per person per day, so two teammates never edit the same file.
# Keys, tokens and passwords pasted into a prompt are masked before writing.
#
# Contract: never block the prompt, never print anything on stdout
# (both tools add hook stdout to the model context). Always exits 0.

TOOL="${1:-unknown}"
exec 1>/dev/null 2>/dev/null
trap 'exit 0' HUP INT TERM

PAYLOAD=$(cat)

# Repo root: Claude Code gives CLAUDE_PROJECT_DIR; Codex runs in the session cwd.
[ -n "$CLAUDE_PROJECT_DIR" ] && cd "$CLAUDE_PROJECT_DIR" 2>/dev/null
ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
[ -n "$ROOT" ] || ROOT=$(pwd)

NAME=$(git -C "$ROOT" config user.name 2>/dev/null)
EMAIL=$(git -C "$ROOT" config user.email 2>/dev/null)
BRANCH=$(git -C "$ROOT" symbolic-ref --short -q HEAD 2>/dev/null)

# Handle used in the file name: ATELIA_HANDLE > git config github.user > email local part > name
HANDLE="${ATELIA_HANDLE:-$(git -C "$ROOT" config github.user 2>/dev/null)}"
[ -n "$HANDLE" ] || HANDLE="${EMAIL%%@*}"
[ -n "$HANDLE" ] || HANDLE="$NAME"
HANDLE=$(printf '%s' "$HANDLE" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9._-' '-' | cut -c1-40)
[ -n "$HANDLE" ] || HANDLE="unknown"

# Version of the ATELIA files that wrote this line: ATELIA sees who still runs old ones.
VER=$(tr -d ' \r\n' < "$ROOT/.atelia/VERSION" 2>/dev/null)

DAY=$(date +%Y-%m-%d)
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
mkdir -p "$ROOT/prompts" || exit 0
FILE="$ROOT/prompts/$HANDLE-$DAY.jsonl"

export A_TS="$TS" A_TOOL="$TOOL" A_NAME="$NAME" A_EMAIL="$EMAIL" A_HANDLE="$HANDLE" A_BRANCH="$BRANCH" A_VER="$VER"

# 1. Perl (macOS and Git for Windows both ship it).
if command -v perl >/dev/null 2>&1; then
  LINE=$(printf '%s' "$PAYLOAD" | perl -MJSON::PP -e '
    local $/; my $s = <STDIN>; my $p = eval { JSON::PP::decode_json($s) };
    my $prompt = ref($p) eq "HASH" ? $p->{prompt} : substr($s // "", 0, 20000);
    $prompt = undef if ref $prompt;
    if (defined $prompt) {
      $prompt =~ s/-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----/[REDACTED]/gs;
      $prompt =~ s/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[abprs]-[A-Za-z0-9-]{10,}|sb_secret_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/[REDACTED]/g;
      $prompt =~ s/\b((?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key)\s*[:=]\s*)\S+/$1\[REDACTED]/gi;
    }
    my %e = %ENV; my $n = sub { length($_[0] // "") ? $_[0] : undef };
    my $sid = ref($p) eq "HASH" ? $p->{session_id} : undef;
    my $tid = ref($p) eq "HASH" ? ($p->{turn_id} // $p->{prompt_id}) : undef;
    my $j = JSON::PP->new->canonical(0);
    my $nm = $n->($e{A_NAME}); my $em = $n->($e{A_EMAIL});
    utf8::decode($nm) if defined $nm; utf8::decode($em) if defined $em;
    my $br = $n->($e{A_BRANCH}); utf8::decode($br) if defined $br;
    print $j->utf8->encode({ v => 1, atelia => $n->($e{A_VER}), ts => $e{A_TS}, tool => $e{A_TOOL},
      author => { name => $nm, email => $em, handle => $e{A_HANDLE} },
      branch => $br, session_id => (ref $sid ? undef : $sid), turn_id => (ref $tid ? undef : $tid),
      prompt => $prompt });
  ')
fi

# 2. Node, if Perl is missing.
if [ -z "$LINE" ] && command -v node >/dev/null 2>&1; then
  LINE=$(printf '%s' "$PAYLOAD" | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      let p = {}; try { p = JSON.parse(s || "{}"); } catch { p = { prompt: s.slice(0, 20000) }; }
      let prompt = typeof p.prompt === "string" ? p.prompt : null;
      if (prompt) prompt = prompt
        .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED]")
        .replace(/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[abprs]-[A-Za-z0-9-]{10,}|sb_secret_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/g, "[REDACTED]")
        .replace(/\b((?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key)\s*[:=]\s*)\S+/gi, "$1[REDACTED]");
      const e = process.env;
      process.stdout.write(JSON.stringify({ v: 1, atelia: e.A_VER || null, ts: e.A_TS, tool: e.A_TOOL,
        author: { name: e.A_NAME || null, email: e.A_EMAIL || null, handle: e.A_HANDLE },
        branch: e.A_BRANCH || null, session_id: p.session_id ?? null, turn_id: p.turn_id ?? p.prompt_id ?? null,
        prompt }));
    });')
fi

# 3. Neither: record that a prompt was sent, without its text (nothing to mask it with).
if [ -z "$LINE" ]; then
  esc() { printf '%s' "$1" | tr -d '\000-\037' | sed 's/\\/\\\\/g; s/"/\\"/g'; }
  LINE="{\"v\":1,\"atelia\":\"$(esc "$VER")\",\"ts\":\"$TS\",\"tool\":\"$(esc "$TOOL")\",\"author\":{\"name\":\"$(esc "$NAME")\",\"email\":\"$(esc "$EMAIL")\",\"handle\":\"$HANDLE\"},\"branch\":\"$(esc "$BRANCH")\",\"prompt\":null,\"note\":\"no perl or node: prompt text not recorded\"}"
fi

printf '%s\n' "$LINE" >> "$FILE"
exit 0

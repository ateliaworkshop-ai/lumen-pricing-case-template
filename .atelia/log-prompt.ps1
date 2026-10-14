# ATELIA prompt logger, Windows version (same output as log-prompt.sh).
# Called by the UserPromptSubmit hook of Codex on Windows (.codex/hooks.json, commandWindows):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .atelia/log-prompt.ps1 codex
#
# Reads the hook JSON payload on stdin and appends ONE line to
#   prompts/<handle>-<YYYY-MM-DD>.jsonl
# Keys, tokens and passwords pasted into a prompt are masked before writing.
#
# Contract: never block the prompt, never print anything on stdout. Always exits 0.
param([string]$Tool = "unknown")

try {
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [Console]::InputEncoding = $utf8
  [Console]::OutputEncoding = $utf8
  $payload = [Console]::In.ReadToEnd()

  if ($env:CLAUDE_PROJECT_DIR) { Set-Location -LiteralPath $env:CLAUDE_PROJECT_DIR }
  $root = (git rev-parse --show-toplevel 2>$null)
  if (-not $root) { $root = (Get-Location).Path }

  $name = (git -C $root config user.name 2>$null)
  $email = (git -C $root config user.email 2>$null)
  $branch = (git -C $root symbolic-ref --short -q HEAD 2>$null)

  # Handle used in the file name: ATELIA_HANDLE > git config github.user > email local part > name
  $handle = $env:ATELIA_HANDLE
  if (-not $handle) { $handle = (git -C $root config github.user 2>$null) }
  if (-not $handle -and $email) { $handle = $email.Split("@")[0] }
  if (-not $handle) { $handle = $name }
  $handle = ([string]$handle).ToLowerInvariant() -replace "[^a-z0-9._-]", "-"
  if ($handle.Length -gt 40) { $handle = $handle.Substring(0, 40) }
  if (-not $handle) { $handle = "unknown" }

  # Version of the ATELIA files that wrote this line: ATELIA sees who still runs old ones.
  $ver = $null
  $verFile = Join-Path $root ".atelia/VERSION"
  if (Test-Path -LiteralPath $verFile) { $ver = ((Get-Content -LiteralPath $verFile -Raw) -replace "\s", "") }

  $p = $null
  try { $p = $payload | ConvertFrom-Json } catch { }
  $prompt = $null
  if ($p -and $p.prompt -is [string]) { $prompt = $p.prompt }
  elseif (-not $p -and $payload) { $prompt = $payload.Substring(0, [Math]::Min($payload.Length, 20000)) }

  if ($prompt) {
    $prompt = [regex]::Replace($prompt, "-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----", "[REDACTED]")
    $prompt = [regex]::Replace($prompt, "\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[abprs]-[A-Za-z0-9-]{10,}|sb_secret_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})", "[REDACTED]")
    $prompt = [regex]::Replace($prompt, "(?i)\b((?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key)\s*[:=]\s*)\S+", '$1[REDACTED]')
  }

  function Nz($v) { if ($v) { [string]$v } else { $null } }
  $turn = $null
  if ($p) { $turn = $p.turn_id; if (-not $turn) { $turn = $p.prompt_id } }
  $record = [ordered]@{
    v = 1
    atelia = (Nz $ver)
    ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tool = $Tool
    author = [ordered]@{ name = (Nz $name); email = (Nz $email); handle = $handle }
    branch = (Nz $branch)
    session_id = $(if ($p) { Nz $p.session_id } else { $null })
    turn_id = (Nz $turn)
    prompt = $prompt
  }
  $line = $record | ConvertTo-Json -Compress -Depth 4

  $dir = Join-Path $root "prompts"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $file = Join-Path $dir ("{0}-{1}.jsonl" -f $handle, (Get-Date).ToString("yyyy-MM-dd"))
  [System.IO.File]::AppendAllText($file, $line + "`n", $utf8)
} catch { }
exit 0

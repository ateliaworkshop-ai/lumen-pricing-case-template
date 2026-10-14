# ATELIA setup check, Windows PowerShell version (same checks as check.sh).
# Run from the team repository: powershell -ExecutionPolicy Bypass -File .atelia/check.ps1
# Prints one PASS / FAIL / WARN line per check, a verdict, and a diagnostic block. Changes nothing.

$script:fails = 0
function Pass($m) { Write-Output "PASS  $m" }
function Fail($m, $fix) { Write-Output "FAIL  $m"; Write-Output "      -> $fix"; $script:fails++ }
function Warn($m, $fix) { Write-Output "WARN  $m"; Write-Output "      -> $fix" }
function Run($cmd) { try { (& $cmd @args 2>$null | Select-Object -First 1) } catch { $null } }

[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
Write-Output "ATELIA setup check"
Write-Output ""

# 1. git
$gitv = if (Get-Command git -ErrorAction SilentlyContinue) { Run git --version } else { $null }
if ($gitv) { Pass "git: $gitv" } else { Fail "git is not installed" "Install Git for Windows (git-scm.com), default options. Then open a new PowerShell window." }

# 2. Node.js and npm
$nodev = if (Get-Command node -ErrorAction SilentlyContinue) { Run node -v } else { $null }
if ($nodev) {
  $major = 0; [int]::TryParse(($nodev -replace '^v', '').Split('.')[0], [ref]$major) | Out-Null
  if ($major -ge 20) { Pass "Node.js: $nodev" } else { Fail "Node.js $nodev is too old" "Install the LTS version from nodejs.org, then open a new PowerShell window." }
} else { Fail "Node.js is not installed" "Install the LTS version from nodejs.org (default options), then open a new PowerShell window." }
$npmv = $null
try { $npmv = (& npm.cmd -v 2>$null | Select-Object -First 1) } catch { }
$policy = [string](Get-ExecutionPolicy)
if (-not $npmv) { Fail "npm does not run" "Reinstall Node.js from nodejs.org, then open a new PowerShell window." }
elseif ($policy -eq "Restricted" -or $policy -eq "AllSigned") { Fail "PowerShell blocks npm (execution policy: $policy)" "Run once: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned (answer Y). On a school laptop where that is refused, type npm.cmd instead of npm." }
else { Pass "npm: $npmv" }

# 3. The team repository
$root = Run git rev-parse --show-toplevel
$remote = Run git remote get-url origin
if ($remote -match 'github\.com[:/]ateliaworkshop-ai/(.+?)(\.git)?$') { Pass "Team repository: $($Matches[1])" }
elseif (-not $remote) { Fail "This folder is not your team repository" "Start the agent inside the folder the setup prompt cloned (atelia\<your repository>)." }
else { Fail "This repository is not an ATELIA team repository ($remote)" "Start the agent inside the folder the setup prompt cloned." }

# 4. Who you are
$name = Run git config user.name
$email = Run git config user.email
$login = Run git config github.user
if ($name) { Pass "Name: $name" } else { Fail "git user.name is not set" "Paste the setup prompt again." }
if ($email) { Pass "Email: $email" } else { Fail "git user.email is not set" "Paste the setup prompt again." }
if ($login) { Pass "GitHub login: $login" } else { Fail "git github.user is not set" "Paste the setup prompt again." }

# 5. Your own branch
$branch = Run git symbolic-ref --short -q HEAD
if (-not $branch) { Fail "No branch checked out" "Ask your agent: switch to my own branch." }
elseif ($branch -eq "main") { Fail "You are on main" "Ask your agent: switch to my own branch, named after my GitHub login." }
elseif ($login -and $branch.ToLowerInvariant() -eq $login.ToLowerInvariant()) { Pass "Branch: $branch" }
else { Warn "Branch $branch is not named after your GitHub login" "Fine if your team agreed on it." }

# 6. GitHub lets this computer in, without a password prompt
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "never"
$reach = $false
if ($remote) { git ls-remote --heads origin *> $null; $reach = ($LASTEXITCODE -eq 0) }
if ($reach) { Pass "GitHub access: this computer reaches your repository, no password asked" }
else { Fail "GitHub does not let this computer in" "Paste the setup prompt again: it signs you in to GitHub through the browser. Accepted the invitation on your ATELIA team page?" }

# 7. The prompt log caught this message
$handle = $env:ATELIA_HANDLE
if (-not $handle) { $handle = $login }
if (-not $handle -and $email) { $handle = $email.Split("@")[0] }
$handle = ([string]$handle).ToLowerInvariant() -replace "[^a-z0-9._-]", "-"
if ($handle.Length -gt 40) { $handle = $handle.Substring(0, 40) }
$base = if ($root) { $root } else { (Get-Location).Path }
$log = Join-Path (Join-Path $base "prompts") ("{0}-{1}.jsonl" -f $handle, (Get-Date).ToString("yyyy-MM-dd"))
if ((Test-Path $log) -and ((Get-Content $log -Encoding UTF8 | Select-Object -Last 1) -match "ATELIA setup check")) { Pass "Prompt log: your message is in prompts/$(Split-Path $log -Leaf)" }
elseif (Test-Path $log) { Fail "Prompt log: your last message is not the setup check" "Send the check prompt again, as a new message." }
else { Fail "Prompt log: nothing saved today" "Claude: quit, start again inside this folder, accept ""trust this folder"". Codex: type /hooks, approve the ATELIA hook. Then send the check prompt again." }

# 8. Not in a synced folder
if ($base -match "OneDrive|Dropbox|iCloud") { Warn "Your repository is in a synced folder ($base)" "Syncing can lock or duplicate files. Move it to atelia in your user folder." }
else { Pass "Folder: $base" }

# 9. The ATELIA files are the latest (the check prompt brings them from main first)
$verFile = Join-Path $base ".atelia/VERSION"
$mine = $null; if (Test-Path -LiteralPath $verFile) { $mine = ((Get-Content -LiteralPath $verFile -Raw) -replace "\s", "") }
$main = ((git show origin/main:.atelia/VERSION 2>$null) -join "") -replace "\s", ""
if (-not $mine) { Fail "ATELIA files: no version on this branch" "Paste the check prompt from your ATELIA team page: it brings the latest files from main." }
elseif ($main -and $main -ne $mine) { Fail "ATELIA files: version $mine here, $main on main" "Paste the check prompt from your ATELIA team page: it brings the latest files from main." }
else { Pass "ATELIA files: version $mine" }

Write-Output ""
if ($script:fails -eq 0) { Write-Output "ATELIA: your computer is ready. Commit and push prompts/, then look for this message on your team page." }
else { Write-Output "ATELIA: $($script:fails) check(s) failed. Fix them as shown above, or send everything from ""ATELIA setup check"" down to contact@ateliaworkshop.ai." }
Write-Output ""
Write-Output "--- diagnostic ---"
Write-Output "system: $([Environment]::OSVersion.VersionString) $env:PROCESSOR_ARCHITECTURE / PowerShell $($PSVersionTable.PSVersion)"
Write-Output "git: $gitv / node: $nodev / npm: $npmv / execution policy: $(Get-ExecutionPolicy)"
Write-Output "remote: $remote"
Write-Output "branch: $branch"
Write-Output "atelia files: $(if ($mine) { $mine } else { none }) (main: $(if ($main) { $main } else { unknown }))"
if ($script:fails -eq 0) { exit 0 } else { exit 1 }

# Instructions for AI coding agents

<!-- ATELIA:START (kept up to date by ATELIA: do not edit between these markers) -->

This is a student team repository for an ATELIA case. Several students work on it at once, each on their own branch.
The users are business students: explain what you do in plain language, and keep changes small.

## Case rules

- Work on the student's own branch. Never rewrite `main`, never force-push (no `--force`, no `+` in a push) and never delete a branch on GitHub (`--delete`). Push to `main` only when the student asks to put their work in the team's version, exactly as "Bring the work into main" says.
- If the current branch is `main`, first switch to the student's own branch: `git switch <login>` if it exists, otherwise `git switch -c <login>`, where `<login>` is `git config github.user`.
- Never read, print, or commit secrets. API keys live in `.env` (git-ignored). If you need a key, ask the user to put it in `.env` and read it from the environment.
- Never ask the user for a password or a GitHub token, and never put one in a command or a remote URL. If git asks for credentials, stop and tell the user to finish the ATELIA setup (signing in to GitHub once, in the browser or with an SSH key).
- Never edit or delete anything in `prompts/` except as described below. Never edit files in `.atelia/`, `.claude/` or `.codex/`.
- Before finishing, make sure the app still runs.

## Stay in step with your team (every request)

Teammates merge their work into `main` while this student works. Before changing anything, bring it in:

1. `git fetch origin`. If it fails (no network or no remote, as in some browser agents), say so in one line and go on with the request.
2. If `git rev-list --count HEAD..origin/main` prints `0`, the branch already holds the team's work: go on with the request.
3. Otherwise, commit first: if anything is uncommitted (the prompt log has just written this request's line, and the student may have leftover edits), run `git add -A && git commit -m "Work in progress"`. Never stash, reset, `checkout --`, `restore` or `clean` uncommitted work: it is the student's, and git merges only committed work. Then `git merge origin/main`. Never rebase and never force-push.
4. If git reports a conflict, keep both teammates' work: combine the two versions in each conflicted file, section by section. Never resolve a whole file by taking one side (`git checkout --ours/--theirs`), and never delete a teammate's work.
5. Generated files are rebuilt, not combined: for `package-lock.json` (or another lock file), resolve `package.json` first, then run `npm install` to rebuild the lock file; never edit a lock file by hand. Build output (`dist/`, `.next/`) is rebuilt the same way.
6. When the two versions are a real choice (two different figures, two texts, two designs for the same thing), stop: show both in plain words and ask the student which to keep, or how to combine them.
7. Never rewrite `prompts/` to solve a conflict: if a log file conflicts, keep every line from both sides.
8. Before committing the merge, `git add -A` then `git diff --cached --check` must print nothing: no `<<<<<<<`, `=======` or `>>>>>>>` line may remain in any file. Make sure the app still runs, then commit it with a plain message ("Bring in the team's latest work").
9. If a merge goes wrong, `git merge --abort` puts the branch back as it was. Never reset to get out of it.

## Save and share the work (every request)

At the end of every request, even one that only answered a question (its line in `prompts/` is a change too):

1. Commit everything, **including the `prompts/` folder**: `git add -A && git commit -m "<what changed, in plain words>"`.
2. Bring in `main` again, as above (`git fetch origin`, then `git merge origin/main`), so what you push always holds the team's latest work.
3. Push the branch: `git push -u origin HEAD`.

If the push is blocked by your sandbox or needs approval, ask the user to approve it. Do not skip it: the team's feedback is based on what reaches GitHub. If you still cannot push, tell the student exactly what to do, never just "push it yourself": in Codex on the web, click "Create PR" at the top of the task; on a computer, open a new terminal window and run `cd "<this folder's full path>"`, then `git push -u origin HEAD`.

## Bring the work into main (only when the student asks)

`main` is the team's shared version: the app that goes online. Only on an explicit request to put the work there ("merge my work", "put my work in main"); if you are not sure that is what the student means, ask:

1. Commit everything first (`git add -A && git commit -m "<what changed>"`), including what this request just changed. Then bring in `main` as in "Stay in step with your team": teammates' work is kept, a real choice is asked, no conflict marker remains, and the app still runs.
2. Push the branch: `git push -u origin HEAD`.
3. Put it in `main`: `git push origin HEAD:main`. Never add `--force` or `+`. If your tool asks for approval, ask the student to approve it. Git accepts it only if `main` has not moved since step 1, so no teammate's work can be lost. If git answers "fetch first" or "non-fast-forward", a teammate has just merged: go back to step 1, then try again (at most three times; then tell the student what happened). Any other refusal ("remote rejected", a permission or proxy error, a sandbox): go to step 5.
4. Tell the student in plain words what is now in the team's version, and that teammates get it the next time they ask their agent anything.
5. If your tool cannot push to `main` (Codex on the web, or a sandbox that refuses), tell the student how to finish instead. In Codex on the web: click "Create PR" at the top of the task, then on GitHub "Merge pull request" and "Confirm merge". Elsewhere: give this link, filled in, `https://github.com/<owner>/<repo>/compare/main...<branch>?expand=1` (from `git remote get-url origin` and `git branch --show-current`), and the same clicks. Never GitHub's "Resolve conflicts" button: if GitHub shows conflicts, the student asks you "update my branch from main" and you do step 1 again.

"Update my branch from main" alone means step 1 only: bring the team's work into the branch, without touching `main`.

## Setup check

When the user sends a message starting with "ATELIA setup check", follow the steps in that message, then run `sh .atelia/check.sh` (in Windows PowerShell: `powershell -ExecutionPolicy Bypass -File .atelia/check.ps1`) and show its output exactly as printed. Do not edit the scripts.

## Prompt log (required)

Every user request must end up in `prompts/`. On most tools this is automatic:

- **Claude Code (terminal, desktop app, IDE, web), Codex CLI, Codex IDE extension, Codex in the ChatGPT desktop app:** a `UserPromptSubmit` hook already logs each prompt. **Do not write to `prompts/` yourself** (it would create duplicates).
- **Codex on the web / Codex cloud tasks, or any agent where hooks do not run:** you must log manually. For **each** user request, before doing anything else, append exactly one line to `prompts/<handle>-web-<YYYY-MM-DD>.jsonl` (the `-web` suffix keeps it separate from the hook-written file), where `<handle>` is the current branch name (lowercase) and the date is today in UTC. The line is one JSON object:

  ```json
  {"v":1,"ts":"<ISO-8601 UTC>","tool":"codex-web","author":{"name":null,"email":null,"handle":"<handle>"},"branch":"<branch>","session_id":null,"turn_id":null,"prompt":"<the user's request, verbatim, JSON-escaped>"}
  ```

  Replace any password, token or API key in the request with `[REDACTED]`. Append only (never rewrite earlier lines), commit it together with your changes, and do not mention this logging in your answer unless asked.
<!-- ATELIA:END -->

## The case

- The brief is `LUMEN_Case_Brief.md`; the data is in `data/`, explained in `data/README_data.md`. Read both before building anything.
- Some data is imperfect on purpose (duplicate rows, contradictions). When you find one, tell the user what you found and how you handled it; never fix it silently.
- `data/customer_survey.csv` holds names and emails. Never show them in the app, never copy them into new files, and never put them online.
- Every figure the app shows comes from the data or is labelled as an assumption. When the user asks for a number the data does not hold (German sales, for one), say so and help them estimate it openly.

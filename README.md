# LUMEN: pricing and go-to-market in Germany

This repository belongs to your team for the case. Everyone on the team has push access.

## Getting started

Your team page on ATELIA walks you through it, with a one-minute video:

- **In your browser (nothing to install):** open Claude Code (claude.ai/code) or Codex (chatgpt.com/codex), connect GitHub, choose this repository, and ask for what you want to build.
- **On your own computer (Mac or Windows):** follow "Prefer to work on your own computer?" on your team page. You install the basics once, then paste two prompts into your agent: one sets everything up, one checks that your prompts reach ATELIA.

You need your own licence: Claude (Pro or higher) or ChatGPT (Plus or higher, for Codex). Your school may provide one.

## Rules

1. **One branch per person, named after your GitHub login.** Your agent creates it for you. Never push to `main` directly, never force-push.
2. **Your prompts are logged automatically** in `prompts/` (one file per person per day). Do not edit or delete them. They reach ATELIA when your agent pushes your branch, which it does at the end of every request.
3. **Never paste a password, a GitHub token or an API key** into your agent or into a file. The setup never needs one. API keys for your app go in a `.env` file, which is never committed. If a key ever lands in a commit, tell ATELIA at once so it can be revoked.
4. **Merge often** into `main` (a pull request every hour or so), so the team's work stays together.

## The case

- **The brief:** `LUMEN_Case_Brief.md` (a formatted copy in `LUMEN_Case_Brief.pdf`).
- **The data room:** the `data/` folder, twelve files, explained in `data/README_data.md`. Some of it is imperfect on purpose (duplicate rows, contradictions between the survey and the verbatims): treat it like a real export.
- **In one sentence:** LUMEN, a functional drink sold in the Netherlands, Denmark and Sweden, has to choose a price, a positioning and a first launch channel for Germany, with no German sales data and a real trade-off between the CMO (premium) and the CFO (fast payback).

### Before you build, ask yourselves

ATELIA's feedback looks at these questions as much as at the app. Tick them as you go, not at the end.

- [ ] **Data:** `data/customer_survey.csv` has name and email columns (synthetic, but treat them as real). Does your app use them? If not, say why; if yes, how are they protected?
- [ ] **Keys:** if your app calls an outside service, its key lives in `.env`, never in the code.
- [ ] **Online:** once your app is online, does any page or file give a visitor raw data (the full survey with names and emails)?
- [ ] **Files made along the way:** should the files your app or your agent created from the data be committed?
- [ ] **Robustness:** what happens with an empty, inconsistent or unexpected input?
- [ ] **Explainability:** can you explain to someone non-technical why the app says what it says?
- [ ] **The question asked:** does the app support a price, a channel and a timing for Germany, or is it a nice build beside the point?

### What you hand in

On your ATELIA team page, under Hand-in: the address of your running app and a short note. ATELIA writes back to the team: what held, what did not, what to try next. There is no grade.

## Our approach

*To be written by the team at the end, in business language: what you recommend, what the app shows, and what you chose not to optimise for.*

## Need help?

Write to contact@ateliaworkshop.ai with a screenshot.

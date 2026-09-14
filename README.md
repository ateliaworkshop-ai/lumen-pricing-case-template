# LUMEN — Pricing & Go-to-Market Case — ATELIA × ESCP Starter Kit

> This repo is your starting point. Codex should read this README first.

## How to Get Started

This repo is a **template**: click **Fork** (top right), not "Use this template." Fork keeps your copy linked back to the original — that's what lets ATELIA automatically find every team's work, without anyone needing to send a link.

Once you've forked it, add your teammates as collaborators (Settings → Collaborators on your fork), and leave the visibility as **Public** — don't switch it to Private, or we lose access to your work.

## The Brief

The full brief is in `LUMEN_Case_Brief.md` (and a formatted version in `LUMEN_Case_Brief.pdf`). The data is in the `data/` folder, documented in `data/README_data.md`.

One-sentence summary: LUMEN, a functional beverage brand, has to decide **price, positioning, and launch channel(s)** to enter the German market — with no real German sales data (LUMEN isn't there yet), and a real trade-off between the CMO (premium positioning) and the CFO (fast return on investment).

## Rule #1 — Prompt Logging Is Automatic

This repo includes an `AGENTS.md` file, which Codex reads automatically at the start of every task — you don't need to open or edit it. The first time you talk to Codex in a new conversation, it will ask for your **student ID**. Answer it, and from then on Codex logs every prompt you send it — automatically, verbatim — into `prompts/<your-id>/session-*.md`, without you doing anything else.

**You don't fill this in by hand.** Your only job is to make sure that log file gets committed along with your code changes — Codex writes it, but you still need to include it when your pull request is created and merged. If a pull request only has code changes and no updated log file, that's a sign something didn't get logged.

Why we're doing this: it's not to monitor you. It's what lets us understand, at the end, how you reasoned — not just what you produced. A good result reached with a clear prompt from the start isn't scored the same as a good result reached after fifteen random attempts.

## Rule #2 — Before You Code, Ask Yourself These Questions

Check each box in this README as you go — not at the end, while you're working:

- [x] **Data**: We use aggregated market, competitor, survey, quote, sales, funnel, cost, channel, price-test, and seasonality inputs. We deliberately exclude name/email fields from the application and store only the segment, channel, and purchase-frequency fields needed for analysis.
- [x] **API keys**: We use no external API, so no API key is required or committed.
- [x] **Deployment**: The front end exposes aggregated, source-tagged outputs only; it does not return the raw survey or respondent identifiers.
- [x] **Files generated along the way**: `assets/data.json` is a derived, non-personal aggregation used by the audience screen; raw source files remain in `data/` for traceability. The decision memo is a human-readable submission artifact.
- [x] **Storage**: Small, static JSON is used for browser-ready aggregates because it is transparent, fast, and avoids exposing row-level survey data. The original CSVs remain the auditable source of truth.
- [x] **Robustness**: Empty channel selections show an explanatory empty state; failed data loading shows a refresh message; pricing and assumption controls are constrained to the tested ranges; forecasts are labelled estimates.
- [x] **Explainability**: Each screen explains its assumptions in plain language and shows source tags, unit contribution, estimated volume, and CAC payback so a non-technical reviewer can follow the decision.
- [x] **Business relevance**: The prototype directly compares the price/channel choices Freya must make, surfaces the CMO-versus-CFO trade-off, and identifies what each option gives up.

These questions aren't here to slow you down — they're part of what's being evaluated. A thoughtful answer to one of them is worth more than an extra feature nobody asked for.

## What We Expect at the End

- A prototype that works, even partially, on the LUMEN case
- Your prompt log (`prompts/<your-id>/session-*.md`) committed and up to date
- A short paragraph below, written in business language (not technical), explaining what you did and why
- A live URL (Vercel or similar) if you deployed it — not required to still get credit, but expected if you did

## How to run locally

1. Install Node.js (18 or newer is recommended).
2. From the repository root, run `npm install` if your environment requires package metadata to be installed.
3. Rebuild the browser-ready aggregate data with `npm run build:data`.
4. Serve the repository root with any static HTTP server (for example, `npx serve .`) and open the displayed local URL. A static server is required because the app loads `assets/data.json` with `fetch`; opening `index.html` directly may be blocked by browser file-origin rules.
5. Run the automated checks with `npm test`.

## Our Approach

We treat Germany as a measured market-entry decision, not a precision forecast: there are no German sales, so the tool triangulates German survey and price-test evidence with duplicate-cleaned NL/DK/SE performance, channel economics, competitor prices, and market context. The recommended first wave is a premium-but-accessible €2.19 launch through DTC Online and Gym & Office, focused on audiences with a clear performance and wellness use case. In the simulator's default Berlin/Munich scenario, this mix delivers €1.16 weighted contribution per can and approximately six-month CAC payback; the €1.79 retail-led alternative improves stated acceptance to 61.7% but reduces weighted contribution to €0.63 and stretches payback to roughly twelve months. We therefore accept lower initial reach to protect cash recovery and premium credibility, while using a six-month pilot to validate conversion, repeat purchase, channel execution, and willingness to pay before scaling Retail/Grocery. The decision cockpit makes assumptions adjustable, labels uncertainty, cites the source file behind each key output, and keeps respondent identifiers out of the product.

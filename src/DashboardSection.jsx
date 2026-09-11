import React, { useMemo, useState } from "react";
import { LTV_CAC_TARGET, tensionScores } from "./cockpit.js";
import { NOTE_TEAMS, TEAMS, teamById } from "./teams.js";
import { season, useDecision } from "./decision.jsx";
import { seasonIndexFor } from "./exhibits.js";

function formatEur(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 10000) {
    return `${value < 0 ? "−" : ""}€${Math.round(abs).toLocaleString("en-GB")}`;
  }
  return `${value < 0 ? "−" : ""}€${abs.toFixed(digits)}`;
}

function formatRatio(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}:1`;
}

function formatMonths(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} mo`;
}

function TeamCard({ def, active, scores, sim, selectedRegion, monthLabel, seasonIndex }) {
  const {
    team,
    setTeam,
    notes,
    setNote,
    shareDecision,
    price,
  } = useDecision();
  const [copied, setCopied] = useState(false);
  const isCmo = def.id === "cmo";
  const isCfo = def.id === "cfo";
  const isLaunch = def.id === "launch";

  async function handoff() {
    setTeam(def.id);
    const ok = await shareDecision(def.id);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className={def.id === team ? "team-card is-active" : "team-card"}>
      <p className="stat-kicker">{def.kicker}</p>
      <h3>{def.label}</h3>
      <p className="stat-note">{def.role}</p>
      <dl className="team-metrics">
        {isCmo && (
          <>
            <div>
              <dt>CMO score</dt>
              <dd>{scores.cmo}/100</dd>
            </div>
            <div>
              <dt>Urban Wellness in-band</dt>
              <dd>{(scores.urbanComfort * 100).toFixed(0)}%</dd>
            </div>
            <div>
              <dt>Live price</dt>
              <dd>{formatEur(price)}</dd>
            </div>
            <div>
              <dt>Premium shelf</dt>
              <dd>{price >= 2.1 && price <= 2.7 ? "Inside €2.1–€2.7" : "Outside €2.1–€2.7"}</dd>
            </div>
          </>
        )}
        {isCfo && (
          <>
            <div>
              <dt>CFO score</dt>
              <dd>{scores.cfo}/100</dd>
            </div>
            <div>
              <dt>LTV:CAC</dt>
              <dd>{formatRatio(sim.blendRatio)}</dd>
            </div>
            <div>
              <dt>CAC payback</dt>
              <dd>{formatMonths(sim.blendPayback)}</dd>
            </div>
            <div>
              <dt>Year-1 net</dt>
              <dd>{formatEur(sim.year1Net, 0)}</dd>
            </div>
          </>
        )}
        {isLaunch && (
          <>
            <div>
              <dt>First region</dt>
              <dd>{selectedRegion ? selectedRegion.name : "Loading…"}</dd>
            </div>
            <div>
              <dt>Income / inhabitant</dt>
              <dd>
                {selectedRegion ? formatEur(selectedRegion.income, 0) : "—"}
              </dd>
            </div>
            <div>
              <dt>Launch timing</dt>
              <dd>{monthLabel}</dd>
            </div>
            <div>
              <dt>Seasonality index</dt>
              <dd>{seasonIndex}</dd>
            </div>
          </>
        )}
      </dl>
      <label className="cockpit-label" htmlFor={`note-${def.id}`}>
        Note to the other teams
      </label>
      <textarea
        id={`note-${def.id}`}
        className="team-note"
        rows={3}
        maxLength={400}
        placeholder={
          isCmo
            ? "e.g. We can live with VW resistance if Urban Wellness stays comfortable."
            : isCfo
              ? "e.g. LTV:CAC is still below 3:1 — shift mix toward Referral before we lock €2.19."
              : "e.g. Oberbayern first; keep July as a stress-test, not a second recommendation."
        }
        value={notes[def.id] || ""}
        onChange={(e) => setNote(def.id, e.target.value)}
      />
      <div className="chip-row">
        <button
          type="button"
          className={active ? "chip is-on" : "chip"}
          onClick={() => setTeam(def.id)}
        >
          {active ? "This view" : "Open this view"}
        </button>
        <button type="button" className="chip" onClick={handoff}>
          {copied ? "Link copied" : "Hand off this view"}
        </button>
      </div>
    </article>
  );
}

export default function DashboardSection() {
  const {
    team,
    setTeam,
    sim,
    recSim,
    vs,
    cockpitData,
    selectedRegion,
    monthLabel,
    launchMonth,
    shareDecision,
    incomingFrom,
    clearIncoming,
    notes,
  } = useDecision();
  const [copiedAll, setCopiedAll] = useState(false);
  const scores = useMemo(() => tensionScores(sim, cockpitData), [sim, cockpitData]);
  const recScores = useMemo(
    () => tensionScores(recSim, cockpitData),
    [recSim, cockpitData],
  );
  const current = teamById(team);
  const seasonIndex = seasonIndexFor(season.months, launchMonth);
  const fromLabel = incomingFrom
    ? teamById(incomingFrom).label
    : null;

  async function copyAll() {
    const ok = await shareDecision("combined");
    setCopiedAll(ok);
    window.setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <section id="dashboard" className="dashboard" aria-labelledby="dashboard-title">
      <header className="tool-header">
        <p className="eyebrow">Shared room · decision dashboard</p>
        <h2 id="dashboard-title">One board, three briefs</h2>
        <p className="lede">
          CMO, CFO, and launch read different exhibits from the same live
          decision. Switch a view to hide the other teams’ deep-dives. Leave a
          note and hand off a link — there is no login and no server; the link
          carries the numbers and the notes.
        </p>
      </header>

      {fromLabel && (
        <p className="live-callout" role="status">
          Loaded a handoff from {fromLabel}. The live sliders now match what
          they sent.
          <button type="button" className="linkish" onClick={clearIncoming}>
            Dismiss
          </button>
        </p>
      )}

      <div className="chip-row" role="tablist" aria-label="Team view">
        {TEAMS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className={t.id === team ? "chip is-on" : "chip"}
            aria-selected={t.id === team}
            onClick={() => setTeam(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button type="button" className="chip" onClick={copyAll}>
          {copiedAll ? "Link copied" : "Copy shared link"}
        </button>
      </div>

      <p className="limitation">{current.role}</p>

      <div className="hero-kpis" aria-label="Live decision at a glance">
        <div>
          <span>Acceptance</span>
          <strong>{sim.acceptance.toFixed(1)}%</strong>
        </div>
        <div>
          <span>LTV:CAC vs {LTV_CAC_TARGET}:1</span>
          <strong>{formatRatio(sim.blendRatio)}</strong>
        </div>
        <div>
          <span>Year-1 net</span>
          <strong>{formatEur(sim.year1Net, 0)}</strong>
        </div>
        <div>
          <span>Vs recommendation</span>
          <strong>{vs.onRec ? "On rec" : "Stress-test"}</strong>
        </div>
      </div>

      <div className="tension-row dash-tension">
        <div>
          <p className="tension-label">CFO · payback</p>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${scores.cfo}%` }} />
          </div>
          <p className="stat-note">
            Live {scores.cfo}/100 · rec {recScores.cfo}/100
          </p>
        </div>
        <div>
          <p className="tension-label">CMO · premium</p>
          <div className="meter is-cmo" aria-hidden="true">
            <span style={{ width: `${scores.cmo}%` }} />
          </div>
          <p className="stat-note">
            Live {scores.cmo}/100 · rec {recScores.cmo}/100
          </p>
        </div>
      </div>

      <div className="team-grid">
        {NOTE_TEAMS.map((def) => (
          <TeamCard
            key={def.id}
            def={def}
            active={def.id === team}
            scores={scores}
            sim={sim}
            selectedRegion={selectedRegion}
            monthLabel={monthLabel}
            seasonIndex={seasonIndex}
          />
        ))}
      </div>

      {(notes.cmo || notes.cfo || notes.launch) && (
        <p className="stat-note">
          Notes sit in this browser and inside a copied handoff link. They are
          not uploaded anywhere.
        </p>
      )}
    </section>
  );
}

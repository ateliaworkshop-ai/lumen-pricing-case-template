import React, { useMemo, useState } from "react";
import { LTV_CAC_TARGET, SALES_CHANNELS, computeGivesUp, tensionScores } from "./cockpit.js";
import { NOTE_TEAMS, TEAMS, teamById } from "./teams.js";
import { season, useDecision } from "./decision.jsx";
import { seasonIndexFor } from "./exhibits.js";
import { BarChart, Gauge, PieChart } from "./BiCharts.jsx";

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

function shortChannel(channel) {
  if (String(channel).startsWith("Retail")) return "Retail";
  if (String(channel).startsWith("Gym")) return "Gym";
  if (String(channel).includes("Sampling")) return "Sampling";
  if (String(channel).includes("Referral")) return "Referral";
  if (String(channel).includes("Social")) return "Paid Social";
  if (String(channel).includes("Influencer")) return "Influencer";
  return "DTC";
}

function LiveVisuals() {
  const {
    shares,
    mktShares,
    sim,
    price,
    cockpitData,
    leadChannel,
    boostMktChannel,
    setLaunchMonth,
    launchMonth,
    team,
  } = useDecision();
  const givesUp = useMemo(
    () => computeGivesUp(cockpitData, price, sim.fundedNames),
    [cockpitData, price, sim.fundedNames],
  );
  const salesPie = SALES_CHANNELS.map((ch) => ({
    key: ch,
    label: shortChannel(ch),
    value: Number(shares[ch]) || 0,
    hint: "Click to lead this sales channel",
  }));
  const mktPie = (cockpitData.marketingCacs || []).map((row) => ({
    key: row.channel,
    label: shortChannel(row.channel),
    value: Number(mktShares[row.channel]) || 0,
    hint: `CAC ${formatEur(row.cac)} · click to weight this mix`,
  }));
  const acceptPie = [
    { key: "yes", label: "Would buy", value: sim.acceptance },
    { key: "no", label: "Would not", value: Math.max(0, 100 - sim.acceptance) },
  ];
  const contribBars = sim.channels.map((row) => ({
    key: row.channel,
    label: shortChannel(row.channel),
    value: row.contribution,
  }));
  const netBars = sim.channels.map((row) => ({
    key: row.channel,
    label: shortChannel(row.channel),
    value: row.year1Net,
  }));
  const segmentBars = givesUp.segments.map((s) => ({
    key: s.segment,
    label: s.segment.replace(" Seekers", "").replace("Urban Wellness", "Urban W."),
    value: s.comfort * 100,
  }));
  const seasonBars = season.months.map((m) => ({
    key: m.month,
    label: m.label,
    value: m.index,
    color: m.month === launchMonth ? "#8a3d28" : "#2c4a38",
  }));

  const showCmo = team === "combined" || team === "cmo";
  const showCfo = team === "combined" || team === "cfo";
  const showLaunch = team === "combined" || team === "launch";

  return (
    <div className="bi-grid">
      {(showCfo || showLaunch) && (
        <article className="bi-tile">
          <h3>Sales-channel spend mix</h3>
          <p className="stat-note">Share of the assumed year-1 budget. Click a slice to lead that channel.</p>
          <PieChart items={salesPie} onSelect={(s) => leadChannel(s.key)} />
        </article>
      )}
      {showCfo && (
        <article className="bi-tile">
          <h3>Marketing mix (CAC lever)</h3>
          <p className="stat-note">
            Not DTC / Retail / Gym — those are sales channels. Click a slice to
            weight this acquisition mix.
          </p>
          <PieChart
            items={mktPie}
            donut
            center={formatEur(sim.cac)}
            onSelect={(s) => boostMktChannel(s.key)}
          />
        </article>
      )}
      {showCmo && (
        <article className="bi-tile">
          <h3>Acceptance at live price</h3>
          <p className="stat-note">Price-test share who would buy, interpolated between the file knots.</p>
          <PieChart items={acceptPie} donut center={`${sim.acceptance.toFixed(0)}%`} />
        </article>
      )}
      {showCfo && (
        <article className="bi-tile">
          <h3>Contribution / unit</h3>
          <p className="stat-note">After channel cuts and COGS. Same blended CAC on every sales channel.</p>
          <BarChart
            items={contribBars}
            format={(v) => formatEur(v)}
            onSelect={(s) => leadChannel(s.key)}
          />
        </article>
      )}
      {showCfo && (
        <article className="bi-tile">
          <h3>Year-1 net by sales channel</h3>
          <p className="stat-note">Contribution × units − that channel’s share of the assumed budget.</p>
          <BarChart items={netBars} format={(v) => formatEur(v, 0)} />
        </article>
      )}
      {showCfo && (
        <article className="bi-tile">
          <h3>LTV:CAC gauge</h3>
          <p className="stat-note">Needle is live. Tick is the 3:1 brief target.</p>
          <Gauge
            value={sim.blendRatio}
            max={4}
            target={LTV_CAC_TARGET}
            label={formatRatio(sim.blendRatio)}
          />
        </article>
      )}
      {showCmo && (
        <article className="bi-tile">
          <h3>Segment in-band at live price</h3>
          <p className="stat-note">Van Westendorp: too cheap &lt; price &lt; too expensive.</p>
          <BarChart items={segmentBars} format={(v) => `${v.toFixed(0)}%`} />
        </article>
      )}
      {showLaunch && (
        <article className="bi-tile">
          <h3>Germany seasonality</h3>
          <p className="stat-note">Click a month to set live launch timing. Index 100 = average. Not LUMEN sales.</p>
          <BarChart
            items={seasonBars}
            format={(v) => String(v)}
            onSelect={(s) => setLaunchMonth(s.key)}
          />
        </article>
      )}
    </div>
  );
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
          Power BI-style visuals on the live decision: pies for mix, a donut for
          acceptance, bars for contribution and seasonality, a gauge for
          LTV:CAC. Click a slice or bar to move the same sliders the rest of
          the page uses. CMO, CFO, and launch still get different tiles.
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

      <LiveVisuals />

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

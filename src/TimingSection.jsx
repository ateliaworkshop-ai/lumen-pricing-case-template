import React, { useRef } from "react";
import historyCsv from "../data/competitor_price_history.csv?raw";
import { buildPromoEvents } from "./exhibits.js";
import { season, useDecision } from "./decision.jsx";

const promos = buildPromoEvents(historyCsv);
const maxIndex = Math.max(...season.months.map((m) => m.index));

export default function TimingSection() {
  const { launchMonth, setLaunchMonth, sim } = useDecision();
  const dragging = useRef(false);
  const selected =
    launchMonth === 0
      ? null
      : (season.months.find((m) => m.month === launchMonth) ?? season.peak);
  const monthPromos = selected
    ? promos.filter((p) => p.monthNum === selected.month)
    : [];
  const vsPeak = selected ? selected.index / season.peak.index : 1;
  const vsTrough = selected ? selected.index / season.trough.index : 1;
  const overlayUnits = selected
    ? sim.units * (selected.index / 100)
    : sim.units;

  return (
    <section id="timing" className="timing" aria-labelledby="timing-title">
      <header className="tool-header">
        <p className="eyebrow">When to launch · exhibit 12</p>
        <h2 id="timing-title">Demand seasonality in Germany</h2>
        <p className="lede">
          Monthly seasonality index (100 = average) plus mean German
          temperature. Click a month to set the live launch timing — the
          cockpit applies that index to year-1 units only. This is a timing
          signal for a cold functional drink — not German LUMEN sales, because
          there are none.
        </p>
      </header>

      <div className="chip-row">
        <button
          type="button"
          className={launchMonth === 0 ? "chip is-on" : "chip"}
          onClick={() => setLaunchMonth(0)}
          aria-pressed={launchMonth === 0}
        >
          Full-year average
        </button>
      </div>

      <div className="tradeoff">
        <article className="stat">
          <p className="stat-kicker">Selected</p>
          <h3>{selected ? selected.label : "Full year"}</h3>
          <p className="stat-value">{selected ? selected.index : 100}</p>
          <p className="stat-note">
            {selected
              ? `${selected.temp}°C mean. ${(vsPeak * 100).toFixed(0)}% of the July peak · ${(vsTrough * 100).toFixed(0)}% of the January trough.`
              : "Index 100 — no seasonal overlay on year-1 units."}
            {selected && selected.index >= 110
              ? " Inside the high-season window (index ≥ 110)."
              : selected && selected.month === 4
                ? " Last quiet month before the climb — trial time, not peak sell-through."
                : selected
                  ? " Below the high-season threshold."
                  : ""}
            {` Live year-1 units at this index: ${Math.round(overlayUnits).toLocaleString("en-GB")}.`}
          </p>
        </article>
        <article className="stat">
          <p className="stat-kicker">Promo calendar · exhibit 3</p>
          <h3>
            {!selected
              ? "Pick a month"
              : monthPromos.length
                ? `${monthPromos.length} competitor promo${monthPromos.length > 1 ? "s" : ""}`
                : "No listed promo"}
          </h3>
          <p className="stat-note">
            {monthPromos.length
              ? monthPromos
                  .map(
                    (p) =>
                      `${p.competitor} −${p.discount}% (shelf €${p.shelf.toFixed(2)})`,
                  )
                  .join(" · ")
              : "February is the noisiest month in the file (PulsUp −20%, Root & Rise −15%). July is Mate Libre −20%. A quiet month is a positioning window, not a volume guarantee."}
          </p>
        </article>
      </div>

      <div
        className="season-bars"
        role="listbox"
        tabIndex={0}
        aria-label="German seasonality by month. Drag or use arrow keys to set the live launch month."
        aria-activedescendant={launchMonth ? `season-${launchMonth}` : undefined}
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            setLaunchMonth((m) => (m === 0 ? 1 : Math.min(12, m + 1)));
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            setLaunchMonth((m) => (m <= 1 ? 0 : m - 1));
          } else if (event.key === "Home" || event.key === "Escape") {
            event.preventDefault();
            setLaunchMonth(0);
          }
        }}
      >
        {season.months.map((m) => (
          <button
            key={m.month}
            id={`season-${m.month}`}
            type="button"
            role="option"
            className={
              m.month === launchMonth
                ? "season-col is-on"
                : m.index >= 110
                  ? "season-col is-peak"
                  : "season-col"
            }
            onClick={() => setLaunchMonth(m.month === launchMonth ? 0 : m.month)}
            onPointerEnter={() => {
              if (dragging.current) setLaunchMonth(m.month);
            }}
            aria-selected={m.month === launchMonth}
          >
            <span
              className="season-bar"
              style={{ height: `${(m.index / maxIndex) * 100}%` }}
            />
            <span className="season-idx">{m.index}</span>
            <span className="season-lbl">{m.label}</span>
          </button>
        ))}
      </div>
      <p className="chart-hint">
        Click a month, or drag across the bars. Focus the chart and use arrows
        (Home for full-year average).
      </p>

      <p className="limitation">
        High season is {season.window[0].label}–{season.window[season.window.length - 1].label}{" "}
        (index ≥ 110). April sits just before that climb (index 98); July is
        the peak (138). We show both so timing can be argued — we are not
        locking April or July into the recommendation text. The cockpit applies
        the selected month’s index to year-1 units only.
      </p>
    </section>
  );
}

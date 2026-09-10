import React, { useState } from "react";
import seasonCsv from "../data/seasonality_and_weather.csv?raw";
import historyCsv from "../data/competitor_price_history.csv?raw";
import { buildPromoEvents, buildSeasonality } from "./exhibits.js";

const view = buildSeasonality(seasonCsv);
const promos = buildPromoEvents(historyCsv);
const maxIndex = Math.max(...view.months.map((m) => m.index));

export default function TimingSection() {
  const [month, setMonth] = useState(view.peak.month);
  const selected = view.months.find((m) => m.month === month) ?? view.peak;
  const monthPromos = promos.filter((p) => p.monthNum === selected.month);
  const vsPeak = selected.index / view.peak.index;
  const vsTrough = selected.index / view.trough.index;

  return (
    <section id="timing" className="timing" aria-labelledby="timing-title">
      <header className="tool-header">
        <p className="eyebrow">When to launch · exhibit 12</p>
        <h2 id="timing-title">Demand seasonality in Germany</h2>
        <p className="lede">
          Monthly seasonality index (100 = average) plus mean German
          temperature. Click a month. This is a timing signal for a cold
          functional drink — not German LUMEN sales, because there are none.
          The team recommendation does not lock a launch month; stress-test it
          in the cockpit.
        </p>
      </header>

      <div className="tradeoff">
        <article className="stat">
          <p className="stat-kicker">Selected</p>
          <h3>{selected.label}</h3>
          <p className="stat-value">{selected.index}</p>
          <p className="stat-note">
            {selected.temp}°C mean. {(vsPeak * 100).toFixed(0)}% of the July
            peak · {(vsTrough * 100).toFixed(0)}% of the January trough.
            {selected.index >= 110
              ? " Inside the high-season window (index ≥ 110)."
              : selected.month === 4
                ? " Last quiet month before the climb — trial time, not peak sell-through."
                : " Below the high-season threshold."}
          </p>
        </article>
        <article className="stat">
          <p className="stat-kicker">Promo calendar · exhibit 3</p>
          <h3>
            {monthPromos.length
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

      <div className="season-bars" role="list">
        {view.months.map((m) => (
          <button
            key={m.month}
            type="button"
            className={
              m.month === selected.month
                ? "season-col is-on"
                : m.index >= 110
                  ? "season-col is-peak"
                  : "season-col"
            }
            onClick={() => setMonth(m.month)}
            aria-pressed={m.month === selected.month}
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

      <p className="limitation">
        High season is {view.window[0].label}–{view.window[view.window.length - 1].label}{" "}
        (index ≥ 110). April sits just before that climb (index 98); July is
        the peak (138). We show both so timing can be argued — we are not
        locking April or July into the recommendation text. The cockpit can
        apply the selected month’s index to year-1 units only.
      </p>
    </section>
  );
}

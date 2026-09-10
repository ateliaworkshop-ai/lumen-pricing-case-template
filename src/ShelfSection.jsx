import React, { useState } from "react";
import competitorCsv from "../data/competitor_prices_by_channel.csv?raw";
import historyCsv from "../data/competitor_price_history.csv?raw";
import { LUMEN_PRICE, buildPromoPressure, buildShelf } from "./exhibits.js";

const shelf = buildShelf(competitorCsv);
const promo = buildPromoPressure(historyCsv);
const CHANNELS = ["Retail/Grocery", "Gym & Office", "DTC Online"];

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function ShelfLine({ items }) {
  const min = 0.9;
  const max = 3.3;
  const x = (p) => `${8 + ((p - min) / (max - min)) * 84}%`;
  const mate = items.find((r) => r.competitor.includes("Mate"));
  const volt = items.find((r) => r.competitor.includes("Volt"));
  const gap =
    mate && volt
      ? { left: mate.price, width: volt.price - mate.price }
      : null;

  return (
    <div className="shelf-line" role="img" aria-label="Single-can price line">
      {gap && (
        <span
          className="shelf-gap"
          style={{
            left: x(gap.left),
            width: `${(gap.width / (max - min)) * 84}%`,
          }}
        />
      )}
      <span className="shelf-axis" />
      {items.map((row) => (
        <span
          key={row.competitor}
          className={row.lumen ? "shelf-dot is-lumen" : "shelf-dot"}
          style={{ left: x(row.price) }}
        >
          <strong>{row.lumen ? "LUMEN" : row.competitor}</strong>
          {formatEur(row.price)}
        </span>
      ))}
      {gap && (
        <p className="shelf-gap-caption">
          Empty stretch of shelf between {formatEur(gap.left)} and{" "}
          {formatEur(gap.left + gap.width)}
        </p>
      )}
    </div>
  );
}

export default function ShelfSection() {
  const [channel, setChannel] = useState("Retail/Grocery");
  const rows = (shelf.byChannel.get(channel) ?? []).slice();
  const withLumen = [
    ...rows,
    {
      competitor: "LUMEN (our rec.)",
      positioning: "Team pick",
      price: LUMEN_PRICE,
      lumen: true,
    },
  ].sort((a, b) => a.price - b.price);
  const max = Math.max(shelf.maxPrice, ...withLumen.map((r) => r.price));

  return (
    <section id="shelf" className="shelf" aria-labelledby="shelf-title">
      <header className="tool-header">
        <p className="eyebrow">Competitive context · exhibit 2</p>
        <h2 id="shelf-title">Where €2.19 sits on the shelf</h2>
        <p className="lede">
          Single-can (330 ml) list prices from competitor_prices_by_channel.csv.
          €2.19 is above heritage (Mate Libre) and below VoltFit — the gap the
          recommendation is built on. Not a recommended price from this chart
          alone.
        </p>
      </header>

      <div className="chip-row" role="tablist" aria-label="Shelf channel">
        {CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            className={ch === channel ? "chip is-on" : "chip"}
            onClick={() => setChannel(ch)}
            aria-pressed={ch === channel}
          >
            {ch}
          </button>
        ))}
      </div>

      {withLumen.length > 1 && (
        <ShelfLine items={withLumen} />
      )}

      <ul className="shelf-list">
        {withLumen.map((row) => (
          <li key={row.competitor} className={row.lumen ? "is-lumen" : undefined}>
            <div className="shelf-meta">
              <strong>{row.competitor}</strong>
              <span>{row.positioning}</span>
            </div>
            <div className="shelf-bar-track" aria-hidden="true">
              <span style={{ width: `${(row.price / max) * 100}%` }} />
            </div>
            <span className="shelf-price">{formatEur(row.price)}</span>
          </li>
        ))}
      </ul>
      {withLumen.length <= 1 && (
        <p className="empty">No competitor singles listed for this channel.</p>
      )}

      <p className="stat-note">
        Root &amp; Rise has no Gym &amp; Office single-can row in the file —
        boutique coverage is incomplete there. Promo pressure over the last 12
        months (exhibit 3):{" "}
        {promo
          .map((p) => `${p.competitor} ${(p.promoShare * 100).toFixed(0)}% of months`)
          .join(" · ")}
        . PulsUp discounters; VoltFit / Root &amp; Rise rarely promo — another
        reason a stable €2.19 is closer to premium than to mass.
      </p>
    </section>
  );
}

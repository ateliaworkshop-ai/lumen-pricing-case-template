import React from "react";
import competitorCsv from "../data/competitor_prices_by_channel.csv?raw";
import historyCsv from "../data/competitor_price_history.csv?raw";
import { LUMEN_PRICE, buildPromoPressure, buildShelf } from "./exhibits.js";
import { PRICE_MAX, PRICE_MIN, REC, SALES_CHANNELS } from "./cockpit.js";
import { useDecision } from "./decision.jsx";

const shelf = buildShelf(competitorCsv);
const promo = buildPromoPressure(historyCsv);

function formatEur(value) {
  return `€${value.toFixed(2)}`;
}

function ShelfLine({ items, recPrice, onPickPrice }) {
  const min = 0.9;
  const max = 3.3;
  const x = (p) => `${8 + ((p - min) / (max - min)) * 84}%`;
  const mate = items.find((r) => r.competitor.includes("Mate"));
  const volt = items.find((r) => r.competitor.includes("Volt"));
  const gap =
    mate && volt
      ? { left: mate.price, width: volt.price - mate.price }
      : null;
  const showRec = !items.some(
    (row) => row.lumen && Math.abs(row.price - recPrice) < 0.005,
  );

  function pickFromClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const t = (event.clientX - rect.left) / rect.width;
    const inner = (t - 0.08) / 0.84;
    const raw = min + inner * (max - min);
    onPickPrice(Math.min(PRICE_MAX, Math.max(PRICE_MIN, raw)));
  }

  return (
    <div
      className="shelf-line is-interactive"
      role="img"
      aria-label="Single-can price line. Click to set the live LUMEN price."
      onClick={pickFromClick}
    >
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
      {showRec && (
        <span className="shelf-dot is-rec" style={{ left: x(recPrice) }}>
          <strong>Rec</strong>
          {formatEur(recPrice)}
        </span>
      )}
      {items.map((row) => (
        <span
          key={row.competitor}
          className={row.lumen ? "shelf-dot is-lumen" : "shelf-dot"}
          style={{ left: x(row.price) }}
          onClick={(e) => {
            e.stopPropagation();
            onPickPrice(row.price);
          }}
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
  const { price, setPrice, shelfChannel, setShelfChannel, leadChannel } =
    useDecision();
  const rows = (shelf.byChannel.get(shelfChannel) ?? []).slice();
  const withLumen = [
    ...rows,
    {
      competitor: "LUMEN (live)",
      positioning: "Live decision",
      price,
      lumen: true,
    },
  ].sort((a, b) => a.price - b.price);
  const max = Math.max(shelf.maxPrice, ...withLumen.map((r) => r.price), price);

  return (
    <section id="shelf" className="shelf" aria-labelledby="shelf-title">
      <header className="tool-header">
        <p className="eyebrow">Competitive context · exhibit 2</p>
        <h2 id="shelf-title">Where the live price sits on the shelf</h2>
        <p className="lede">
          Single-can (330 ml) list prices from competitor_prices_by_channel.csv.
          The terracotta marker is the live LUMEN price (team rec is €2.19).
          Click a competitor — or the line — to match that price.
        </p>
      </header>

      <div className="chip-row" role="tablist" aria-label="Shelf channel">
        {SALES_CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            className={ch === shelfChannel ? "chip is-on" : "chip"}
            onClick={() => {
              setShelfChannel(ch);
              leadChannel(ch);
            }}
            aria-pressed={ch === shelfChannel}
          >
            {ch}
          </button>
        ))}
      </div>

      {withLumen.length > 1 && (
        <ShelfLine
          items={withLumen}
          recPrice={REC.price}
          onPickPrice={setPrice}
        />
      )}
      <p className="chart-hint">
        Click a brand to price-match. Channel tabs also lead the live sales mix
        toward that channel (70 / 15 / 15).
      </p>

      <ul className="shelf-list">
        {withLumen.map((row) => (
          <li
            key={row.competitor}
            className={row.lumen ? "is-lumen is-clickable" : "is-clickable"}
            onClick={() => setPrice(row.price)}
          >
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
        reason a stable {formatEur(LUMEN_PRICE)} is closer to premium than to mass.
      </p>
    </section>
  );
}

import React from "react";
import quotesCsv from "../data/customer_quotes.csv?raw";
import surveyCsv from "../data/customer_survey_anonymised.csv?raw";
import vwCsv from "../data/price_sensitivity_survey.csv?raw";
import { LUMEN_PRICE, buildSegmentCards } from "./exhibits.js";

const cards = buildSegmentCards(surveyCsv, vwCsv, quotesCsv, LUMEN_PRICE);

export default function VoicesSection() {
  return (
    <section id="voices" className="voices" aria-labelledby="voices-title">
      <header className="tool-header">
        <p className="eyebrow">Who you win, who you lose · exhibits 4–5 + 10</p>
        <h2 id="voices-title">Where the numbers and the verbatims disagree</h2>
        <p className="lede">
          “Not yet expensive” here is the Van Westendorp share whose{" "}
          <em>expensive</em> threshold is still above €2.19 — the same
          definition that reproduces the price-test 51.7% overall. It is a
          demand test, not a taste test. Quotes are the warning the averages
          hide. The survey extract has no names or emails.
        </p>
      </header>

      <div className="segment-grid">
        {cards.map((card) => (
          <article
            key={card.segment}
            className={
              card.notExpensive < 0.4 ? "segment-card is-risk" : "segment-card"
            }
          >
            <p className="stat-kicker">
              {(card.share * 100).toFixed(0)}% of the German sample · {card.n}{" "}
              respondents
            </p>
            <h3>{card.segment}</h3>
            <p
              className={
                card.notExpensive >= 0.8 ? "status is-pass" : "status is-miss"
              }
            >
              {(card.notExpensive * 100).toFixed(0)}% have not yet crossed
              “expensive” at €2.19
            </p>
            <dl className="segment-metrics">
              <div>
                <dt>Purchase intent</dt>
                <dd>{card.intent.toFixed(1)} / 10</dd>
              </div>
              <div>
                <dt>Price sensitivity</dt>
                <dd>{card.sens.toFixed(1)} / 10</dd>
              </div>
              <div>
                <dt>Cans / month</dt>
                <dd>{card.freq.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Buys through</dt>
                <dd>
                  {card.preferredChannel} {(card.preferredShare * 100).toFixed(0)}%
                </dd>
              </div>
            </dl>
            <ul className="segment-quotes">
              {card.quotes.map((q) => (
                <li key={q.quote.slice(0, 28)} className={`is-${q.sentiment}`}>
                  “{q.quote}”
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

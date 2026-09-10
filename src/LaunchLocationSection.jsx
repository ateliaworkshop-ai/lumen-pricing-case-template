import React, { useEffect, useState } from "react";
import { fetchGermanHouseholdIncome } from "./eurostat.js";
import IncomeMap from "./IncomeMap.jsx";

function formatIncome(value) {
  return `€${Math.round(value).toLocaleString("en-GB")}`;
}

export default function LaunchLocationSection() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchGermanHouseholdIncome(controller.signal)
      .then((result) => {
        setData(result);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Eurostat request failed");
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="launch" aria-labelledby="launch-title">
      <header className="tool-header">
        <p className="eyebrow">Where to launch · regional income</p>
        <h2 id="launch-title">Household income by German region</h2>
        <p className="lede">
          Live Eurostat data (nama_10r_2hhinc): net disposable income of private
          households, euro per inhabitant, NUTS 2 regions. Higher income is a
          purchasing-power signal for a first launch — not a recommendation.
          Price, channel, and payback still have to be read alongside this.
        </p>
      </header>

      {status === "loading" && (
        <p className="empty" role="status">
          Loading latest regional income from Eurostat…
        </p>
      )}

      {status === "error" && (
        <p className="limitation" role="alert">
          Eurostat could not be reached ({error}). The ranked table needs that
          live response, so it is not shown. Price/channel and payback above
          are unaffected.
        </p>
      )}

      {status === "ready" && data && (
        <>
          <p className="data-note launch-note">
            Ranked highest to lowest for {data.year} — the most recent year
            with German NUTS 2 values (2024 is published for some countries,
            not yet for Germany). Source: Eurostat API, fetched in this
            session. No region is marked as the launch pick.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>NUTS 2 region</th>
                  <th>Code</th>
                  <th>Disposable income / inhabitant</th>
                </tr>
              </thead>
              <tbody>
                {data.regions.map((region, i) => (
                  <tr key={region.code}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{region.name}</strong>
                    </td>
                    <td>{region.code}</td>
                    <td>{formatIncome(region.income)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <IncomeMap regions={data.regions} />
        </>
      )}
    </section>
  );
}

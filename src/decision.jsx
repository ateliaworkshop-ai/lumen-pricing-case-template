import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import priceTestCsv from "../data/price_test_results.csv?raw";
import economicsCsv from "../data/channel_economics.csv?raw";
import costCsv from "../data/cost_breakdown.csv?raw";
import funnelCsv from "../data/marketing_funnel_monthly.csv?raw";
import surveyCsv from "../data/customer_survey_anonymised.csv?raw";
import vwCsv from "../data/price_sensitivity_survey.csv?raw";
import {
  DATA_LTV_MONTHS,
  DEFAULT_YEAR1_BUDGET,
  PRICE_MAX,
  PRICE_MIN,
  REC,
  SALES_CHANNELS,
  defaultMarketingShares,
  loadCockpitData,
  simulateCockpit,
  vsRecommendation,
  weightedMarketingCac,
} from "./cockpit.js";
import { clamp, round2 } from "./chartPointer.js";
import { fetchGermanHouseholdIncome } from "./eurostat.js";
import { buildSeasonality } from "./exhibits.js";
import seasonCsv from "../data/seasonality_and_weather.csv?raw";

const DecisionContext = createContext(null);

export const cockpitData = loadCockpitData({
  priceTestCsv,
  economicsCsv,
  costCsv,
  funnelCsv,
  surveyCsv,
  vwCsv,
});

export const DEFAULT_MKT = defaultMarketingShares(cockpitData.marketingCacs);
export const season = buildSeasonality(seasonCsv);

function clampPrice(value) {
  return round2(clamp(Number(value), PRICE_MIN, PRICE_MAX));
}

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

export function DecisionProvider({ children }) {
  const [price, setPriceRaw] = useState(REC.price);
  const [shares, setShares] = useState({ ...REC.channelShares });
  const [mktShares, setMktShares] = useState({ ...DEFAULT_MKT });
  const [year1Budget, setYear1Budget] = useState(DEFAULT_YEAR1_BUDGET);
  const [lifetimeMonths, setLifetimeMonths] = useState(DATA_LTV_MONTHS);
  const [regionCode, setRegionCode] = useState(REC.regionCode);
  const [launchMonth, setLaunchMonth] = useState(0);
  const [shelfChannel, setShelfChannel] = useState("Retail/Grocery");
  const [regions, setRegions] = useState([]);
  const [regionYear, setRegionYear] = useState(null);
  const [regionStatus, setRegionStatus] = useState("loading");
  const [regionError, setRegionError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchGermanHouseholdIncome(controller.signal)
      .then((result) => {
        setRegions(result.regions);
        setRegionYear(result.year);
        setRegionStatus("ready");
        setRegionCode((current) => current || result.regions[0]?.code || "");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setRegionError(err.message || "Eurostat unavailable");
        setRegionStatus("error");
      });
    return () => controller.abort();
  }, []);

  const setPrice = useCallback((value) => {
    setPriceRaw(clampPrice(value));
  }, []);

  const setShare = useCallback((channel, value) => {
    setShares((prev) => ({ ...prev, [channel]: Number(value) }));
  }, []);

  const setMktShare = useCallback((channel, value) => {
    setMktShares((prev) => ({ ...prev, [channel]: Number(value) }));
  }, []);

  const toggleChannel = useCallback((channel) => {
    setShares((prev) => {
      const next = { ...prev };
      if ((Number(next[channel]) || 0) > 0) next[channel] = 0;
      else next[channel] = REC.channelShares[channel] || 33;
      return next;
    });
  }, []);

  const leadChannel = useCallback((channel) => {
    if (!SALES_CHANNELS.includes(channel)) return;
    setShares({
      "DTC Online": channel === "DTC Online" ? 70 : 15,
      "Retail/Grocery": channel === "Retail/Grocery" ? 70 : 15,
      "Gym & Office": channel === "Gym & Office" ? 70 : 15,
    });
  }, []);

  const boostMktChannel = useCallback((channel) => {
    setMktShares((prev) => {
      const keys = Object.keys(prev);
      if (!keys.includes(channel)) return prev;
      const others = keys.filter((k) => k !== channel);
      const boosted = Math.min(80, (Number(prev[channel]) || 0) + 20);
      const leftover = 100 - boosted;
      const otherTotal = others.reduce((s, k) => s + (Number(prev[k]) || 0), 0);
      const next = { [channel]: boosted };
      if (others.length === 0) return { ...prev, [channel]: boosted };
      if (otherTotal <= 0) {
        const each = leftover / others.length;
        others.forEach((k) => {
          next[k] = each;
        });
      } else {
        others.forEach((k) => {
          next[k] = leftover * ((Number(prev[k]) || 0) / otherTotal);
        });
      }
      return Object.fromEntries(
        keys.map((k) => [k, Math.round(Number(next[k]) || 0)]),
      );
    });
  }, []);

  const applyPatch = useCallback((patch) => {
    if (!patch) return;
    if (patch.price != null) setPriceRaw(clampPrice(patch.price));
    if (patch.lifetimeMonths != null) setLifetimeMonths(patch.lifetimeMonths);
    if (patch.channelShares) setShares({ ...patch.channelShares });
    if (patch.mktShares) setMktShares({ ...patch.mktShares });
    if (patch.year1Budget != null) setYear1Budget(patch.year1Budget);
    if (patch.regionCode) setRegionCode(patch.regionCode);
    if (patch.launchMonth != null) setLaunchMonth(patch.launchMonth);
  }, []);

  const resetToRec = useCallback(() => {
    setPriceRaw(REC.price);
    setShares({ ...REC.channelShares });
    setMktShares({ ...DEFAULT_MKT });
    setYear1Budget(DEFAULT_YEAR1_BUDGET);
    setLifetimeMonths(REC.lifetimeMonths);
    setRegionCode(REC.regionCode);
    setLaunchMonth(0);
    setShelfChannel("Retail/Grocery");
  }, []);

  const cac = useMemo(
    () => weightedMarketingCac(cockpitData.marketingCacs, mktShares),
    [mktShares],
  );

  const recCac = useMemo(
    () => weightedMarketingCac(cockpitData.marketingCacs, DEFAULT_MKT),
    [],
  );

  const sim = useMemo(
    () =>
      simulateCockpit(cockpitData, {
        price,
        channelShares: shares,
        year1Budget,
        lifetimeMonths,
        cac,
      }),
    [price, shares, year1Budget, lifetimeMonths, cac],
  );

  const recSim = useMemo(
    () =>
      simulateCockpit(cockpitData, {
        price: REC.price,
        channelShares: REC.channelShares,
        year1Budget,
        lifetimeMonths: REC.lifetimeMonths,
        cac: recCac,
      }),
    [year1Budget, recCac],
  );

  const vs = useMemo(
    () => vsRecommendation(sim, recSim, regionCode, mktShares, DEFAULT_MKT),
    [sim, recSim, regionCode, mktShares],
  );

  const fundedChannels = useMemo(
    () => SALES_CHANNELS.filter((ch) => (Number(shares[ch]) || 0) > 0),
    [shares],
  );

  const selectedRegion = regions.find((r) => r.code === regionCode);
  const monthLabel =
    launchMonth === 0
      ? "Full year"
      : (season.months.find((m) => m.month === launchMonth)?.label ?? "Full year");

  const value = useMemo(
    () => ({
      price,
      setPrice,
      shares,
      setShares,
      setShare,
      toggleChannel,
      leadChannel,
      mktShares,
      setMktShares,
      setMktShare,
      boostMktChannel,
      year1Budget,
      setYear1Budget,
      lifetimeMonths,
      setLifetimeMonths,
      regionCode,
      setRegionCode,
      launchMonth,
      setLaunchMonth,
      shelfChannel,
      setShelfChannel,
      regions,
      regionYear,
      regionStatus,
      regionError,
      selectedRegion,
      cockpitData,
      defaultMkt: DEFAULT_MKT,
      cac,
      sim,
      recSim,
      vs,
      resetToRec,
      applyPatch,
      fundedChannels,
      monthLabel,
    }),
    [
      price,
      setPrice,
      shares,
      setShare,
      toggleChannel,
      leadChannel,
      mktShares,
      setMktShare,
      boostMktChannel,
      year1Budget,
      lifetimeMonths,
      regionCode,
      launchMonth,
      shelfChannel,
      regions,
      regionYear,
      regionStatus,
      regionError,
      selectedRegion,
      cac,
      sim,
      recSim,
      vs,
      resetToRec,
      applyPatch,
      fundedChannels,
      monthLabel,
    ],
  );

  return (
    <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>
  );
}

export function useDecision() {
  const ctx = useContext(DecisionContext);
  if (!ctx) {
    throw new Error("useDecision must be used inside DecisionProvider");
  }
  return ctx;
}

export function DecisionBar() {
  const {
    price,
    setPrice,
    shares,
    sim,
    vs,
    resetToRec,
    selectedRegion,
    monthLabel,
    regions,
    regionCode,
    setRegionCode,
    launchMonth,
    setLaunchMonth,
  } = useDecision();

  const mix = SALES_CHANNELS.map(
    (ch) => `${shortChannel(ch)} ${Math.round(shares[ch] || 0)}%`,
  ).join(" · ");

  return (
    <div className="decision-bar" role="region" aria-label="Live decision">
      <div className="decision-bar-price">
        <label htmlFor="live-price">Live price</label>
        <input
          id="live-price"
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <strong>{formatEur(price)}</strong>
      </div>
      <p className="decision-bar-meta">
        {mix}
        {selectedRegion ? ` · ${selectedRegion.name}` : ""} · {monthLabel}
      </p>
      <div className="decision-bar-kpis" aria-label="Live outputs">
        <span>{sim.acceptance.toFixed(1)}% acc.</span>
        <span>{formatRatio(sim.blendRatio)}</span>
        <span>{formatEur(sim.year1Net, 0)} net</span>
      </div>
      <div className="decision-bar-actions">
        {regions.length > 0 && (
          <select
            aria-label="Launch region"
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
          >
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Launch month"
          value={launchMonth}
          onChange={(e) => setLaunchMonth(Number(e.target.value))}
        >
          <option value={0}>Full year</option>
          {season.months.map((m) => (
            <option key={m.month} value={m.month}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={vs.onRec ? "chip is-on" : "chip"}
          onClick={resetToRec}
        >
          {vs.onRec ? "On rec" : "Reset rec"}
        </button>
      </div>
    </div>
  );
}

function shortChannel(channel) {
  if (channel.startsWith("Retail")) return "Retail";
  if (channel.startsWith("Gym")) return "Gym";
  return "DTC";
}

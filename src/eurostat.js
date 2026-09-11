export const EUROSTAT_URL =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nama_10r_2hhinc?format=JSON&lang=EN&geoLevel=nuts2&unit=EUR_HAB&direct=BAL&na_item=B6N&lastTimePeriod=6";

const FETCH_MS = 15000;

export async function fetchGermanHouseholdIncome(signal) {
  const timeout = AbortSignal.timeout(FETCH_MS);
  const combined = abortAny(signal, timeout);
  const response = await fetch(EUROSTAT_URL, { signal: combined });
  if (!response.ok) {
    throw new Error(`Eurostat responded ${response.status}`);
  }
  const dataset = await response.json();
  return parseGermanNuts2(dataset);
}

function abortAny(...signals) {
  const controller = new AbortController();
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}

/** Flatten a JSON-stat 2.0 cube into row objects. */
export function jsonStatRows(dataset) {
  if (!dataset?.id || !dataset?.size || !dataset?.dimension || !dataset?.value) {
    throw new Error("Eurostat response is not JSON-stat data");
  }

  const dims = dataset.id.map((id) => {
    const category = dataset.dimension[id]?.category;
    if (!category?.index) {
      throw new Error(`Missing JSON-stat dimension: ${id}`);
    }
    const codes = Object.entries(category.index)
      .sort((a, b) => a[1] - b[1])
      .map(([code]) => code);
    return { id, codes, labels: category.label ?? {} };
  });

  const sizes = dataset.size;
  const rows = [];

  for (const [key, value] of Object.entries(dataset.value)) {
    if (value == null) continue;
    let n = Number(key);
    const coord = new Array(sizes.length);
    for (let i = sizes.length - 1; i >= 0; i--) {
      coord[i] = n % sizes[i];
      n = Math.floor(n / sizes[i]);
    }
    const row = { value: Number(value) };
    dims.forEach((dim, i) => {
      const code = dim.codes[coord[i]];
      row[dim.id] = code;
      row[`${dim.id}Label`] = dim.labels[code] ?? code;
    });
    rows.push(row);
  }

  return rows;
}

export function parseGermanNuts2(dataset) {
  const rows = jsonStatRows(dataset).filter((row) => {
    const geo = String(row.geo ?? "");
    return geo.startsWith("DE") && geo.length === 4;
  });

  if (rows.length === 0) {
    throw new Error("No German NUTS 2 values in the Eurostat response");
  }

  const latestYear = rows.reduce((max, row) => {
    const year = String(row.time);
    return year > max ? year : max;
  }, "");

  const ranked = rows
    .filter((row) => String(row.time) === latestYear)
    .map((row) => ({
      code: row.geo,
      name: row.geoLabel,
      year: latestYear,
      income: row.value,
      unit: row.unitLabel || "Euro per inhabitant",
    }))
    .sort((a, b) => b.income - a.income);

  if (ranked.length === 0) {
    throw new Error("German NUTS 2 rows had no values for the latest year");
  }

  return { year: latestYear, regions: ranked };
}

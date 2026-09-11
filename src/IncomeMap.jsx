import React, { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL =
  "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2024_4326_LEVL_2.geojson";

function formatIncome(value) {
  return `€${Math.round(value).toLocaleString("en-GB")}`;
}

function fillFor(t) {
  const light = [230, 223, 210];
  const dark = [44, 74, 56];
  const mix = light.map((c, i) => Math.round(c + (dark[i] - c) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

export default function IncomeMap({ regions, highlightCode, onSelect }) {
  const [geographies, setGeographies] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [hover, setHover] = useState(null);

  const byCode = useMemo(() => {
    const map = new Map();
    for (const region of regions) map.set(region.code, region);
    return map;
  }, [regions]);

  const [min, max] = useMemo(() => {
    const values = regions.map((r) => r.income);
    return [Math.min(...values), Math.max(...values)];
  }, [regions]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(GEO_URL, { signal: abortAny(controller.signal, AbortSignal.timeout(15000)) })
      .then((res) => {
        if (!res.ok) throw new Error(`Map data responded ${res.status}`);
        return res.json();
      })
      .then((fc) => {
        const features = (fc.features ?? []).filter(
          (f) => f.properties?.CNTR_CODE === "DE",
        );
        if (features.length === 0) {
          throw new Error("No German NUTS 2 polygons in the GeoJSON");
        }
        setGeographies({ type: "FeatureCollection", features });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setMapError(err.message || "Map outlines could not be loaded");
      });
    return () => controller.abort();
  }, []);

  if (mapError) {
    return (
      <p className="limitation" role="status">
        The ranked table above is the source of truth. The map could not be
        drawn ({mapError}).
      </p>
    );
  }

  if (!geographies) {
    return (
      <p className="empty" role="status">
        Loading map outlines…
      </p>
    );
  }

  return (
    <div className="choropleth">
      <h3>Income map</h3>
      <p className="stat-note">
        Darker green = higher disposable income per inhabitant. Click a region
        to set it as the live launch frame. Same live Eurostat values as the
        table.{" "}
        {highlightCode
          ? "The live pick is outlined in terracotta."
          : "No region is singled out as the launch pick."}
      </p>
      <div className="map-frame">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [10.4, 51.2], scale: 2400 }}
          width={800}
          height={780}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={geographies}>
            {({ geographies: feats }) =>
              feats.map((geo) => {
                const code = geo.properties?.NUTS_ID;
                const region = byCode.get(code);
                const t =
                  region && max !== min
                    ? (region.income - min) / (max - min)
                    : 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={region ? fillFor(t) : "#ddd8cc"}
                    stroke={code === highlightCode ? "#8a3d28" : "#f4efe6"}
                    strokeWidth={code === highlightCode ? 1.8 : 0.7}
                    onMouseEnter={() =>
                      setHover(
                        region
                          ? `${region.name} · ${formatIncome(region.income)}`
                          : `${code} · no income figure`,
                      )
                    }
                    onMouseLeave={() => setHover(null)}
                    onClick={() => region && onSelect?.(code)}
                    style={{
                      default: { outline: "none", cursor: onSelect ? "pointer" : "default" },
                      hover: { outline: "none", fill: "#8a3d28", cursor: onSelect ? "pointer" : "default" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        {hover && <p className="map-tooltip">{hover}</p>}
      </div>
      <p className="map-legend" aria-hidden="true">
        <span>Lower</span>
        <span className="map-legend-bar" />
        <span>Higher</span>
      </p>
    </div>
  );
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

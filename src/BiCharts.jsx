import React, { useMemo, useState } from "react";

const PALETTE = ["#2c4a38", "#8a3d28", "#c47b17", "#5b7a66", "#1c2418", "#8a5a14"];

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function donutPath(cx, cy, rOut, rIn, start, end) {
  const sweep = Math.max(0, Math.min(360, end - start));
  if (sweep < 0.5) return "";
  if (sweep >= 359.5) {
    return [
      `M ${cx} ${cy - rOut}`,
      `A ${rOut} ${rOut} 0 1 1 ${cx} ${cy + rOut}`,
      `A ${rOut} ${rOut} 0 1 1 ${cx} ${cy - rOut}`,
      `M ${cx} ${cy - rIn}`,
      `A ${rIn} ${rIn} 0 1 0 ${cx} ${cy + rIn}`,
      `A ${rIn} ${rIn} 0 1 0 ${cx} ${cy - rIn}`,
      "Z",
    ].join(" ");
  }
  const [x1, y1] = polar(cx, cy, rOut, start);
  const [x2, y2] = polar(cx, cy, rOut, end);
  const [x3, y3] = polar(cx, cy, rIn, end);
  const [x4, y4] = polar(cx, cy, rIn, start);
  const large = sweep > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`;
}

function piePath(cx, cy, r, start, end) {
  const sweep = Math.max(0, Math.min(360, end - start));
  if (sweep < 0.5) return "";
  if (sweep >= 359.5) {
    return `M ${cx} ${cy} m 0 ${-r} a ${r} ${r} 0 1 1 0 ${r * 2} a ${r} ${r} 0 1 1 0 ${-r * 2}`;
  }
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

function slicesFrom(items) {
  const total = items.reduce((s, d) => s + Math.max(0, d.value), 0);
  if (total <= 0) return { total: 0, slices: [] };
  let angle = 0;
  const slices = items.map((d, i) => {
    const sweep = (Math.max(0, d.value) / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return {
      ...d,
      start,
      end,
      pct: (Math.max(0, d.value) / total) * 100,
      color: d.color || PALETTE[i % PALETTE.length],
    };
  });
  return { total, slices };
}

export function PieChart({ items, donut = false, size = 220, onSelect, center }) {
  const { slices } = useMemo(() => slicesFrom(items), [items]);
  const [hover, setHover] = useState(null);
  const cx = size / 2;
  const cy = size / 2;
  const rOut = size * 0.42;
  const rIn = donut ? size * 0.24 : 0;
  const active = hover != null ? slices[hover] : null;

  if (!slices.length) {
    return <p className="empty">No mix to chart — fund at least one slice.</p>;
  }

  return (
    <div className="bi-chart">
      <svg
        className="bi-svg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={donut ? "Donut chart" : "Pie chart"}
      >
        {slices.map((s, i) => (
          <path
            key={s.key || s.label}
            className={onSelect ? "bi-slice is-clickable" : "bi-slice"}
            d={
              donut
                ? donutPath(cx, cy, rOut, rIn, s.start, s.end)
                : piePath(cx, cy, rOut, s.start, s.end)
            }
            fill={s.color}
            fillRule="evenodd"
            opacity={hover == null || hover === i ? 1 : 0.45}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect?.(s)}
          />
        ))}
        {donut && center && (
          <text className="bi-center" x={cx} y={cy + 4} textAnchor="middle">
            {center}
          </text>
        )}
      </svg>
      <ul className="bi-legend">
        {slices.map((s, i) => (
          <li key={s.key || s.label}>
            <button
              type="button"
              className={hover === i ? "bi-leg is-on" : "bi-leg"}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(s)}
            >
              <span className="bi-swatch" style={{ background: s.color }} />
              {s.label}
              <strong>{s.pct.toFixed(0)}%</strong>
            </button>
          </li>
        ))}
      </ul>
      {active && (
        <p className="bi-tip">
          {active.label} · {active.pct.toFixed(1)}%
          {active.hint ? ` · ${active.hint}` : ""}
        </p>
      )}
    </div>
  );
}

export function BarChart({ items, format = (v) => String(v), onSelect }) {
  const max = Math.max(...items.map((d) => Math.abs(d.value)), 0.01);
  return (
    <ul className="bi-bars">
      {items.map((d, i) => {
        const width = (Math.abs(d.value) / max) * 100;
        const negative = d.value < 0;
        return (
          <li key={d.key || d.label}>
            <button
              type="button"
              className={onSelect ? "bi-bar-row is-clickable" : "bi-bar-row"}
              onClick={() => onSelect?.(d)}
            >
              <span className="bi-bar-label">{d.label}</span>
              <span className="bi-bar-track" aria-hidden="true">
                <span
                  className={negative ? "is-neg" : "is-pos"}
                  style={{
                    width: `${width}%`,
                    background: d.color || PALETTE[i % PALETTE.length],
                    marginLeft: negative ? `${100 - width}%` : 0,
                  }}
                />
              </span>
              <span className="bi-bar-val">{format(d.value)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function Gauge({ value, max = 4, target = 3, label }) {
  const clamped = Math.max(0, Math.min(max, Number(value) || 0));
  const start = 270;
  const sweep = (clamped / max) * 180;
  const tgtSweep = (target / max) * 180;
  const cx = 110;
  const cy = 108;
  const r = 78;
  const needleAngle = start + sweep;
  const [nx, ny] = polar(cx, cy, r - 10, needleAngle);
  const [tx1, ty1] = polar(cx, cy, r - 16, start + tgtSweep);
  const [tx2, ty2] = polar(cx, cy, r + 4, start + tgtSweep);
  return (
    <div className="bi-chart">
      <svg className="bi-svg" viewBox="0 0 220 128" role="img" aria-label={label}>
        <path
          d={donutPath(cx, cy, r, r - 14, start, start + 180)}
          fill="#e6dfd2"
          fillRule="evenodd"
        />
        <path
          d={donutPath(cx, cy, r, r - 14, start, start + sweep)}
          fill={clamped >= target ? "#2c4a38" : "#8a3d28"}
          fillRule="evenodd"
        />
        <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} className="bi-target" />
        <circle cx={cx} cy={cy} r="5" fill="#1c2418" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} className="bi-needle" />
        <text className="bi-center" x={cx} y={cy + 22} textAnchor="middle">
          {label}
        </text>
      </svg>
    </div>
  );
}

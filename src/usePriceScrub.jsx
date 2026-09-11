import React, { useEffect, useRef, useState } from "react";
import { priceFromSvgEvent } from "./chartPointer.js";

export function usePriceScrub({
  scale,
  livePrice,
  recPrice,
  onSetPrice,
  onPin,
}) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState(null);

  function read(event) {
    return priceFromSvgEvent(event, scale);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onWheel = (event) => {
      if (document.activeElement !== el) return;
      event.preventDefault();
      const step = event.shiftKey ? 0.1 : 0.01;
      const dir = event.deltaY > 0 ? -step : step;
      onSetPrice(livePrice + dir);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [livePrice, onSetPrice]);

  return {
    ref,
    hover,
    svgProps: {
      ref,
      tabIndex: 0,
      role: "slider",
      "aria-valuemin": scale.min,
      "aria-valuemax": scale.max,
      "aria-valuenow": livePrice,
      "aria-valuetext": `€${Number(livePrice).toFixed(2)}`,
      onPointerDown: (event) => {
        if (event.button != null && event.button !== 0) return;
        const price = read(event);
        if (event.shiftKey) {
          onPin?.(price);
          return;
        }
        dragging.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        onSetPrice(price);
      },
      onPointerMove: (event) => {
        const price = read(event);
        setHover(price);
        if (dragging.current) onSetPrice(price);
      },
      onPointerUp: (event) => {
        dragging.current = false;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      },
      onPointerCancel: () => {
        dragging.current = false;
      },
      onPointerLeave: () => {
        if (!dragging.current) setHover(null);
      },
      onDoubleClick: (event) => {
        event.preventDefault();
        onSetPrice(recPrice);
      },
      onKeyDown: (event) => {
        const step = event.shiftKey ? 0.1 : 0.01;
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          event.preventDefault();
          onSetPrice(livePrice - step);
        } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          event.preventDefault();
          onSetPrice(livePrice + step);
        } else if (event.key === "Home") {
          event.preventDefault();
          onSetPrice(recPrice);
        } else if (event.key === "Escape") {
          onPin?.(null);
        }
      },
    },
  };
}

export function ChartTooltip({ xPct, children }) {
  if (children == null) return null;
  const left = Math.min(92, Math.max(8, xPct));
  return (
    <div className="chart-tooltip-card" style={{ left: `${left}%` }}>
      {children}
    </div>
  );
}

export function indexFromSvgEvent(event, { width = 800, padLeft, padRight, count }) {
  const svg = event.currentTarget;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || count < 1) return 0;
  const x = ((event.clientX - rect.left) / rect.width) * width;
  const inner = width - padLeft - padRight;
  const t = (x - padLeft) / inner;
  const i = Math.round(t * (count - 1));
  return Math.min(count - 1, Math.max(0, i));
}

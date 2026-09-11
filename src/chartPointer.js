export function priceFromSvgEvent(
  event,
  { width = 800, padLeft, padRight, min, max },
) {
  const svg = event.currentTarget;
  const rect = svg.getBoundingClientRect();
  if (!rect.width) return min;
  const x = ((event.clientX - rect.left) / rect.width) * width;
  const inner = width - padLeft - padRight;
  const t = (x - padLeft) / inner;
  const raw = min + t * (max - min);
  return round2(clamp(raw, min, max));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

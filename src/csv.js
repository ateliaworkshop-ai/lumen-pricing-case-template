export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    headers.forEach((header, i) => {
      const raw = cols[i];
      const num = Number(raw);
      row[header] = raw !== "" && !Number.isNaN(num) ? num : raw;
    });
    return row;
  });
}

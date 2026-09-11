export const TEAM_IDS = ["combined", "cmo", "cfo", "launch"];

export const NAV_LINKS = [
  { id: "recommendation", label: "Rec" },
  { id: "dashboard", label: "Board" },
  { id: "explorer", label: "Price" },
  { id: "price-cac", label: "CAC" },
  { id: "shelf", label: "Shelf" },
  { id: "van-westendorp", label: "VW" },
  { id: "voices", label: "Who" },
  { id: "payback", label: "Payback" },
  { id: "timing", label: "Timing" },
  { id: "launch", label: "Map" },
  { id: "integrity", label: "Caveats" },
  { id: "cockpit", label: "Cockpit" },
];

const ALL = NAV_LINKS.map((l) => l.id);

export const TEAMS = [
  {
    id: "combined",
    label: "All teams",
    kicker: "Shared room",
    role: "Full exhibit set. Use this in a joint review so CMO, CFO, and launch see the same page.",
    sections: ALL,
  },
  {
    id: "cmo",
    label: "CMO · brand",
    kicker: "Premium & who we win",
    role: "Price as positioning. Urban Wellness comfort, the empty shelf vs VoltFit, and the Van Westendorp gap we are choosing to sit above.",
    sections: [
      "recommendation",
      "dashboard",
      "shelf",
      "van-westendorp",
      "voices",
      "launch",
      "integrity",
    ],
  },
  {
    id: "cfo",
    label: "CFO · payback",
    kicker: "CAC, LTV, year-1 net",
    role: "Whether marketing pays back. Same blended CAC on every sales channel — mix sampling vs referral, not DTC vs grocery.",
    sections: [
      "recommendation",
      "dashboard",
      "explorer",
      "price-cac",
      "payback",
      "cockpit",
      "integrity",
    ],
  },
  {
    id: "launch",
    label: "Launch · Germany",
    kicker: "Where and when",
    role: "First region and seasonality only. No German LUMEN sales exist, so income and the seasonality index are context, not a forecast.",
    sections: [
      "recommendation",
      "dashboard",
      "explorer",
      "timing",
      "launch",
      "integrity",
      "cockpit",
    ],
  },
];

export const NOTE_TEAMS = TEAMS.filter((t) => t.id !== "combined");

export function teamById(id) {
  return TEAMS.find((t) => t.id === id) ?? TEAMS[0];
}

export function teamSees(teamId, sectionId) {
  return teamById(teamId).sections.includes(sectionId);
}

export function emptyNotes() {
  return { cmo: "", cfo: "", launch: "" };
}

export function snapshotFromState(state) {
  return {
    v: 1,
    price: state.price,
    shares: state.shares,
    mktShares: state.mktShares,
    year1Budget: state.year1Budget,
    lifetimeMonths: state.lifetimeMonths,
    regionCode: state.regionCode,
    launchMonth: state.launchMonth,
    team: state.team,
    notes: state.notes,
    from: state.from ?? state.team,
  };
}

export function parseDecisionHash(hash) {
  const raw = String(hash || "").replace(/^#/, "");
  if (!raw.startsWith("d=")) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(2)));
    if (!parsed || parsed.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function decisionHash(snapshot) {
  return `#d=${encodeURIComponent(JSON.stringify(snapshot))}`;
}

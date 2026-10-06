const KEY = "terinyan:save:v1";
const VERSION = 1;

export type SaveState = {
  version: number;
  completed: number[];
  bestTimes: Record<string, number>;
  currentCampaign: number;
  dailyClears: string[];
  sound: boolean;
  autoMark: boolean;
};

const defaults: SaveState = {
  version: VERSION,
  completed: [],
  bestTimes: {},
  currentCampaign: 1,
  dailyClears: [],
  sound: true,
  autoMark: true,
};

function migrate(raw: Partial<SaveState> & { version?: number }): SaveState {
  return {
    ...defaults,
    ...raw,
    version: VERSION,
    completed: Array.isArray(raw.completed) ? raw.completed : [],
    bestTimes: raw.bestTimes && typeof raw.bestTimes === "object" ? raw.bestTimes : {},
    dailyClears: Array.isArray(raw.dailyClears) ? raw.dailyClears : [],
    currentCampaign: typeof raw.currentCampaign === "number" ? raw.currentCampaign : 1,
    sound: raw.sound ?? true,
    autoMark: raw.autoMark ?? true,
  };
}

export function loadSave(): SaveState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults, completed: [], bestTimes: {}, dailyClears: [] };
    return migrate(JSON.parse(raw) as Partial<SaveState>);
  } catch {
    return { ...defaults, completed: [], bestTimes: {}, dailyClears: [] };
  }
}

export function writeSave(state: SaveState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota */
  }
}

export function markCompleted(
  state: SaveState,
  idKey: string,
  campaignN: number | null,
  timeMs: number,
): SaveState {
  const next: SaveState = {
    ...state,
    bestTimes: { ...state.bestTimes },
    completed: [...state.completed],
    dailyClears: [...state.dailyClears],
  };
  const prev = next.bestTimes[idKey];
  if (prev === undefined || timeMs < prev) next.bestTimes[idKey] = timeMs;
  if (campaignN !== null) {
    if (!next.completed.includes(campaignN)) next.completed.push(campaignN);
    next.completed.sort((a, b) => a - b);
    next.currentCampaign = Math.max(next.currentCampaign, Math.min(200, campaignN + 1));
  } else if (idKey.startsWith("daily:")) {
    const date = idKey.slice("daily:".length);
    if (!next.dailyClears.includes(date)) next.dailyClears.push(date);
  }
  writeSave(next);
  return next;
}

export function idKeyOf(kind: "campaign" | "daily", nOrDate: number | string): string {
  return kind === "campaign" ? `campaign:${nOrDate}` : `daily:${nOrDate}`;
}

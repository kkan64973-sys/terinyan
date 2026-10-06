import { generateWithRetry } from "./generator";
import type { DifficultyBand, LevelId, Puzzle } from "./types";

export const CAMPAIGN_LEVELS = 200;

export function campaignSpec(level: number): {
  size: number;
  compact: number;
  givens: number;
  band: DifficultyBand;
} {
  const n = Math.max(1, Math.floor(level));
  if (n <= 6) return { size: 4, compact: 0.92, givens: 1, band: "kit" };
  if (n <= 16) return { size: 5, compact: 0.85, givens: 1, band: "easy" };
  if (n <= 32) return { size: 6, compact: 0.78, givens: n <= 24 ? 1 : 0, band: "easy" };
  if (n <= 52) return { size: 6, compact: 0.62, givens: 0, band: "normal" };
  if (n <= 80) return { size: 7, compact: 0.58, givens: 0, band: "normal" };
  if (n <= 110) return { size: 8, compact: 0.5, givens: 0, band: "hard" };
  if (n <= 150) return { size: 9, compact: 0.42, givens: 0, band: "expert" };
  return { size: 10, compact: 0.35, givens: 0, band: "master" };
}

export function bandLabel(band: DifficultyBand): string {
  switch (band) {
    case "kit":
      return "入門";
    case "easy":
      return "やさしい";
    case "normal":
      return "ふつう";
    case "hard":
      return "難しい";
    case "expert":
      return "上級";
    case "master":
      return "極";
  }
}

export function levelTitle(id: LevelId): string {
  if (id.kind === "daily") return `今日の一問 ${id.date}`;
  return `レベル ${id.n}`;
}

export function seedFor(id: LevelId): string {
  if (id.kind === "daily") return `terinyan:daily:v1:${id.date}`;
  return `terinyan:campaign:v1:${id.n}`;
}

function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dailyId(now = new Date()): Extract<LevelId, { kind: "daily" }> {
  return { kind: "daily", date: todayIso(now) };
}

export function dailySpec(date: string): { size: number; compact: number; givens: number } {
  const day = new Date(`${date}T12:00:00`).getDay();
  const sizes = [6, 6, 7, 7, 8, 8, 9];
  const size = sizes[day] ?? 7;
  return { size, compact: 0.5, givens: 0 };
}

const cache = new Map<string, Puzzle>();

export function loadPuzzle(id: LevelId): Puzzle {
  const key = seedFor(id);
  const hit = cache.get(key);
  if (hit) return hit;

  if (id.kind === "daily") {
    const spec = dailySpec(id.date);
    const puzzle = generateWithRetry({
      size: spec.size,
      seed: key,
      compact: spec.compact,
      givens: spec.givens,
    });
    cache.set(key, puzzle);
    return puzzle;
  }

  const spec = campaignSpec(id.n);
  const puzzle = generateWithRetry({
    size: spec.size,
    seed: key,
    compact: spec.compact,
    givens: spec.givens,
  });
  cache.set(key, puzzle);
  return puzzle;
}

export function nextCampaign(n: number): LevelId {
  return { kind: "campaign", n: Math.min(CAMPAIGN_LEVELS, n + 1) };
}

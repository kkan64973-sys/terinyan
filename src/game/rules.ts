import type { Coord, Puzzle } from "./types";

export const CHEBYSHEV_TOUCH = 1;

export function catsTouch(a: Coord, b: Coord): boolean {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c)) === CHEBYSHEV_TOUCH;
}

export function inBounds(size: number, r: number, c: number): boolean {
  return r >= 0 && c >= 0 && r < size && c < size;
}

export function neighbors8(size: number, r: number, c: number): Coord[] {
  const out: Coord[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (inBounds(size, rr, cc)) out.push({ r: rr, c: cc });
    }
  }
  return out;
}

/** Cells a placed cat immediately rules out (row, col, region, 8-neighborhood). */
export function blockedByCat(puzzle: Puzzle, r: number, c: number): Coord[] {
  const { size, regions } = puzzle;
  const region = regions[r]![c]!;
  const seen = new Set<string>([`${r},${c}`]);
  const out: Coord[] = [];
  const add = (rr: number, cc: number) => {
    const k = `${rr},${cc}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ r: rr, c: cc });
  };
  for (let i = 0; i < size; i++) {
    add(r, i);
    add(i, c);
  }
  for (let rr = 0; rr < size; rr++) {
    for (let cc = 0; cc < size; cc++) {
      if (regions[rr]![cc] === region) add(rr, cc);
    }
  }
  for (const n of neighbors8(size, r, c)) add(n.r, n.c);
  return out;
}

export function isSolutionCell(puzzle: Puzzle, r: number, c: number): boolean {
  return puzzle.solution[r] === c;
}

export function givenAt(puzzle: Puzzle, r: number, c: number): boolean {
  return puzzle.givens.some((g) => g.r === r && g.c === c);
}

export function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

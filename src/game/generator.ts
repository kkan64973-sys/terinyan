import { pick, randInt, rngFromSeed, shuffle, type Rng } from "./rng";
import { countSolutions } from "./solver";
import type { Coord, Puzzle } from "./types";

const DIRS4: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function generatePlacement(n: number, rng: Rng): number[] {
  const used = new Array<boolean>(n).fill(false);
  const perm = new Array<number>(n).fill(-1);

  function search(row: number): boolean {
    if (row === n) return true;
    for (const col of shuffle(rng, [...Array.from({ length: n }, (_, i) => i)])) {
      if (used[col]) continue;
      if (row > 0 && Math.abs(col - perm[row - 1]!) < 2) continue;
      used[col] = true;
      perm[row] = col;
      if (search(row + 1)) return true;
      perm[row] = -1;
      used[col] = false;
    }
    return false;
  }

  if (!search(0)) {
    throw new Error(`no separated permutation for n=${n}`);
  }
  return perm;
}

function growRegions(n: number, perm: number[], rng: Rng, compact: number): number[][] {
  const grid = Array.from({ length: n }, () => Array<number>(n).fill(-1));
  const cells: Coord[][] = Array.from({ length: n }, () => []);

  for (let r = 0; r < n; r++) {
    const c = perm[r]!;
    grid[r]![c] = r;
    cells[r]!.push({ r, c });
  }

  let empty = n * n - n;
  const maxSteps = n * n * 8;
  let steps = 0;

  while (empty > 0 && steps++ < maxSteps) {
    const candidates: { id: number; r: number; c: number }[] = [];
    for (let id = 0; id < n; id++) {
      const seen = new Set<string>();
      for (const cell of cells[id]!) {
        for (const [dr, dc] of DIRS4) {
          const rr = cell.r + dr;
          const cc = cell.c + dc;
          if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
          if (grid[rr]![cc] !== -1) continue;
          const k = `${rr},${cc}`;
          if (seen.has(k)) continue;
          seen.add(k);
          candidates.push({ id, r: rr, c: cc });
        }
      }
    }

    if (candidates.length === 0) {
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (grid[r]![c] !== -1) continue;
          let best = 0;
          let bestD = Infinity;
          for (let id = 0; id < n; id++) {
            for (const cell of cells[id]!) {
              const d = Math.abs(cell.r - r) + Math.abs(cell.c - c);
              if (d < bestD) {
                bestD = d;
                best = id;
              }
            }
          }
          grid[r]![c] = best;
          cells[best]!.push({ r, c });
          empty -= 1;
        }
      }
      break;
    }

    let pool = candidates;
    if (compact >= 0.55) {
      const minSize = Math.min(...candidates.map((c) => cells[c.id]!.length));
      const slack = compact > 0.8 ? 0 : 1;
      const tight = candidates.filter((c) => cells[c.id]!.length <= minSize + slack);
      if (tight.length) pool = tight;
    }

    const picked = pick(rng, pool);
    grid[picked.r]![picked.c] = picked.id;
    cells[picked.id]!.push({ r: picked.r, c: picked.c });
    empty -= 1;
  }

  return grid;
}

export type GenerateOptions = {
  size: number;
  seed: string;
  /** 0 = wild polyominoes, 1 = compact blobs. */
  compact?: number;
  /** How many solution cats to lock in as givens. */
  givens?: number;
  attempts?: number;
};

export function generatePuzzle(opts: GenerateOptions): Puzzle {
  const size = opts.size;
  const compact = opts.compact ?? 0.7;
  const givenCount = opts.givens ?? 0;
  const attempts = opts.attempts ?? 80;
  const rng = rngFromSeed(opts.seed);

  let last: { regions: number[][]; solution: number[] } | null = null;

  for (let i = 0; i < attempts; i++) {
    const solution = generatePlacement(size, rng);
    const regions = growRegions(size, solution, rng, compact);
    const { count } = countSolutions(regions, [], 2);
    if (count === 1) {
      last = { regions, solution };
      break;
    }
    last = { regions, solution };
  }

  if (!last) {
    throw new Error("puzzle generation failed");
  }

  let givens: Coord[] = [];
  if (givenCount > 0) {
    const rows = shuffle(
      rng,
      Array.from({ length: size }, (_, r) => r),
    ).slice(0, Math.min(givenCount, size));
    givens = rows.map((r) => ({ r, c: last!.solution[r]! }));
  }

  let uniqueness = countSolutions(last.regions, givens, 2);
  if (uniqueness.count !== 1) {
    const remaining = shuffle(
      rng,
      Array.from({ length: size }, (_, r) => r).filter((r) => !givens.some((g) => g.r === r)),
    );
    for (const r of remaining) {
      givens.push({ r, c: last.solution[r]! });
      uniqueness = countSolutions(last.regions, givens, 2);
      if (uniqueness.count === 1) break;
    }
  }

  return {
    size,
    regions: last.regions,
    solution: last.solution,
    givens,
    seed: opts.seed,
    sizeLabel: size,
  };
}

export function generateWithRetry(opts: GenerateOptions): Puzzle {
  try {
    return generatePuzzle(opts);
  } catch {
    return generatePuzzle({ ...opts, seed: `${opts.seed}:retry:${randInt(rngFromSeed(opts.seed), 1e9)}` });
  }
}

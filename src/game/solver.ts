import type { Coord } from "./types";

/**
 * Count valid cat placements on a region map.
 * A placement is a permutation `col[row]` with:
 *   - unique columns
 *   - unique regions
 *   - |col[row] - col[row+1]| >= 2  (no king-adjacency; only consecutive rows can touch)
 */
export function countSolutions(
  regions: number[][],
  givens: Coord[] = [],
  limit = 2,
): { count: number; solution: number[] | null } {
  const n = regions.length;
  const givenCol = new Array<number | undefined>(n);
  for (const g of givens) givenCol[g.r] = g.c;

  const usedCol = new Array<boolean>(n).fill(false);
  const usedRegion = new Array<boolean>(n).fill(false);
  const perm = new Array<number>(n).fill(-1);
  let count = 0;
  let first: number[] | null = null;

  function search(row: number) {
    if (count >= limit) return;
    if (row === n) {
      count += 1;
      if (!first) first = perm.slice();
      return;
    }
    const forced = givenCol[row];
    for (let col = 0; col < n; col++) {
      if (forced !== undefined && col !== forced) continue;
      if (usedCol[col]) continue;
      const region = regions[row]![col]!;
      if (usedRegion[region]) continue;
      if (row > 0 && Math.abs(col - perm[row - 1]!) < 2) continue;
      usedCol[col] = true;
      usedRegion[region] = true;
      perm[row] = col;
      search(row + 1);
      perm[row] = -1;
      usedCol[col] = false;
      usedRegion[region] = false;
      if (count >= limit) return;
    }
  }

  search(0);
  return { count, solution: first };
}

export function hasUniqueSolution(regions: number[][], givens: Coord[] = []): boolean {
  return countSolutions(regions, givens, 2).count === 1;
}

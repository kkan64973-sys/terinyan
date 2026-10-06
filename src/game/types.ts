export type CellState = "empty" | "mark" | "cat";

export type Coord = { r: number; c: number };

export type Puzzle = {
  /** Board size n (n cats on an n×n board). */
  size: number;
  /** Region id 0..n-1 for every cell. */
  regions: number[][];
  /** Winning placement: column of the cat in each row. */
  solution: number[];
  /** Pre-placed locked cats (tutorial / easier levels). */
  givens: Coord[];
  seed: string;
  /** 4–10. */
  sizeLabel: number;
};

export type DifficultyBand = "kit" | "easy" | "normal" | "hard" | "expert" | "master";

export type LevelKind = "campaign" | "daily";

export type LevelId =
  | { kind: "campaign"; n: number }
  | { kind: "daily"; date: string };

export type Move = {
  r: number;
  c: number;
  from: CellState;
  to: CellState;
  /** Auto-placed marks applied together with a cat. */
  autoMarks?: Coord[];
};

export type PlayStatus = "playing" | "won" | "lost";

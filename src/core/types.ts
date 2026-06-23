// Shared core types + direction helpers.

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Tile {
  c: number; // column
  r: number; // row
}

export type VacType = 'roomba' | 'upright' | 'stick' | 'mop';

// Turn-preference order used as a deterministic tiebreak (classic Pac-Man: up>left>down>right).
export const DIRS: Dir[] = ['up', 'left', 'down', 'right'];

export function dirToVec(d: Dir): { x: number; y: number } {
  switch (d) {
    case 'up':
      return { x: 0, y: -1 };
    case 'down':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
  }
}

export function opposite(d: Dir): Dir {
  switch (d) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

export function tileEq(a: Tile, b: Tile): boolean {
  return a.c === b.c && a.r === b.r;
}

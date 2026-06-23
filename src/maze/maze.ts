import { type Dir, type Tile, dirToVec } from '../core/types';

export type Dot = 'bacon' | 'bone' | null;

/**
 * Tile-based maze model. Built from an ASCII grid:
 *   '#' wall            '.' bacon           'o' bone
 *   ' ' empty floor     '=' warp edge       'S' Bak spawn
 *   '1'..'4' vacuum home slots               'T' toy spot
 *   '-' dock door       'D' dock interior
 * Everything except '#' is walkable. Dot state is mutable; structure is not.
 */
export class Maze {
  readonly cols: number;
  readonly rows: number;
  private readonly grid: string[];
  private dots: Dot[][];

  constructor(grid: string[]) {
    this.grid = grid.slice();
    this.rows = grid.length;
    this.cols = grid.reduce((m, row) => Math.max(m, row.length), 0);
    this.dots = [];
    this.reset();
  }

  /** Re-initialise dot state from the original grid (fresh room). */
  reset(): void {
    this.dots = this.grid.map((row) =>
      Array.from({ length: this.cols }, (_, c) => {
        const ch = row[c];
        if (ch === '.') return 'bacon' as Dot;
        if (ch === 'o') return 'bone' as Dot;
        return null;
      }),
    );
  }

  inBounds(c: number, r: number): boolean {
    return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
  }

  cell(c: number, r: number): string {
    if (!this.inBounds(c, r)) return '#';
    return this.grid[r][c] ?? '#';
  }

  isWall(c: number, r: number): boolean {
    return this.cell(c, r) === '#';
  }

  /** A tile a mover may occupy. */
  isWalkable(c: number, r: number): boolean {
    return this.inBounds(c, r) && !this.isWall(c, r);
  }

  dotAt(c: number, r: number): Dot {
    if (!this.inBounds(c, r)) return null;
    return this.dots[r][c];
  }

  /** Consume and return the dot at a tile (or null). */
  eatAt(c: number, r: number): Dot {
    if (!this.inBounds(c, r)) return null;
    const d = this.dots[r][c];
    if (d) this.dots[r][c] = null;
    return d;
  }

  /** Bacon strips left — clearing all of them completes the room. */
  baconRemaining(): number {
    let n = 0;
    for (const row of this.dots) for (const d of row) if (d === 'bacon') n++;
    return n;
  }

  find(char: string): Tile | null {
    for (let r = 0; r < this.rows; r++) {
      const c = this.grid[r].indexOf(char);
      if (c >= 0) return { c, r };
    }
    return null;
  }

  findAll(char: string): Tile[] {
    const out: Tile[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.grid[r].length; c++) {
        if (this.grid[r][c] === char) out.push({ c, r });
      }
    }
    return out;
  }

  /** Corridor tiles a bonus toy may spawn on: walkable, outside the dock and warp edges. */
  spawnableTiles(): Tile[] {
    const bad = new Set(['#', '1', '2', '3', '4', '-', 'D', '=']);
    const out: Tile[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!bad.has(this.cell(c, r))) out.push({ c, r });
      }
    }
    return out;
  }

  /**
   * If `tile` is a warp edge ('=') and moving `dir` runs into the border,
   * return the paired warp tile on the opposite side of the same row/column.
   */
  warp(tile: Tile, dir: Dir): Tile | null {
    if (this.cell(tile.c, tile.r) !== '=') return null;
    const v = dirToVec(dir);
    const nc = tile.c + v.x;
    const nr = tile.r + v.y;
    if (this.isWalkable(nc, nr)) return null; // not blocked -> normal move
    if (dir === 'left' || dir === 'right') {
      for (let c = 0; c < this.cols; c++) {
        if (c !== tile.c && this.cell(c, tile.r) === '=') return { c, r: tile.r };
      }
    } else {
      for (let r = 0; r < this.rows; r++) {
        if (r !== tile.r && this.cell(tile.c, r) === '=') return { c: tile.c, r };
      }
    }
    return null;
  }
}

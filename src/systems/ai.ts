import { type Dir, type Tile, type VacType, DIRS, dirToVec, opposite } from '../core/types';
import type { Maze } from '../maze/maze';

export interface AiCtx {
  self: Tile; // the deciding vacuum's tile
  bak: Tile;
  bakDir: Dir;
  roomba: Tile; // the red vacuum's tile (used by the flanker)
  corners: Record<VacType, Tile>;
  mode: 'scatter' | 'chase';
}

/** The tile a vacuum currently wants to reach (Pac-Man ghost personalities). */
export function targetTile(type: VacType, ctx: AiCtx): Tile {
  if (ctx.mode === 'scatter') return ctx.corners[type];
  const d = dirToVec(ctx.bakDir);
  switch (type) {
    case 'roomba': // Blinky — straight for Bak
      return { c: ctx.bak.c, r: ctx.bak.r };
    case 'upright': // Pinky — ambush 4 tiles ahead of Bak
      return { c: ctx.bak.c + d.x * 4, r: ctx.bak.r + d.y * 4 };
    case 'stick': {
      // Inky — vector from Roomba through 2-ahead of Bak, doubled
      const p = { c: ctx.bak.c + d.x * 2, r: ctx.bak.r + d.y * 2 };
      return { c: 2 * p.c - ctx.roomba.c, r: 2 * p.r - ctx.roomba.r };
    }
    case 'mop': {
      // Clyde — chase when far, retreat to corner when close
      const dist = Math.hypot(ctx.self.c - ctx.bak.c, ctx.self.r - ctx.bak.r);
      return dist > 8 ? { c: ctx.bak.c, r: ctx.bak.r } : ctx.corners.mop;
    }
  }
}

/**
 * Pick the legal move that minimises distance to target (up>left>down>right ties).
 * Reversing is disallowed by default (classic maze behaviour), but allowed when leaving
 * the tight dock, where turning around is the only way out.
 */
export function chooseDir(maze: Maze, tile: Tile, cur: Dir, target: Tile, allowReverse = false): Dir {
  let best: Dir | null = null;
  let bestDist = Infinity;
  for (const d of DIRS) {
    if (!allowReverse && d === opposite(cur)) continue;
    const v = dirToVec(d);
    let dest: Tile | null = maze.isWalkable(tile.c + v.x, tile.r + v.y)
      ? { c: tile.c + v.x, r: tile.r + v.y }
      : maze.warp(tile, d);
    if (!dest) continue;
    const dist = (dest.c - target.c) ** 2 + (dest.r - target.r) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best ?? opposite(cur); // dead end: reverse
}

/** Global scatter/chase schedule; scatter windows shrink as levels rise, then chase forever. */
export function phaseAt(elapsed: number, level = 0): 'scatter' | 'chase' {
  const scatter = Math.max(3, 7 - level);
  const chase = 20;
  const cycle = scatter + chase;
  if (elapsed > 4 * cycle) return 'chase';
  return elapsed % cycle < scatter ? 'scatter' : 'chase';
}

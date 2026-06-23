import { type Dir, type Tile, dirToVec } from '../core/types';
import type { Maze } from '../maze/maze';

/** A grid-locked mover. `progress` is 0..1 toward `tile + dir`. */
export interface Mover {
  tile: Tile;
  dir: Dir;
  pending: Dir | null;
  pending2: Dir | null; // fallback turn, tried when `pending` is blocked (diagonal joystick)
  progress: number;
  speed: number; // tiles per second
}

export function makeMover(spawn: Tile, dir: Dir, speed: number): Mover {
  return { tile: { c: spawn.c, r: spawn.r }, dir, pending: null, pending2: null, progress: 0, speed };
}

function walkable(maze: Maze, t: Tile, d: Dir): boolean {
  const v = dirToVec(d);
  return maze.isWalkable(t.c + v.x, t.r + v.y);
}

/**
 * Advance a mover by `dt`. Movers only change direction when centered on a tile:
 * a valid `pending` turn is applied there, otherwise they keep `dir`; a wall ahead
 * stops them; a warp tile teleports them to the far side and they continue.
 */
export function step(maze: Maze, m: Mover, dt: number): { entered: boolean; moved: number } {
  let remaining = m.speed * dt;
  let entered = false;
  let moved = 0;
  let guard = 0;
  while (remaining > 1e-9 && guard++ < 4096) {
    if (m.progress <= 1e-9) {
      if (m.pending && walkable(maze, m.tile, m.pending)) {
        m.dir = m.pending;
        m.pending = null;
        m.pending2 = null;
      } else if (m.pending2 && walkable(maze, m.tile, m.pending2)) {
        m.dir = m.pending2;
        m.pending = null;
        m.pending2 = null;
      }
      if (!walkable(maze, m.tile, m.dir)) {
        const w = maze.warp(m.tile, m.dir);
        if (w && walkable(maze, w, m.dir)) {
          m.tile = w;
        } else {
          m.progress = 0;
          break; // blocked by a wall
        }
      }
    }
    const adv = Math.min(remaining, 1 - m.progress);
    m.progress += adv;
    remaining -= adv;
    moved += adv;
    if (m.progress >= 1 - 1e-9) {
      const v = dirToVec(m.dir);
      m.tile = { c: m.tile.c + v.x, r: m.tile.r + v.y };
      m.progress = 0;
      entered = true;
      // Stop exactly at the new tile center so the controller (player input or
      // vacuum AI) re-decides direction here. Without this, movers blow through
      // intersections and only ever turn at walls. Leftover movement is dropped
      // (sub-pixel at 60fps), which is imperceptible.
      break;
    }
  }
  return { entered, moved };
}

/** Continuous tile-space position of a mover, for rendering/collision. */
export function moverPos(m: Mover): { c: number; r: number } {
  const v = dirToVec(m.dir);
  return { c: m.tile.c + v.x * m.progress, r: m.tile.r + v.y * m.progress };
}

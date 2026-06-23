import type { Tile } from '../core/types';

export interface Toy {
  tile: Tile;
  type: string; // sprite name (toy-ball, etc.)
  value: number;
  timer: number; // seconds left on screen
}

const TOY_TYPES = ['toy-ball', 'toy-duck', 'toy-slipper', 'toy-bowl'];

/** A reachable corridor tile just above the dock where the bonus toy appears. */
export const TOY_SPOT: Tile = { c: 9, r: 9 };
export const TOY_DURATION = 16;
/** Bacon-eaten fractions that trigger a toy appearance. Tuned generous so toys are
 *  easy to find and test; dial back later for the shipped balance. */
export const TOY_THRESHOLDS = [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88];

export function toyForRoom(roomIndex: number, appearance = 0): { type: string; value: number } {
  // Cycle through all four toys so each room shows two different ones.
  return { type: TOY_TYPES[(roomIndex * 2 + appearance) % TOY_TYPES.length], value: 100 + roomIndex * 100 };
}

export function spawnToy(tile: Tile, roomIndex: number, appearance = 0): Toy {
  const { type, value } = toyForRoom(roomIndex, appearance);
  return { tile: { ...tile }, type, value, timer: TOY_DURATION };
}

import { ROOMS, BOSS_ARENA } from '../maze/layouts';
import type { Layout } from '../maze/types';

// Clear the house twice (5 rooms × 2 loops), then the boss.
export const LOOPS = 2;
export const NORMAL_ROOMS = ROOMS.length * LOOPS;
export const BOSS_INDEX = NORMAL_ROOMS;

export interface RoomPlan {
  layout: Layout;
  loop: number;
  isBoss: boolean;
}

export function roomPlan(index: number): RoomPlan {
  if (index >= BOSS_INDEX) return { layout: BOSS_ARENA, loop: LOOPS, isBoss: true };
  return { layout: ROOMS[index % ROOMS.length], loop: Math.floor(index / ROOMS.length) + 1, isBoss: false };
}

export interface Difficulty {
  bakSpeed: number;
  vacSpeed: number;
  vacCount: number;
  frightenedMs: number;
}

export function difficulty(index: number): Difficulty {
  const t = Math.min(index, 12);
  return {
    bakSpeed: 6 + t * 0.1,
    vacSpeed: 4.7 + t * 0.16,
    vacCount: index < ROOMS.length ? 3 : 4, // first loop of the house starts gentle with 3
    frightenedMs: Math.max(2000, 6000 - t * 350),
  };
}

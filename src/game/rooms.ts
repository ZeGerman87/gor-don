import { ROOMS, BOSS_ARENA, smallRoom } from '../maze/layouts';
import type { Layout } from '../maze/types';

// Clear the house twice (5 rooms × 2 loops), then the boss.
export const LOOPS = 2;
export const NORMAL_ROOMS = ROOMS.length * LOOPS;
export const BOSS_INDEX = NORMAL_ROOMS;

// Difficulty ramp: levels 1-3 use smaller boards (fewer, bigger cells) that grow
// to the full hand-made room size at level 4. Same themes as the first rooms.
const RAMP_SIZES: Array<[number, number]> = [
  [11, 13],
  [13, 15],
  [15, 17],
];
const SMALL_ROOMS: Layout[] = RAMP_SIZES.map(([w, h], i) =>
  smallRoom(ROOMS[i].name, ROOMS[i].theme, w, h),
);

export interface RoomPlan {
  layout: Layout;
  loop: number;
  isBoss: boolean;
}

export function roomPlan(index: number): RoomPlan {
  if (index >= BOSS_INDEX) return { layout: BOSS_ARENA, loop: LOOPS, isBoss: true };
  if (index < SMALL_ROOMS.length) return { layout: SMALL_ROOMS[index], loop: 1, isBoss: false };
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
    vacCount: Math.min(index + 1, 4), // L1=1, L2=2, L3=3, L4+=4
    frightenedMs: Math.max(2000, 6000 - t * 350),
  };
}

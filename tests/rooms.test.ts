import { roomPlan, difficulty, BOSS_INDEX, NORMAL_ROOMS } from '../src/game/rooms';

test('first loop, second loop, then boss', () => {
  expect(roomPlan(0)).toMatchObject({ loop: 1, isBoss: false });
  expect(roomPlan(NORMAL_ROOMS - 1)).toMatchObject({ loop: 2, isBoss: false });
  expect(roomPlan(BOSS_INDEX).isBoss).toBe(true);
});

test('loop 2 reuses the same layouts as loop 1', () => {
  expect(roomPlan(5).layout.name).toBe(roomPlan(0).layout.name);
});

test('difficulty rises monotonically and frightened time shrinks', () => {
  const a = difficulty(0);
  const b = difficulty(6);
  const c = difficulty(12);
  expect(b.vacSpeed).toBeGreaterThan(a.vacSpeed);
  expect(c.vacSpeed).toBeGreaterThan(b.vacSpeed);
  expect(b.frightenedMs).toBeLessThan(a.frightenedMs);
  expect(c.frightenedMs).toBeGreaterThanOrEqual(2000);
});

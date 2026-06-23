import { ROOMS, BOSS_ARENA, MAZE_W, MAZE_H } from '../src/maze/layouts';
import { Maze } from '../src/maze/maze';
import { type Dir, type Tile, dirToVec } from '../src/core/types';
import type { Layout } from '../src/maze/types';

const key = (t: Tile) => `${t.c},${t.r}`;

// Flood-fill the walkable graph from Bak's spawn, following warps.
function reachable(layout: Layout): Set<string> {
  const m = new Maze(layout.grid);
  const seen = new Set<string>([key(layout.bakSpawn)]);
  const stack: Tile[] = [layout.bakSpawn];
  while (stack.length) {
    const t = stack.pop()!;
    for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
      const v = dirToVec(d);
      let nt: Tile | null = m.isWalkable(t.c + v.x, t.r + v.y) ? { c: t.c + v.x, r: t.r + v.y } : null;
      if (!nt) nt = m.warp(t, d);
      if (nt && !seen.has(key(nt))) {
        seen.add(key(nt));
        stack.push(nt);
      }
    }
  }
  return seen;
}

describe.each(ROOMS)('room "$name"', (room) => {
  const m = new Maze(room.grid);

  test('grid is rectangular at the standard size', () => {
    expect(room.grid.length).toBe(MAZE_H);
    for (const row of room.grid) expect(row.length).toBe(MAZE_W);
  });

  test('border is solid walls except warp tiles', () => {
    for (let c = 0; c < MAZE_W; c++) {
      expect(['#', '=']).toContain(m.cell(c, 0));
      expect(['#', '=']).toContain(m.cell(c, MAZE_H - 1));
    }
    for (let r = 0; r < MAZE_H; r++) {
      expect(['#', '=']).toContain(m.cell(0, r));
      expect(['#', '=']).toContain(m.cell(MAZE_W - 1, r));
    }
  });

  test('has exactly 4 vacuum homes and one Bak spawn', () => {
    const homes = ['1', '2', '3', '4'].flatMap((ch) => m.findAll(ch));
    expect(homes.length).toBe(4);
    expect(m.findAll('S').length).toBe(1);
    expect(room.vacuumHomes.length).toBe(4);
  });

  test('has bacon and at least one bone', () => {
    expect(m.baconRemaining()).toBeGreaterThan(0);
    expect(m.findAll('o').length).toBeGreaterThanOrEqual(1);
  });

  test('every bacon tile and every home is reachable from spawn', () => {
    const seen = reachable(room);
    let baconSeen = 0;
    for (let r = 0; r < MAZE_H; r++)
      for (let c = 0; c < MAZE_W; c++)
        if (m.dotAt(c, r) === 'bacon' && seen.has(key({ c, r }))) baconSeen++;
    expect(baconSeen).toBe(m.baconRemaining());
    for (const h of room.vacuumHomes) expect(seen.has(key(h))).toBe(true);
  });
});

test('boss arena parses, has bones, spawn, and is connected', () => {
  const m = new Maze(BOSS_ARENA.grid);
  expect(BOSS_ARENA.grid.length).toBe(MAZE_H);
  for (const row of BOSS_ARENA.grid) expect(row.length).toBe(MAZE_W);
  expect(m.findAll('o').length).toBeGreaterThanOrEqual(2);
  expect(m.findAll('S').length).toBe(1);
  const seen = reachable(BOSS_ARENA);
  let baconSeen = 0;
  for (let r = 0; r < MAZE_H; r++)
    for (let c = 0; c < MAZE_W; c++)
      if (m.dotAt(c, r) === 'bacon' && seen.has(key({ c, r }))) baconSeen++;
  expect(baconSeen).toBe(m.baconRemaining());
});

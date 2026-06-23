import { Maze } from '../src/maze/maze';
import { makeMover, step } from '../src/systems/movement';

const G = ['#####', '#...#', '#.#.#', '#...#', '#####'];
const GW = ['#####', '#...#', '=...=', '#...#', '#####'];

test('advances forward into the next tile', () => {
  const m = new Maze(G);
  const mv = makeMover({ c: 1, r: 1 }, 'right', 1);
  step(m, mv, 1.0);
  expect(mv.tile).toEqual({ c: 2, r: 1 });
});

test('stops at a wall with no movement', () => {
  const m = new Maze(G);
  const mv = makeMover({ c: 1, r: 1 }, 'up', 1);
  const res = step(m, mv, 1.0);
  expect(mv.tile).toEqual({ c: 1, r: 1 });
  expect(res.moved).toBe(0);
});

test('applies a buffered turn at a tile center', () => {
  const m = new Maze(G);
  const mv = makeMover({ c: 1, r: 1 }, 'right', 1);
  mv.pending = 'down';
  step(m, mv, 1.0);
  expect(mv.dir).toBe('down');
  expect(mv.tile).toEqual({ c: 1, r: 2 });
});

test('warps across the = edges and keeps going', () => {
  const m = new Maze(GW);
  const mv = makeMover({ c: 1, r: 2 }, 'left', 1);
  step(m, mv, 1.0); // (1,2) -> (0,2), stops at center
  step(m, mv, 1.0); // (0,2) blocked left -> warp to (4,2) -> (3,2)
  expect(mv.tile).toEqual({ c: 3, r: 2 });
});

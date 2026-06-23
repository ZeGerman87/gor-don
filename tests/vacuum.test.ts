import { Vacuum } from '../src/entities/vacuum';
import { Maze } from '../src/maze/maze';
import { ROOMS } from '../src/maze/layouts';
import type { AiCtx } from '../src/systems/ai';

const room = ROOMS[0];
const exit = { c: 9, r: 10 };

function ctx(mode: 'scatter' | 'chase'): Omit<AiCtx, 'self' | 'mode'> & { mode: 'scatter' | 'chase' } {
  return { bak: { c: 9, r: 15 }, bakDir: 'left', roomba: { c: 9, r: 9 }, corners: room.scatterCorners, mode };
}

test('release 0 starts the vacuum leaving the dock', () => {
  const v = new Vacuum('roomba', room.vacuumHomes[0], exit, 5, 0);
  expect(v.state).toBe('leaving');
});

test('frighten / unfrighten / eat transitions', () => {
  const v = new Vacuum('roomba', room.vacuumHomes[0], exit, 5, 0);
  v.state = 'chase';
  v.frighten();
  expect(v.state).toBe('frightened');
  expect(v.edible).toBe(true);
  v.unfrighten();
  expect(v.state).toBe('chase');
  v.eat();
  expect(v.state).toBe('eaten');
});

test('home countdown releases the vacuum', () => {
  const m = new Maze(room.grid);
  const v = new Vacuum('mop', room.vacuumHomes[3], exit, 5, 1.0);
  expect(v.state).toBe('home');
  v.update(m, ctx('scatter'), 1.2);
  expect(v.state).not.toBe('home');
});

test('an active vacuum moves through the maze', () => {
  const m = new Maze(room.grid);
  const v = new Vacuum('roomba', { c: 9, r: 9 }, exit, 6, 0);
  v.state = 'chase';
  const before = { ...v.mover.tile };
  for (let i = 0; i < 30; i++) v.update(m, ctx('chase'), 1 / 60);
  expect(v.mover.tile).not.toEqual(before);
});

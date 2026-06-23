import { targetTile, chooseDir, phaseAt, type AiCtx } from '../src/systems/ai';
import { Maze } from '../src/maze/maze';

const corners = {
  roomba: { c: 17, r: 1 },
  upright: { c: 1, r: 1 },
  stick: { c: 17, r: 19 },
  mop: { c: 1, r: 19 },
};

test('scatter mode targets each type’s corner', () => {
  const ctx: AiCtx = {
    self: { c: 5, r: 5 },
    bak: { c: 9, r: 15 },
    bakDir: 'left',
    roomba: { c: 9, r: 9 },
    corners,
    mode: 'scatter',
  };
  expect(targetTile('roomba', ctx)).toEqual(corners.roomba);
  expect(targetTile('stick', ctx)).toEqual(corners.stick);
});

test('chase: roomba targets Bak; upright leads by 4', () => {
  const ctx: AiCtx = {
    self: { c: 5, r: 5 },
    bak: { c: 9, r: 9 },
    bakDir: 'right',
    roomba: { c: 2, r: 2 },
    corners,
    mode: 'chase',
  };
  expect(targetTile('roomba', ctx)).toEqual({ c: 9, r: 9 });
  expect(targetTile('upright', ctx)).toEqual({ c: 13, r: 9 });
});

test('mop chases when far and retreats when close', () => {
  const base: AiCtx = { self: { c: 0, r: 0 }, bak: { c: 9, r: 9 }, bakDir: 'up', roomba: { c: 0, r: 0 }, corners, mode: 'chase' };
  expect(targetTile('mop', { ...base, self: { c: 1, r: 1 } })).toEqual({ c: 9, r: 9 });
  expect(targetTile('mop', { ...base, self: { c: 9, r: 11 } })).toEqual(corners.mop);
});

test('chooseDir picks the nearest legal non-reverse move', () => {
  const G = ['#####', '#...#', '#...#', '#...#', '#####'];
  const m = new Maze(G);
  // moving right at (2,2), target up-left (1,1): must not reverse to 'left', should choose 'up'
  expect(chooseDir(m, { c: 2, r: 2 }, 'right', { c: 1, r: 1 })).toBe('up');
});

test('phaseAt begins in scatter then becomes chase', () => {
  expect(phaseAt(0)).toBe('scatter');
  expect(phaseAt(10)).toBe('chase');
});

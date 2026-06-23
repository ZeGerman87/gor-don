import { Maze } from '../src/maze/maze';

// Small maze: bacon + bone in row 1, warp edges in row 2, a vacuum home in row 3.
const G = ['#####', '#.o.#', '#=S=#', '# 1 #', '#####'];

test('parses dimensions and walls', () => {
  const m = new Maze(G);
  expect([m.cols, m.rows]).toEqual([5, 5]);
  expect(m.isWall(0, 0)).toBe(true);
  expect(m.isWall(1, 1)).toBe(false);
  expect(m.isWalkable(2, 2)).toBe(true);
});

test('counts and eats bacon/bone', () => {
  const m = new Maze(G);
  expect(m.baconRemaining()).toBe(2);
  expect(m.eatAt(1, 1)).toBe('bacon');
  expect(m.baconRemaining()).toBe(1);
  expect(m.eatAt(2, 1)).toBe('bone'); // bone does not count toward bacon
  expect(m.baconRemaining()).toBe(1);
  expect(m.eatAt(1, 1)).toBe(null); // already eaten
});

test('reset restores all dots', () => {
  const m = new Maze(G);
  m.eatAt(1, 1);
  m.eatAt(2, 1);
  m.reset();
  expect(m.baconRemaining()).toBe(2);
  expect(m.dotAt(2, 1)).toBe('bone');
});

test('warp wraps across the = edges', () => {
  const m = new Maze(G);
  expect(m.warp({ c: 1, r: 2 }, 'left')).toEqual({ c: 3, r: 2 });
  expect(m.warp({ c: 3, r: 2 }, 'right')).toEqual({ c: 1, r: 2 });
  expect(m.warp({ c: 2, r: 2 }, 'left')).toBe(null); // 'S' is not a warp tile
});

test('find and findAll locate chars', () => {
  const m = new Maze(G);
  expect(m.find('S')).toEqual({ c: 2, r: 2 });
  expect(m.findAll('=')).toEqual([
    { c: 1, r: 2 },
    { c: 3, r: 2 },
  ]);
});

import type { Tile, VacType } from '../core/types';
import type { Layout, Theme } from './types';
import { Maze } from './maze';

// All rooms share these dimensions so the viewport math is constant.
export const MAZE_W = 19;
export const MAZE_H = 21;

const BORDER = '#'.repeat(MAZE_W);
const CORR = '#' + '.'.repeat(MAZE_W - 2) + '#'; // full horizontal corridor
const TUNNEL = '=' + '.'.repeat(MAZE_W - 2) + '='; // warp tunnel row
// Central dock ("charging den"): door faces up into the tunnel; 4 home slots inside.
const DOCK_TOP = '#......##-###.....#';
const DOCK_MID = '#.###.##1234#.###.#';
const DOCK_BOT = '#......######.....#';

const SCATTER_CORNERS: Record<VacType, Tile> = {
  roomba: { c: 17, r: 1 },
  upright: { c: 1, r: 1 },
  stick: { c: 17, r: 19 },
  mop: { c: 1, r: 19 },
};

function setChar(s: string, i: number, ch: string): string {
  return s.slice(0, i) + ch + s.slice(i + 1);
}

// Force a room's even-row pattern to keep the connecting vertical corridors open
// (cols 1,5,9,13,17) and solid borders — so connectivity is guaranteed by construction.
function sanitizeEven(p: string): string {
  const s = p.padEnd(MAZE_W, '#').slice(0, MAZE_W).split('');
  s[0] = '#';
  s[MAZE_W - 1] = '#';
  for (const c of [1, 5, 9, 13, 17]) s[c] = '.';
  return s.join('');
}

function buildRoom(name: string, theme: Theme, evenRaw: string, bones: Tile[]): Layout {
  const rows: string[] = [];
  for (let r = 0; r < MAZE_H; r++) {
    if (r === 0 || r === MAZE_H - 1) rows.push(BORDER);
    else if (r === 10) rows.push(TUNNEL);
    else if (r === 11) rows.push(DOCK_TOP);
    else if (r === 12) rows.push(DOCK_MID);
    else if (r === 13) rows.push(DOCK_BOT);
    else if (r % 2 === 0) rows.push(sanitizeEven(evenRaw));
    else rows.push(CORR);
  }
  rows[15] = setChar(rows[15], 9, 'S'); // Bak spawn, below the dock
  for (const b of bones) rows[b.r] = setChar(rows[b.r], b.c, 'o');

  const m = new Maze(rows);
  const vacuumHomes = ['1', '2', '3', '4'].map((ch) => m.find(ch)!).filter(Boolean) as Tile[];
  return {
    name,
    theme,
    grid: rows,
    bakSpawn: { c: 9, r: 15 },
    vacuumHomes,
    scatterCorners: SCATTER_CORNERS,
    warpRows: [10],
  };
}

export const ROOMS: Layout[] = [
  buildRoom('Living Room', 'living', '#.###.###.###.###.#', [
    { c: 1, r: 1 },
    { c: 17, r: 1 },
    { c: 1, r: 19 },
    { c: 17, r: 19 },
  ]),
  buildRoom('Kitchen', 'kitchen', '#.#.#.#.#.#.#.#.#.#', [
    { c: 1, r: 3 },
    { c: 17, r: 3 },
    { c: 1, r: 17 },
    { c: 17, r: 17 },
  ]),
  buildRoom('Bedroom', 'bedroom', '#.....###.###.....#', [
    { c: 1, r: 1 },
    { c: 17, r: 1 },
    { c: 9, r: 5 },
    { c: 1, r: 19 },
    { c: 17, r: 19 },
  ]),
  buildRoom('Bathroom', 'bathroom', '#.##.#.#.#.#.##.#', [
    { c: 3, r: 1 },
    { c: 15, r: 1 },
    { c: 3, r: 19 },
    { c: 15, r: 19 },
  ]),
  buildRoom('Garage', 'garage', '#...#.##.#.##.#...#', [
    { c: 1, r: 1 },
    { c: 17, r: 1 },
    { c: 9, r: 9 },
    { c: 1, r: 19 },
    { c: 17, r: 19 },
  ]),
];

// Boss arena: open, with bones to open vulnerability windows and a clear center for The Big Vac.
const BOSS_GRID = [
  '###################',
  '#.................#',
  '#.o.............o.#',
  '#.................#',
  '#...###.....###...#',
  '#.................#',
  '#.................#',
  '#......     ......#',
  '#.....       .....#',
  '#=....       ....=#',
  '#.....       .....#',
  '#......     ......#',
  '#.................#',
  '#...###.....###...#',
  '#.................#',
  '#.o.............o.#',
  '#.................#',
  '#.......1.2.......#',
  '#........S........#',
  '#.................#',
  '###################',
];

export const BOSS_ARENA: Layout = {
  name: 'The Big Vac',
  theme: 'boss',
  grid: BOSS_GRID,
  bakSpawn: { c: 9, r: 18 },
  vacuumHomes: [
    { c: 8, r: 17 },
    { c: 10, r: 17 },
  ],
  scatterCorners: SCATTER_CORNERS,
  warpRows: [9],
};

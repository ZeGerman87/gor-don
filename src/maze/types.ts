import type { Tile, VacType } from '../core/types';

export type Theme = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'garage' | 'boss';

export interface Layout {
  name: string;
  theme: Theme;
  grid: string[];
  bakSpawn: Tile;
  vacuumHomes: Tile[];
  dockExit: Tile; // tile just above the dock door that leaving vacuums head for
  scatterCorners: Record<VacType, Tile>;
  warpRows: number[];
}

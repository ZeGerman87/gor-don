import type { Dir, Tile } from '../core/types';
import type { Maze } from '../maze/maze';
import { type Mover, makeMover, step } from '../systems/movement';

/** The player. Chomp animation is driven by distance actually moved. */
export class Bak {
  mover: Mover;
  chomp = 0; // 0..1; mouth open while < 0.5

  constructor(spawn: Tile, speed: number) {
    this.mover = makeMover(spawn, 'left', speed);
  }

  setSpeed(s: number): void {
    this.mover.speed = s;
  }

  reset(spawn: Tile): void {
    this.mover = makeMover(spawn, 'left', this.mover.speed);
    this.chomp = 0;
  }

  update(maze: Maze, desired: Dir | Dir[] | null, dt: number): { entered: boolean } {
    if (desired) {
      if (Array.isArray(desired)) {
        this.mover.pending = desired[0] ?? null;
        this.mover.pending2 = desired[1] ?? null;
      } else {
        this.mover.pending = desired;
        this.mover.pending2 = null;
      }
    }
    const { entered, moved } = step(maze, this.mover, dt);
    this.chomp = (this.chomp + moved * 1.6) % 1;
    return { entered };
  }

  get mouthOpen(): boolean {
    return this.chomp < 0.5;
  }

  get dir(): Dir {
    return this.mover.dir;
  }
}

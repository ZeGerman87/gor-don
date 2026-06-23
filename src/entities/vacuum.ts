import { type Tile, type VacType, tileEq } from '../core/types';
import type { Maze } from '../maze/maze';
import { type Mover, makeMover, step } from '../systems/movement';
import { type AiCtx, targetTile, chooseDir } from '../systems/ai';

export type VacState = 'home' | 'leaving' | 'scatter' | 'chase' | 'frightened' | 'eaten';

export class Vacuum {
  type: VacType;
  mover: Mover;
  state: VacState;
  bob = 0; // home bobbing phase, for render
  private home: Tile;
  private exit: Tile;
  private baseSpeed: number;
  private releaseTimer: number;

  constructor(type: VacType, home: Tile, exit: Tile, baseSpeed: number, release: number) {
    this.type = type;
    this.home = { ...home };
    this.exit = { ...exit };
    this.baseSpeed = baseSpeed;
    this.mover = makeMover(home, 'up', baseSpeed);
    this.releaseTimer = release;
    this.state = release <= 0 ? 'leaving' : 'home';
  }

  setBaseSpeed(s: number): void {
    this.baseSpeed = s;
  }

  frighten(): void {
    if (this.state === 'scatter' || this.state === 'chase' || this.state === 'frightened') {
      this.state = 'frightened';
    }
  }

  unfrighten(): void {
    if (this.state === 'frightened') this.state = 'chase';
  }

  eat(): void {
    this.state = 'eaten';
  }

  get frightened(): boolean {
    return this.state === 'frightened';
  }

  get edible(): boolean {
    return this.state === 'frightened';
  }

  get active(): boolean {
    return this.state === 'scatter' || this.state === 'chase' || this.state === 'frightened';
  }

  update(maze: Maze, ctx: Omit<AiCtx, 'self' | 'mode'> & { mode: 'scatter' | 'chase' }, dt: number): void {
    if (this.state === 'home') {
      this.releaseTimer -= dt;
      this.bob += dt;
      if (this.releaseTimer <= 0) this.state = 'leaving';
      return;
    }

    let target: Tile;
    if (this.state === 'leaving') {
      this.mover.speed = this.baseSpeed;
      target = this.exit;
      if (tileEq(this.mover.tile, this.exit)) this.state = ctx.mode;
    } else if (this.state === 'eaten') {
      this.mover.speed = this.baseSpeed * 1.9;
      target = this.home;
      if (tileEq(this.mover.tile, this.home)) {
        this.state = 'home';
        this.releaseTimer = 0.8;
        this.mover.speed = this.baseSpeed;
        return;
      }
    } else if (this.state === 'frightened') {
      this.mover.speed = this.baseSpeed * 0.6;
      target = { c: 2 * this.mover.tile.c - ctx.bak.c, r: 2 * this.mover.tile.r - ctx.bak.r };
    } else {
      this.state = ctx.mode; // follow the global scatter/chase phase
      this.mover.speed = this.baseSpeed;
      target = targetTile(this.type, { ...ctx, self: this.mover.tile });
    }

    if (this.mover.progress <= 1e-9) {
      this.mover.dir = chooseDir(maze, this.mover.tile, this.mover.dir, target, this.state === 'leaving');
    }
    step(maze, this.mover, dt);
  }

  /** Sprite name for the current state. */
  spriteName(): string {
    if (this.state === 'frightened') return 'vacuum-scared';
    return `vacuum-${this.type}`;
  }
}

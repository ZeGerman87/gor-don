import type { Tile } from '../core/types';

/**
 * The Big Vac. Stationary in the arena centre with a glowing eye (weak point).
 * Eating an arena bone powers it down (vulnerable) for a few seconds; Bak touching
 * it during that window lands a hit. Three hits defeat it. Touching it while it is
 * NOT vulnerable costs a life.
 */
export class Boss {
  hp = 3;
  readonly maxHp = 3;
  vulnerable = false;
  windowT = 0;
  hurtT = 0;
  center: Tile;

  constructor(center: Tile) {
    this.center = { ...center };
  }

  onBoneEaten(secs = 5): void {
    if (this.hp > 0) {
      this.vulnerable = true;
      this.windowT = secs;
    }
  }

  /** Returns true if a hit landed (only while vulnerable). Closes the window. */
  hit(): boolean {
    if (this.vulnerable && this.hp > 0) {
      this.hp--;
      this.vulnerable = false;
      this.windowT = 0;
      this.hurtT = 0.45;
      return true;
    }
    return false;
  }

  get defeated(): boolean {
    return this.hp <= 0;
  }

  update(dt: number): void {
    if (this.windowT > 0) {
      this.windowT -= dt;
      if (this.windowT <= 0) this.vulnerable = false;
    }
    if (this.hurtT > 0) this.hurtT -= dt;
  }
}

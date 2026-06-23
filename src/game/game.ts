import { type VacType, type Tile, tileEq } from '../core/types';
import type { Viewport } from '../core/viewport';
import type { Input } from '../core/input';
import { Joystick } from '../core/joystick';
import type { AssetStore } from '../core/assets';
import { Maze } from '../maze/maze';
import type { Layout } from '../maze/types';
import { Bak } from '../entities/bak';
import { Vacuum } from '../entities/vacuum';
import { Boss } from '../entities/boss';
import { phaseAt } from '../systems/ai';
import { moverPos } from '../systems/movement';
import { roomPlan, difficulty, BOSS_INDEX } from './rooms';
import { drawScene } from '../render/renderer';
import { drawHud } from '../render/hud';
import { Effects } from '../render/particles';
import { type Toy, spawnToy, TOY_THRESHOLDS } from '../systems/spawning';
import { getHighScore, setHighScore } from '../core/storage';
import type { Audio } from '../core/audio';
import { drawTitle, drawReady, drawCleared, drawPaused, drawGameOver, drawWin } from '../ui/screens';

type Mode = 'title' | 'ready' | 'playing' | 'dying' | 'cleared' | 'win' | 'gameover' | 'paused';

const VAC_TYPES: VacType[] = ['roomba', 'upright', 'stick', 'mop'];
const BOSS_MINIONS: VacType[] = ['roomba', 'upright'];
const BOSS_CENTER: Tile = { c: 9, r: 9 };
const READY_TIME = 1.4;
const DEATH_TIME = 1.1;
const CLEAR_TIME = 1.9;
const VAC_RELEASE = 5; // seconds between each vacuum leaving the dock
const INVULN_TIME = 2.2; // grace period after (re)spawning

export class Game {
  private mode: Mode = 'title';
  private modeTimer = 0;
  private t = 0; // global clock for blink/animation

  private roomIndex = 0;
  private layout!: Layout;
  private maze!: Maze;
  private bak!: Bak;
  private vacuums: Vacuum[] = [];
  private boss: Boss | null = null;
  private isBoss = false;
  private effects = new Effects();
  private toys: Toy[] = [];
  private spawnTiles: Tile[] = [];
  private baconStart = 0;
  private toysSpawned = 0;
  private invulnT = 0;
  private joystick = new Joystick();
  private roomIntro = false; // true while the 'ready' card is a new-level intro (vs a respawn)
  private bakBaseSpeed = 6; // un-boosted speed for the current room
  private speedBoostT = 0; // tennis-ball speed boost remaining
  private freezeT = 0; // slipper freeze remaining (vacuums held still)

  private elapsed = 0;
  private frightenedT = 0;
  private frightenedSecs = 6;
  private chain = 0;

  private score = 0;
  private lives = 3;
  private high = 0;

  constructor(
    private vp: Viewport,
    private assets: AssetStore,
    private input: Input,
    private audio: Audio,
  ) {
    this.high = getHighScore();
    this.loadRoom(0);
    this.joystick.setLayout(vp);
    this.joystick.attach();
    this.mode = 'title';
  }

  onResize(): void {
    this.joystick.setLayout(this.vp);
  }

  private inMuteButton(x: number, y: number): boolean {
    return x >= 0 && Math.hypot(x - (this.vp.cssW - 22), y - 30) < 20;
  }

  private inPauseButton(x: number, y: number): boolean {
    return x >= 0 && Math.hypot(x - (this.vp.cssW - 54), y - 30) < 20;
  }

  private spawnVacuums(speed: number, count: number): void {
    const homes = this.layout.vacuumHomes;
    this.vacuums = VAC_TYPES.slice(0, count).map(
      (type, i) => new Vacuum(type, homes[i % homes.length], this.layout.dockExit, speed, i * VAC_RELEASE),
    );
  }

  private makeMinions(speed: number): Vacuum[] {
    const homes = this.layout.vacuumHomes;
    return BOSS_MINIONS.map((type, i) => {
      const v = new Vacuum(type, homes[i % homes.length], this.layout.dockExit, speed, 0);
      v.state = 'chase'; // minions are immediately active in the arena
      return v;
    });
  }

  private loadRoom(index: number): void {
    this.roomIndex = index;
    const plan = roomPlan(index);
    this.isBoss = plan.isBoss;
    this.layout = plan.layout;
    this.maze = new Maze(this.layout.grid);
    this.vp.cols = this.maze.cols;
    this.vp.rows = this.maze.rows;
    this.vp.resize();
    this.joystick.setLayout(this.vp);
    const diff = difficulty(index);
    this.bak = new Bak(this.layout.bakSpawn, diff.bakSpeed);
    this.frightenedSecs = diff.frightenedMs / 1000;
    this.elapsed = 0;
    this.frightenedT = 0;
    this.chain = 0;
    this.baconStart = this.maze.baconRemaining();
    this.toys = [];
    this.spawnTiles = this.maze.spawnableTiles();
    this.toysSpawned = 0;
    this.invulnT = INVULN_TIME;
    this.bakBaseSpeed = diff.bakSpeed;
    this.speedBoostT = 0;
    this.freezeT = 0;
    this.roomIntro = true;
    if (this.isBoss) {
      this.boss = new Boss(BOSS_CENTER);
      this.vacuums = this.makeMinions(diff.vacSpeed);
    } else {
      this.boss = null;
      this.spawnVacuums(diff.vacSpeed, diff.vacCount);
    }
    this.audio.music(this.isBoss ? 'boss' : 'house');
    this.mode = 'ready';
    this.modeTimer = READY_TIME;
  }

  private respawn(): void {
    const diff = difficulty(this.roomIndex);
    this.bak.reset(this.layout.bakSpawn);
    this.bak.setSpeed(diff.bakSpeed);
    this.vacuums = this.isBoss ? this.makeMinions(diff.vacSpeed) : [];
    if (!this.isBoss) this.spawnVacuums(diff.vacSpeed, diff.vacCount);
    this.elapsed = 0;
    this.frightenedT = 0;
    this.invulnT = INVULN_TIME;
    this.bakBaseSpeed = diff.bakSpeed;
    this.speedBoostT = 0;
    this.freezeT = 0;
    this.roomIntro = false;
    this.toys = [];
    this.mode = 'ready';
    this.modeTimer = READY_TIME;
  }

  private startGame(): void {
    this.audio.unlock();
    this.score = 0;
    this.lives = 3;
    this.loadRoom(0);
  }

  private saveHigh(): void {
    if (this.score > this.high) {
      this.high = this.score;
      setHighScore(this.high);
    }
  }

  update(dt: number): void {
    this.t += dt;
    this.effects.update(dt);
    if (this.input.tapped && this.inMuteButton(this.input.tapX, this.input.tapY)) {
      this.input.consumeTap();
      this.audio.toggleMute();
    } else if (this.input.tapped && this.mode === 'playing' && this.inPauseButton(this.input.tapX, this.input.tapY)) {
      this.input.consumeTap();
      this.mode = 'paused';
    }
    // Touches during active play steer the joystick; drop any stray tap so it
    // doesn't leak into the next menu (e.g. instantly skipping game-over).
    if (this.mode === 'playing' || this.mode === 'ready' || this.mode === 'dying' || this.mode === 'cleared') {
      this.input.consumeTap();
    }
    switch (this.mode) {
      case 'title':
        if (this.input.consumeTap()) this.startGame();
        break;
      case 'ready':
        this.modeTimer -= dt;
        if (this.modeTimer <= 0) this.mode = 'playing';
        break;
      case 'playing':
        if (this.isBoss) this.bossStep(dt);
        else this.playStep(dt);
        break;
      case 'paused':
        if (this.input.consumeTap()) this.mode = 'playing';
        break;
      case 'dying':
        this.modeTimer -= dt;
        if (this.modeTimer <= 0) {
          if (this.lives > 0) this.respawn();
          else {
            this.saveHigh();
            this.audio.music(null);
            this.mode = 'gameover';
          }
        }
        break;
      case 'cleared':
        this.modeTimer -= dt;
        if (this.modeTimer <= 0) this.loadRoom(this.roomIndex + 1);
        break;
      case 'win':
      case 'gameover':
        if (this.input.consumeTap()) {
          this.loadRoom(0);
          this.mode = 'title';
        }
        break;
    }
  }

  private bakScreen(): { x: number; y: number } {
    const p = moverPos(this.bak.mover);
    return { x: this.vp.cx(p.c), y: this.vp.cy(p.r) };
  }

  private die(): void {
    this.lives = Math.max(0, this.lives - 1);
    const s = this.bakScreen();
    this.effects.poof(s.x, s.y, '#ffd0c0', 18);
    this.effects.addShake(12);
    this.audio.sfx('death');
    this.mode = 'dying';
    this.modeTimer = DEATH_TIME;
  }

  /** A random corridor tile for a new toy, avoiding Bak's tile and existing toys. */
  private pickToyTile(): Tile | null {
    const taken = new Set(this.toys.map((t) => `${t.tile.c},${t.tile.r}`));
    taken.add(`${this.bak.mover.tile.c},${this.bak.mover.tile.r}`);
    const cands = this.spawnTiles.filter((t) => !taken.has(`${t.c},${t.r}`));
    if (!cands.length) return null;
    return cands[(Math.random() * cands.length) | 0];
  }

  /** Apply a bonus toy's power-up (each toy type does something different). */
  private collectToy(toy: Toy): void {
    const x = this.vp.cx(toy.tile.c);
    const y = this.vp.cy(toy.tile.r);
    this.audio.sfx('toy');
    this.effects.poof(x, y, '#ffcf5a');
    switch (toy.type) {
      case 'toy-ball': // Fetch frenzy — Bak speeds up
        this.score += toy.value;
        this.speedBoostT = 5;
        this.bak.setSpeed(this.bakBaseSpeed * 1.6);
        this.effects.popup(x, y, 'FETCH!', '#79ff5b');
        break;
      case 'toy-duck': // Squeak — scare the vacuums, like a free bone
        this.score += toy.value;
        this.frightenedT = this.frightenedSecs;
        this.chain = 0;
        for (const v of this.vacuums) v.frighten();
        this.effects.popup(x, y, 'SQUEAK!', '#9fd0ff');
        break;
      case 'toy-slipper': // Gotcha — freeze the vacuums in place
        this.score += toy.value;
        this.freezeT = 3;
        this.effects.popup(x, y, 'FREEZE!', '#00fbfb');
        break;
      default: { // toy-bowl — jackpot points
        const pts = toy.value * 3;
        this.score += pts;
        this.effects.popup(x, y, `+${pts}`, '#ffcf5a');
      }
    }
  }

  private playStep(dt: number): void {
    this.elapsed += dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    const mode = phaseAt(this.elapsed, this.roomIndex);

    const { entered } = this.bak.update(this.maze, this.joystick.intent ?? this.input.desired, dt);
    if (entered) {
      const eaten = this.maze.eatAt(this.bak.mover.tile.c, this.bak.mover.tile.r);
      if (eaten === 'bacon') {
        this.score += 10;
        this.audio.sfx('chomp');
      }
      else if (eaten === 'bone') {
        this.score += 50;
        this.audio.sfx('bone');
        this.frightenedT = this.frightenedSecs;
        this.chain = 0;
        for (const v of this.vacuums) v.frighten();
        const s = this.bakScreen();
        this.effects.popup(s.x, s.y, '+50', '#ffcf5a');
      }
      if (this.maze.baconRemaining() === 0) {
        const left = this.vp.sx(0);
        this.effects.confetti(left, left + this.vp.tile * this.vp.cols, this.vp.sy(0));
        this.audio.sfx('win');
        this.mode = 'cleared';
        this.modeTimer = CLEAR_TIME;
        return;
      }
    }

    if (this.frightenedT > 0) {
      this.frightenedT -= dt;
      if (this.frightenedT <= 0) for (const v of this.vacuums) v.unfrighten();
    }

    // Bonus-toy effect timers.
    if (this.speedBoostT > 0) {
      this.speedBoostT -= dt;
      if (this.speedBoostT <= 0) this.bak.setSpeed(this.bakBaseSpeed);
    }
    if (this.freezeT > 0) this.freezeT -= dt;

    // Bonus toy: appears as Bak clears the room, despawns on a timer, triggers a power-up when eaten.
    const frac = this.baconStart > 0 ? (this.baconStart - this.maze.baconRemaining()) / this.baconStart : 0;
    if (this.toysSpawned < TOY_THRESHOLDS.length && frac >= TOY_THRESHOLDS[this.toysSpawned]) {
      const tile = this.pickToyTile();
      if (tile) {
        this.toys.push(spawnToy(tile, this.roomIndex, this.toysSpawned));
        this.effects.poof(this.vp.cx(tile.c), this.vp.cy(tile.r), '#ffcf5a', 10);
      }
      this.toysSpawned++;
    }
    for (let i = this.toys.length - 1; i >= 0; i--) {
      const toy = this.toys[i];
      toy.timer -= dt;
      if (toy.timer <= 0) {
        this.toys.splice(i, 1);
      } else if (tileEq(this.bak.mover.tile, toy.tile)) {
        this.collectToy(toy);
        this.toys.splice(i, 1);
      }
    }

    const aiCtx = {
      bak: this.bak.mover.tile,
      bakDir: this.bak.dir,
      roomba: this.vacuums[0].mover.tile,
      corners: this.layout.scatterCorners,
      mode,
    };
    if (this.freezeT <= 0) {
      for (const v of this.vacuums) v.update(this.maze, aiCtx, dt);
    }

    const bp = moverPos(this.bak.mover);
    for (const v of this.vacuums) {
      if (v.state === 'eaten' || v.state === 'home') continue;
      const vpos = moverPos(v.mover);
      if (Math.hypot(bp.c - vpos.c, bp.r - vpos.r) < 0.6 || tileEq(this.bak.mover.tile, v.mover.tile)) {
        if (v.edible) {
          v.eat();
          const pts = 200 * Math.pow(2, this.chain);
          this.score += pts;
          this.chain++;
          this.audio.sfx('eatVac');
          this.effects.poof(this.vp.cx(vpos.c), this.vp.cy(vpos.r), '#9fd0ff');
          this.effects.popup(this.vp.cx(vpos.c), this.vp.cy(vpos.r), `${pts}`, '#9fd0ff');
        } else if (this.invulnT <= 0) {
          this.die();
          return;
        }
      }
    }
  }

  private bossStep(dt: number): void {
    if (!this.boss) return;
    this.elapsed += dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    const mode = phaseAt(this.elapsed, this.roomIndex);

    const { entered } = this.bak.update(this.maze, this.joystick.intent ?? this.input.desired, dt);
    if (entered) {
      const eaten = this.maze.eatAt(this.bak.mover.tile.c, this.bak.mover.tile.r);
      if (eaten === 'bacon') {
        this.score += 10;
        this.audio.sfx('chomp');
      }
      else if (eaten === 'bone') {
        this.score += 50;
        this.audio.sfx('bone');
        this.frightenedT = this.frightenedSecs;
        this.chain = 0;
        for (const v of this.vacuums) v.frighten();
        this.boss.onBoneEaten(5);
        const s = this.bakScreen();
        this.effects.popup(s.x, s.y, 'POWER!', '#ffcf5a');
      }
    }

    if (this.frightenedT > 0) {
      this.frightenedT -= dt;
      if (this.frightenedT <= 0) for (const v of this.vacuums) v.unfrighten();
    }

    this.boss.update(dt);

    const aiCtx = {
      bak: this.bak.mover.tile,
      bakDir: this.bak.dir,
      roomba: this.vacuums[0]?.mover.tile ?? this.bak.mover.tile,
      corners: this.layout.scatterCorners,
      mode,
    };
    if (this.freezeT <= 0) {
      for (const v of this.vacuums) v.update(this.maze, aiCtx, dt);
    }

    const bp = moverPos(this.bak.mover);

    // Bak vs the boss
    if (Math.hypot(bp.c - this.boss.center.c, bp.r - this.boss.center.r) < 2.2) {
      if (this.boss.vulnerable) {
        if (this.boss.hit()) {
          this.score += 500;
          this.audio.sfx('bossHit');
          const bx = this.vp.cx(this.boss.center.c);
          const by = this.vp.cy(this.boss.center.r);
          this.effects.poof(bx, by, '#ffd23a', 22);
          this.effects.addShake(11);
          this.effects.popup(bx, by - this.vp.tile, '500', '#ffd23a');
          if (this.boss.defeated) {
            this.score += 2000;
            this.saveHigh();
            this.audio.sfx('win');
            this.audio.music(null);
            this.mode = 'win';
            return;
          }
          this.bak.reset(this.layout.bakSpawn); // knock back to fetch another bone
        }
      } else {
        this.die();
        return;
      }
    }

    // Bak vs minions
    for (const v of this.vacuums) {
      if (v.state === 'eaten' || v.state === 'home') continue;
      const vpos = moverPos(v.mover);
      if (Math.hypot(bp.c - vpos.c, bp.r - vpos.r) < 0.6) {
        if (v.edible) {
          v.eat();
          const pts = 200 * Math.pow(2, this.chain);
          this.score += pts;
          this.chain++;
          this.audio.sfx('eatVac');
          this.effects.poof(this.vp.cx(vpos.c), this.vp.cy(vpos.r), '#9fd0ff');
          this.effects.popup(this.vp.cx(vpos.c), this.vp.cy(vpos.r), `${pts}`, '#9fd0ff');
        } else if (this.invulnT <= 0) {
          this.die();
          return;
        }
      }
    }
  }

  /** Dev/debug snapshot for verification. */
  snapshot(): { mode: Mode; score: number; lives: number; bacon: number; room: string; bossHp: number } {
    return {
      mode: this.mode,
      score: this.score,
      lives: this.lives,
      bacon: this.maze.baconRemaining(),
      room: this.layout.name,
      bossHp: this.boss ? this.boss.hp : -1,
    };
  }

  /** Dev-only: jump straight to the boss room. */
  devJumpToBoss(): void {
    this.score = 0;
    this.lives = 3;
    this.loadRoom(BOSS_INDEX);
    this.mode = 'playing';
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.vp.begin(ctx);
    ctx.clearRect(0, 0, this.vp.cssW, this.vp.cssH);
    ctx.fillStyle = '#1c140f';
    ctx.fillRect(0, 0, this.vp.cssW, this.vp.cssH);

    const sh = this.effects.shakeOffset();
    ctx.save();
    ctx.translate(sh.x, sh.y);
    drawScene(
      ctx,
      this.vp,
      this.maze,
      this.layout,
      {
        bak: this.bak,
        vacuums: this.vacuums,
        boss: this.boss,
        toys: this.toys,
        frightenedEnding: this.frightenedT > 0 && this.frightenedT < 2,
        bakHidden: this.invulnT > 0 && Math.floor(this.t * 10) % 2 === 0,
      },
      this.assets,
    );
    this.effects.render(ctx);
    ctx.restore();

    drawHud(
      ctx,
      this.vp,
      { score: this.score, lives: this.lives, room: this.layout.name, highScore: this.high, muted: this.audio.isMuted },
      this.assets,
    );

    if (this.mode === 'playing' || this.mode === 'ready' || this.mode === 'dying' || this.mode === 'cleared' || this.mode === 'paused') {
      this.joystick.render(ctx, this.assets);
    }

    switch (this.mode) {
      case 'title':
        drawTitle(ctx, this.vp, this.assets, this.high, this.t);
        break;
      case 'ready':
        drawReady(ctx, this.vp, this.roomIntro, this.isBoss ? 'FINAL BOSS' : `LEVEL ${this.roomIndex + 1}`, this.layout.name);
        break;
      case 'cleared':
        drawCleared(ctx, this.vp, this.roomIndex + 1);
        break;
      case 'paused':
        drawPaused(ctx, this.vp);
        break;
      case 'gameover':
        drawGameOver(ctx, this.vp, this.score, this.high);
        break;
      case 'win':
        drawWin(ctx, this.vp, this.assets, this.score, this.high);
        break;
    }
  }
}

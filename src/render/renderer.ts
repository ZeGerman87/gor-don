import type { Viewport } from '../core/viewport';
import type { Maze } from '../maze/maze';
import type { Layout, Theme } from '../maze/types';
import { type AssetStore, type Sprite, getAsset } from '../core/assets';
import { moverPos } from '../systems/movement';
import type { Bak } from '../entities/bak';
import type { Vacuum } from '../entities/vacuum';
import type { Boss } from '../entities/boss';

const WALL: Record<Theme, string> = {
  living: '#c47b4a',
  kitchen: '#6fae9c',
  bedroom: '#d98fa6',
  bathroom: '#6fa8d6',
  garage: '#8a8f98',
  boss: '#9a5b5b',
};

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) * f));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) * f));
  const b = Math.max(0, Math.min(255, (n & 255) * f));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

/** Draw an image centered at (x,y), fit within a box (max dimension), optionally flipped. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: Sprite,
  x: number,
  y: number,
  box: number,
  flipX = false,
): void {
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) return;
  const s = box / Math.max(iw, ih);
  const w = iw * s;
  const h = ih * s;
  ctx.save();
  ctx.translate(x, y);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

const _centroid = new WeakMap<Sprite, number>();
/**
 * Normalized horizontal centroid (0..1) of a sprite's opaque pixels, cached.
 * Used to optically center art (e.g. the logo) whose visual mass is off-center
 * within an otherwise symmetric bounding box.
 */
export function centroidX(img: Sprite): number {
  const cached = _centroid.get(img);
  if (cached !== undefined) return cached;
  let r = 0.5;
  try {
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const c = cv.getContext('2d')!;
    c.drawImage(img, 0, 0);
    const d = c.getImageData(0, 0, img.width, img.height).data;
    let sx = 0;
    let n = 0;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        if (d[(y * img.width + x) * 4 + 3] > 40) {
          sx += x;
          n++;
        }
      }
    }
    if (n) r = sx / n / img.width;
  } catch {
    /* cross-origin/tainted canvas — fall back to geometric center */
  }
  _centroid.set(img, r);
  return r;
}

function drawFloor(ctx: CanvasRenderingContext2D, vp: Viewport, layout: Layout, assets: AssetStore): void {
  const x = vp.sx(0);
  const y = vp.sy(0);
  const w = vp.tile * vp.cols;
  const h = vp.tile * vp.rows;
  ctx.fillStyle = '#140e0a';
  ctx.fillRect(x, y, w, h);
  const floor = assets[`floor-${layout.theme}`];
  if (floor) {
    const pat = ctx.createPattern(floor, 'repeat');
    if (pat) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = pat;
      ctx.translate(x, y);
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, vp: Viewport, maze: Maze, layout: Layout): void {
  const t = vp.tile;
  const fill = WALL[layout.theme];
  const edge = shade(fill, 0.7);
  ctx.lineWidth = Math.max(1, t * 0.08);
  ctx.strokeStyle = edge;
  ctx.fillStyle = fill;
  const r = Math.min(6, t * 0.32);
  for (let row = 0; row < maze.rows; row++) {
    for (let col = 0; col < maze.cols; col++) {
      if (!maze.isWall(col, row)) continue;
      const x = vp.sx(col) + 1;
      const y = vp.sy(row) + 1;
      const s = t - 2;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, r);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawDots(ctx: CanvasRenderingContext2D, vp: Viewport, maze: Maze, assets: AssetStore): void {
  const t = vp.tile;
  for (let row = 0; row < maze.rows; row++) {
    for (let col = 0; col < maze.cols; col++) {
      const dot = maze.dotAt(col, row);
      if (!dot) continue;
      const x = vp.cx(col);
      const y = vp.cy(row);
      if (dot === 'bacon') {
        ctx.beginPath();
        ctx.fillStyle = '#e0a36b';
        ctx.strokeStyle = '#3a2415';
        ctx.lineWidth = Math.max(1, t * 0.04);
        ctx.arc(x, y, t * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // bone power-up: soft glow then the sprite
        ctx.save();
        ctx.shadowColor = '#ffcf5a';
        ctx.shadowBlur = t * 0.5;
        drawSprite(ctx, getAsset(assets, 'bone'), x, y, t * 1.15);
        ctx.restore();
      }
    }
  }
}

export interface RenderEntities {
  bak: Bak;
  vacuums?: Vacuum[];
  boss?: Boss | null;
  toys?: Array<{ tile: { c: number; r: number }; type: string }>;
  frightenedEnding?: boolean; // flash near the end of the power-up
  bakHidden?: boolean; // blink during respawn invulnerability
}

function drawBoss(ctx: CanvasRenderingContext2D, vp: Viewport, boss: Boss, assets: AssetStore): void {
  const x = vp.cx(boss.center.c);
  const y = vp.cy(boss.center.r);
  const size = vp.tile * 6.2;
  ctx.save();
  if (boss.vulnerable) {
    ctx.filter = 'hue-rotate(150deg) saturate(1.4) brightness(1.15)';
  } else if (boss.hurtT > 0) {
    ctx.filter = 'brightness(2)';
  }
  drawSprite(ctx, getAsset(assets, 'boss'), x, y, size);
  ctx.restore();

  // Health pips above the arena
  const pipR = vp.tile * 0.35;
  const gap = vp.tile * 1.1;
  const top = vp.sy(0) + vp.tile * 0.9;
  const startX = vp.cx(boss.center.c) - ((boss.maxHp - 1) * gap) / 2;
  for (let i = 0; i < boss.maxHp; i++) {
    ctx.beginPath();
    ctx.fillStyle = i < boss.hp ? '#ff6b5e' : '#3a2e25';
    ctx.strokeStyle = '#1c140f';
    ctx.lineWidth = 2;
    ctx.arc(startX + i * gap, top, pipR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawVacuums(ctx: CanvasRenderingContext2D, vp: Viewport, vacuums: Vacuum[], assets: AssetStore, flash: boolean): void {
  for (const v of vacuums) {
    const p = moverPos(v.mover);
    const name = v.frightened && flash ? 'vacuum-scared-flash' : v.spriteName();
    const img = getAsset(assets, name === 'vacuum-scared-flash' ? 'vacuum-scared' : name);
    ctx.save();
    if (v.state === 'eaten') ctx.globalAlpha = 0.45;
    if (v.frightened && flash) ctx.filter = 'brightness(1.8)';
    drawSprite(ctx, img, vp.cx(p.c), vp.cy(p.r), vp.tile * 1.5, v.mover.dir === 'left');
    ctx.restore();
  }
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  maze: Maze,
  layout: Layout,
  ents: RenderEntities,
  assets: AssetStore,
): void {
  drawFloor(ctx, vp, layout, assets);
  drawWalls(ctx, vp, maze, layout);
  drawDots(ctx, vp, maze, assets);

  if (ents.toys) {
    for (const toy of ents.toys) {
      ctx.save();
      ctx.shadowColor = '#ffcf5a';
      ctx.shadowBlur = vp.tile * 0.4;
      drawSprite(ctx, getAsset(assets, toy.type), vp.cx(toy.tile.c), vp.cy(toy.tile.r), vp.tile * 1.25);
      ctx.restore();
    }
  }
  if (ents.boss) drawBoss(ctx, vp, ents.boss, assets);
  if (ents.vacuums) drawVacuums(ctx, vp, ents.vacuums, assets, !!ents.frightenedEnding);

  if (!ents.bakHidden) {
    const p = moverPos(ents.bak.mover);
    const img = getAsset(assets, ents.bak.mouthOpen ? 'bak' : 'bak-closed');
    const x = vp.cx(p.c);
    const y = vp.cy(p.r);
    const flip = ents.bak.dir === 'left';
    // White glow halo so the brown hero reads against same-coloured floors/walls.
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.98)';
    ctx.shadowBlur = vp.tile * 0.55;
    drawSprite(ctx, img, x, y, vp.tile * 1.7, flip);
    drawSprite(ctx, img, x, y, vp.tile * 1.7, flip);
    drawSprite(ctx, img, x, y, vp.tile * 1.7, flip); // extra passes deepen the halo
    ctx.restore();
  }
}

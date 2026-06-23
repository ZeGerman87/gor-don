import type { Viewport } from '../core/viewport';
import { type AssetStore, getAsset } from '../core/assets';
import { drawSprite, centroidX } from '../render/renderer';

function dim(ctx: CanvasRenderingContext2D, vp: Viewport, a = 0.62): void {
  ctx.fillStyle = `rgba(20,14,10,${a})`;
  ctx.fillRect(0, 0, vp.cssW, vp.cssH);
}

function center(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, px: number, weight = '700'): void {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${px}px Fredoka, "Baloo 2", system-ui, sans-serif`;
  ctx.fillText(text, x, y);
}

export function drawTitle(ctx: CanvasRenderingContext2D, vp: Viewport, assets: AssetStore, high: number, t: number): void {
  dim(ctx, vp, 0.86);
  const cx = vp.cssW / 2;
  const logo = getAsset(assets, 'logo');
  const logoBox = Math.min(vp.cssW * 0.8, 360);
  drawSprite(ctx, logo, cx + (0.5 - centroidX(logo)) * logoBox, vp.cssH * 0.3, logoBox);
  const dog = getAsset(assets, 'bak');
  const dogBox = Math.min(vp.cssW * 0.34, 150);
  drawSprite(ctx, dog, cx + (0.5 - centroidX(dog)) * dogBox, vp.cssH * 0.52, dogBox);
  if (Math.floor(t * 1.5) % 2 === 0) center(ctx, 'tap to start', cx, vp.cssH * 0.66, '#ff7a1a', 24);
  center(ctx, `HIGH  ${high}`, cx, vp.cssH * 0.72, '#d8c4ad', 16, '600');
  center(ctx, 'swipe or arrow keys to move', cx, vp.cssH * 0.78, '#8a7560', 13, '600');
}

export function drawReady(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  intro: boolean,
  title: string,
  subtitle: string,
): void {
  const cy = vp.originY + vp.tile * vp.rows * 0.5;
  if (intro) {
    center(ctx, title, vp.cssW / 2, cy - 16, '#ffcf5a', 36);
    center(ctx, subtitle, vp.cssW / 2, cy + 22, '#ff7a1a', 20, '600');
  } else {
    center(ctx, 'READY!', vp.cssW / 2, cy, '#ffcf5a', 30);
  }
}

export function drawCleared(ctx: CanvasRenderingContext2D, vp: Viewport, level: number): void {
  const cy = vp.originY + vp.tile * vp.rows * 0.42;
  center(ctx, 'ROOM CLEAR!', vp.cssW / 2, cy, '#ffcf5a', 36);
  center(ctx, `Good boy, Gordon!  ·  Level ${level} done`, vp.cssW / 2, cy + 28, '#fff7ec', 16, '600');
}

export function drawPaused(ctx: CanvasRenderingContext2D, vp: Viewport): void {
  dim(ctx, vp);
  center(ctx, 'PAUSED', vp.cssW / 2, vp.cssH * 0.45, '#fff7ec', 32);
  center(ctx, 'tap to resume', vp.cssW / 2, vp.cssH * 0.52, '#ff7a1a', 18, '600');
}

export function drawGameOver(ctx: CanvasRenderingContext2D, vp: Viewport, score: number, high: number): void {
  dim(ctx, vp, 0.78);
  center(ctx, 'GAME OVER', vp.cssW / 2, vp.cssH * 0.4, '#ff6b5e', 36);
  center(ctx, `SCORE  ${score}`, vp.cssW / 2, vp.cssH * 0.49, '#fff7ec', 22, '600');
  center(ctx, `HIGH  ${high}`, vp.cssW / 2, vp.cssH * 0.54, '#d8c4ad', 18, '600');
  center(ctx, 'tap to play again', vp.cssW / 2, vp.cssH * 0.62, '#ff7a1a', 18, '600');
}

export function drawWin(ctx: CanvasRenderingContext2D, vp: Viewport, assets: AssetStore, score: number, high: number): void {
  dim(ctx, vp, 0.9);
  const img = getAsset(assets, 'win');
  drawSprite(ctx, img, vp.cssW / 2, vp.cssH * 0.42, Math.min(vp.cssW * 0.9, vp.cssH * 0.55));
  center(ctx, 'GOOD BOY!', vp.cssW / 2, vp.cssH * 0.08, '#ffcf5a', 34);
  center(ctx, `SCORE  ${score}`, vp.cssW / 2, vp.cssH * 0.76, '#fff7ec', 22, '600');
  center(ctx, `HIGH  ${high}`, vp.cssW / 2, vp.cssH * 0.81, '#d8c4ad', 18, '600');
  center(ctx, 'tap to play again', vp.cssW / 2, vp.cssH * 0.88, '#ff7a1a', 18, '600');
}

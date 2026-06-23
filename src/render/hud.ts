import type { Viewport } from '../core/viewport';
import { type AssetStore, getAsset } from '../core/assets';
import { drawSprite } from './renderer';

export interface HudState {
  score: number;
  lives: number;
  room: string;
  highScore?: number;
  muted?: boolean;
}

export function drawHud(ctx: CanvasRenderingContext2D, vp: Viewport, s: HudState, assets: AssetStore): void {
  ctx.save();
  ctx.textBaseline = 'middle';
  const y = 30;

  // Score (left)
  ctx.fillStyle = '#fff7ec';
  ctx.font = '700 20px Fredoka, "Baloo 2", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${s.score}`, 16, y);
  ctx.font = '600 11px Nunito, system-ui, sans-serif';
  ctx.fillStyle = '#d8c4ad';
  ctx.fillText('SCORE', 16, y - 16);

  // Room (center)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff7a1a';
  ctx.font = '600 15px Fredoka, "Baloo 2", system-ui, sans-serif';
  ctx.fillText(s.room, vp.cssW / 2 - 18, y);

  // Pause + mute buttons (far right)
  ctx.textAlign = 'center';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#fff7ec';
  ctx.fillText('⏸', vp.cssW - 54, y);
  ctx.fillStyle = s.muted ? '#8a7560' : '#fff7ec';
  ctx.fillText(s.muted ? '🔇' : '🔊', vp.cssW - 22, y);

  // Lives as mini Bak heads (left of the buttons)
  const icon = getAsset(assets, 'bak');
  const size = 18;
  for (let i = 0; i < s.lives; i++) {
    drawSprite(ctx, icon, vp.cssW - 84 - i * (size + 2), y, size);
  }
  ctx.restore();
}

import type { Dir } from './types';
import type { Viewport } from './viewport';
import type { AssetStore } from './assets';
import { drawSprite } from '../render/renderer';

/**
 * On-screen virtual joystick living in the empty zone below the maze.
 * Pressing anywhere in that zone grabs the stick; the knob tracks the finger
 * (clamped to the base), and its offset chooses a cardinal direction for Bak.
 */
export class Joystick {
  primary: Dir | null = null;
  secondary: Dir | null = null;
  private cx = 0;
  private cy = 0;
  private baseR = 60;
  private knobR = 30;
  private zoneTopY = 0;
  private active = false;
  private knobX = 0;
  private knobY = 0;

  setLayout(vp: Viewport): void {
    this.zoneTopY = vp.originY + vp.tile * vp.rows;
    const zoneH = Math.max(140, vp.cssH - this.zoneTopY);
    this.cx = vp.cssW / 2;
    this.cy = this.zoneTopY + zoneH * 0.52;
    this.baseR = Math.min(vp.cssW * 0.2, zoneH * 0.34, 88);
    this.knobR = this.baseR * 0.46;
    this.knobX = this.cx;
    this.knobY = this.cy;
  }

  attach(el: Window = window): void {
    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.clientY >= this.zoneTopY) {
        this.active = true;
        this.set(e.clientX, e.clientY);
      }
    });
    el.addEventListener('pointermove', (e: PointerEvent) => {
      if (this.active) this.set(e.clientX, e.clientY);
    });
    const end = (): void => {
      this.active = false;
      this.primary = null;
      this.secondary = null;
      this.knobX = this.cx;
      this.knobY = this.cy;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  /** Ordered steering intent: [primary] or [primary, fallback], or null when idle. */
  get intent(): Dir[] | null {
    if (!this.primary) return null;
    return this.secondary ? [this.primary, this.secondary] : [this.primary];
  }

  private set(x: number, y: number): void {
    let dx = x - this.cx;
    let dy = y - this.cy;
    const mag = Math.hypot(dx, dy);
    if (mag > this.baseR) {
      dx = (dx / mag) * this.baseR;
      dy = (dy / mag) * this.baseR;
    }
    this.knobX = this.cx + dx;
    this.knobY = this.cy + dy;
    const dead = this.baseR * 0.2;
    const sub = this.baseR * 0.18; // even a slight minor-axis tilt registers as a fallback turn
    if (Math.hypot(dx, dy) < dead) {
      this.primary = null;
      this.secondary = null;
      return;
    }
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax >= ay) {
      this.primary = dx > 0 ? 'right' : 'left';
      this.secondary = ay > sub ? (dy > 0 ? 'down' : 'up') : null;
    } else {
      this.primary = dy > 0 ? 'down' : 'up';
      this.secondary = ax > sub ? (dx > 0 ? 'right' : 'left') : null;
    }
  }

  render(ctx: CanvasRenderingContext2D, assets: AssetStore): void {
    const base = assets['joystick-base'];
    if (base) {
      drawSprite(ctx, base, this.cx, this.cy, this.baseR * 2);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, this.baseR, 0, Math.PI * 2);
      ctx.fillStyle = '#2a211b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#6b5746';
      ctx.stroke();
      ctx.restore();
    }
    const knob = assets['joystick-knob'];
    if (knob) {
      drawSprite(ctx, knob, this.knobX, this.knobY, this.knobR * 2);
    } else {
      ctx.save();
      ctx.globalAlpha = this.active ? 0.95 : 0.6;
      ctx.beginPath();
      ctx.arc(this.knobX, this.knobY, this.knobR, 0, Math.PI * 2);
      ctx.fillStyle = this.active ? '#ff7a1a' : '#c47b4a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff7ec';
      ctx.stroke();
      ctx.restore();
    }
  }
}

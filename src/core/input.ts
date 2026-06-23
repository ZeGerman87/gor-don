import type { Dir } from './types';

/** Map a swipe/drag delta to a cardinal direction (dominant axis), or null if too small. */
export function swipeToDir(dx: number, dy: number, threshold = 18): Dir | null {
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

/** Latest desired direction from touch swipes or the keyboard. */
export class Input {
  desired: Dir | null = null;
  tapped = false; // consumed by menus
  tapX = -1;
  tapY = -1;
  private startX = 0;
  private startY = 0;
  private active = false;

  attach(el: HTMLElement | Window = window): void {
    const target = el as Window & HTMLElement;
    target.addEventListener('pointerdown', (e: PointerEvent) => {
      this.active = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
    });
    // Touch steering is handled by the on-screen Joystick; Input only does taps + keyboard.
    const end = (e: PointerEvent) => {
      if (this.active && Math.abs(e.clientX - this.startX) < 8 && Math.abs(e.clientY - this.startY) < 8) {
        this.tapped = true;
        this.tapX = e.clientX;
        this.tapY = e.clientY;
      }
      this.active = false;
    };
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', () => (this.active = false));
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') this.desired = 'up';
      else if (k === 'arrowdown' || k === 's') this.desired = 'down';
      else if (k === 'arrowleft' || k === 'a') this.desired = 'left';
      else if (k === 'arrowright' || k === 'd') this.desired = 'right';
      else if (k === ' ' || k === 'enter') {
        this.tapped = true;
        this.tapX = -1;
        this.tapY = -1;
      }
    });
  }

  /** Read & clear a tap (for menu/scene advance). */
  consumeTap(): boolean {
    const t = this.tapped;
    this.tapped = false;
    return t;
  }
}

// Lightweight screen-space effects: burst particles, floating score popups, screen shake.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  color: string;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export class Effects {
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private shake = 0;

  poof(x: number, y: number, color: string, n = 14): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 130;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        life: 0.5 + Math.random() * 0.35,
        max: 0.85,
        r: 2 + Math.random() * 3,
        color,
      });
    }
  }

  popup(x: number, y: number, text: string, color = '#fff7ec'): void {
    this.popups.push({ x, y, text, life: 0.9, color });
  }

  /** Celebratory rain of multi-coloured confetti across [left,right], falling from `top`. */
  confetti(left: number, right: number, top: number, n = 80): void {
    const colors = ['#ff7a1a', '#ffcf5a', '#79ff5b', '#9fd0ff', '#ff5ea8', '#00fbfb', '#ffffff'];
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: left + Math.random() * (right - left),
        y: top - 20 - Math.random() * 60,
        vx: (Math.random() * 2 - 1) * 70,
        vy: 30 + Math.random() * 90,
        life: 1.2 + Math.random() * 0.9,
        max: 2.1,
        r: 2.5 + Math.random() * 3.5,
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  addShake(a: number): void {
    this.shake = Math.min(16, Math.max(this.shake, a));
  }

  shakeOffset(): { x: number; y: number } {
    if (this.shake <= 0) return { x: 0, y: 0 };
    return { x: (Math.random() * 2 - 1) * this.shake, y: (Math.random() * 2 - 1) * this.shake };
  }

  update(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.popups) {
      p.y -= 32 * dt;
      p.life -= dt;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 36);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 16px Fredoka, "Baloo 2", system-ui, sans-serif';
    for (const p of this.popups) {
      ctx.globalAlpha = Math.min(1, p.life / 0.9);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }
}

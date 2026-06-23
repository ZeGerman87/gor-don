/** Sizes the canvas to the device and maps tile coords to screen pixels. */
export class Viewport {
  cssW = 0;
  cssH = 0;
  dpr = 1;
  tile = 0;
  originX = 0;
  originY = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    public cols: number,
    public rows: number,
  ) {
    this.resize();
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.cssW = window.innerWidth;
    this.cssH = window.innerHeight;
    this.canvas.width = Math.floor(this.cssW * this.dpr);
    this.canvas.height = Math.floor(this.cssH * this.dpr);

    const topHud = 60;
    const botPad = 28;
    const sidePad = 8;
    const availW = this.cssW - sidePad * 2;
    const availH = this.cssH - topHud - botPad;
    this.tile = Math.max(4, Math.floor(Math.min(availW / this.cols, availH / this.rows)));
    const mw = this.tile * this.cols;
    const mh = this.tile * this.rows;
    this.originX = Math.floor((this.cssW - mw) / 2);
    // Bias the board toward the top so the slack becomes thumb room at the bottom.
    this.originY = topHud + Math.floor((availH - mh) * 0.2);
  }

  /** Reset the context transform to draw in CSS pixels (handles DPR). */
  begin(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  sx(c: number): number {
    return this.originX + c * this.tile;
  }
  sy(r: number): number {
    return this.originY + r * this.tile;
  }
  cx(c: number): number {
    return this.originX + (c + 0.5) * this.tile;
  }
  cy(r: number): number {
    return this.originY + (r + 0.5) * this.tile;
  }
}

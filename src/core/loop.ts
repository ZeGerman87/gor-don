/** Fixed-timestep game loop: update() runs in 1/60 increments, render() once per frame. */
export function startLoop(update: (dt: number) => void, render: () => void): void {
  const STEP = 1 / 60;
  let acc = 0;
  let last = performance.now() / 1000;

  function frame(now: number): void {
    const t = now / 1000;
    let dt = t - last;
    last = t;
    if (dt > 0.25) dt = 0.25; // avoid spiral-of-death after a tab stall
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard++ < 8) {
      update(STEP);
      acc -= STEP;
    }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

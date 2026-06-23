import { Viewport } from './core/viewport';
import { Input } from './core/input';
import { startLoop } from './core/loop';
import { loadAssets } from './core/assets';
import { Audio } from './core/audio';
import { MAZE_W, MAZE_H } from './maze/layouts';
import { Game } from './game/game';

async function main(): Promise<void> {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const assets = await loadAssets();

  const vp = new Viewport(canvas, MAZE_W, MAZE_H);

  const input = new Input();
  input.attach(window);

  const audio = new Audio();
  const game = new Game(vp, assets, input, audio);
  const relayout = (): void => {
    vp.resize();
    game.onResize();
  };
  window.addEventListener('resize', relayout);
  window.addEventListener('orientationchange', relayout);
  // The mobile address bar showing/hiding fires on the visual viewport, not window.
  window.visualViewport?.addEventListener('resize', relayout);
  startLoop((dt) => game.update(dt), () => game.render(ctx));

  // Dev-only hook: step the sim deterministically (the headless preview throttles rAF).
  if (import.meta.env.DEV) {
    const w = window as unknown as Record<string, unknown>;
    w.__game = game;
    w.__step = (n = 60) => {
      for (let i = 0; i < n; i++) game.update(1 / 60);
      game.render(ctx);
      return game.snapshot();
    };
    w.__boss = () => {
      game.devJumpToBoss();
      game.render(ctx);
      return game.snapshot();
    };
  }
}

void main();

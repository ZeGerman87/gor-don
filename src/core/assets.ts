// Loads sprite PNGs from assets/sprites/ via Vite's glob (works in dev + build).
// Any name that fails to load gets a procedural placeholder so the game stays playable.

export type Sprite = HTMLImageElement | HTMLCanvasElement;
export type AssetStore = Record<string, Sprite>;

const urls = import.meta.glob('../../assets/sprites/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function nameOf(path: string): string {
  return path.split('/').pop()!.replace(/\.png$/, '');
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const FALLBACK_COLOR: Array<[string, string]> = [
  ['vacuum-roomba', '#e23b34'],
  ['vacuum-upright', '#e85aa6'],
  ['vacuum-stick', '#25b3a6'],
  ['vacuum-mop', '#f0892f'],
  ['vacuum-scared', '#3a6ff0'],
  ['boss', '#9a5b5b'],
  ['bak', '#ffcf5a'],
  ['bacon', '#c0492c'],
  ['bone', '#f2e7c8'],
  ['toy', '#8fd06f'],
  ['logo', '#ff7a1a'],
];

function fallback(name: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const color = FALLBACK_COLOR.find(([k]) => name.startsWith(k))?.[1] ?? '#cccccc';
  x.fillStyle = color;
  x.beginPath();
  x.arc(32, 32, 26, 0, Math.PI * 2);
  x.fill();
  x.lineWidth = 3;
  x.strokeStyle = '#00000055';
  x.stroke();
  x.fillStyle = '#1c140f';
  x.font = 'bold 11px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(name.replace(/^(vacuum-|toy-|floor-)/, '').slice(0, 6), 32, 33);
  return c;
}

export async function loadAssets(): Promise<AssetStore> {
  const store: AssetStore = {};
  await Promise.all(
    Object.entries(urls).map(async ([path, url]) => {
      const name = nameOf(path);
      try {
        store[name] = await loadImage(url);
      } catch {
        store[name] = fallback(name);
      }
    }),
  );
  return store;
}

export function getAsset(store: AssetStore, name: string): Sprite {
  return store[name] ?? (store[name] = fallback(name));
}

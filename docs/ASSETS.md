# Visual assets — Bak-Man

All art is original, generated with Google Gemini ("Nano Banana") from the prompts agreed during
design, then processed into game-ready sprites. This documents what exists, how it's processed, and
how to replace or extend it.

## Pipeline

1. Generate each asset with Gemini using the shared **style block + per-asset subject** (see "Prompts"
   below). Gemini bakes a gray checkerboard behind the art instead of real transparency — that's fine.
2. Drop the raw images into `assets/raw/` (any reasonable name; see the manifest).
3. Run the processor:
   ```
   python3 tools/process_assets.py
   ```
   It keys out the border-connected gray checkerboard, auto-splits the multi-item sheets into separate
   sprites via connected-component blobs, de-fringes, trims, resizes, and writes named PNGs to
   `assets/sprites/`. It also writes a contact sheet to `docs/asset_preview.png`.
4. The engine loads sprites by name from `assets/sprites/` via the asset manifest. **Anything missing
   falls back to procedural placeholder art**, so the game is always playable.

## Style + palette (keep consistent)

Cute, friendly mobile-game art: semi-flat vector cartoon, bold clean dark outlines, soft cel-shading,
bright warm colours, storybook charm; readable at small size on a phone. Each vacuum owns one hue so
the player learns enemies by colour. Full palette in [THEME.md](THEME.md).

## Sprites (in `assets/sprites/`)

Sizes are the processed widths (the engine scales to the tile grid as needed).

| Sprite file | What it is | Notes |
|---|---|---|
| `bak.png` | Bak, mouth **open** | Hero frame A. Faces right; engine flips/reuses for other headings. |
| `bak-closed.png` | Bak, mouth **closed** | Hero frame B — alternate for the chomp. |
| `vacuum-roomba.png` | Red round robot vacuum | Enemy: *chaser*. |
| `vacuum-upright.png` | Pink upright vacuum | Enemy: *ambusher*. |
| `vacuum-stick.png` | Teal cordless stick vac | Enemy: *flanker*. |
| `vacuum-mop.png` | Orange robot mop | Enemy: *shy*. |
| `vacuum-scared.png` | Frightened/unplugged vacuum | Shared frightened-state sprite (tinted + flashed by the engine). |
| `boss.png` | "The Big Vac" | Boss; engine draws its health bar + eye-state tint. |
| `bacon.png` | Bacon strip | The pellet. Procedural fallback: a drawn nub. |
| `bone.png` | Glowing dog bone | The power-up. Procedural fallback: a drawn bone. |
| `toy-ball.png` | Tennis ball | Bonus "fruit". |
| `toy-duck.png` | Rubber duck | Bonus "fruit". |
| `toy-slipper.png` | Plaid slipper | Bonus "fruit". |
| `toy-bowl.png` | Food bowl (paw print) | Bonus "fruit". |
| `logo.png` | "BAK-MAN" wordmark | Title screen. Procedural fallback: styled text. |
| `win.png` | Win-screen illustration | Bak atop the defeated Big Vac. Engine overlays "YOU WIN" + score. |
| `floor-living.png` | Wood floor | Living Room floor texture (tiled, dimmed for contrast). |
| `floor-kitchen.png` | Checker tile | Kitchen floor. |
| `floor-bedroom.png` | Carpet | Bedroom floor. |
| `floor-bathroom.png` | White tile | Bathroom floor. |
| `floor-garage.png` | Concrete | Garage floor. |
| `joystick-base.png` | On-screen joystick ring (top view) | Mobile control base. Procedural fallback: a drawn ring. |
| `joystick-knob.png` | On-screen joystick knob/cap (top view) | The draggable thumb stick. Procedural fallback: a drawn knob. |

Procedurally generated (no art needed): maze walls (drawn from layout data + per-room colour),
particles/poofs, the dock, the HUD, and PWA app icons (derived from `bak.png`).

## Raw → processed mapping (`tools/process_assets.py`)

- **Singles** (keyed, trimmed, resized): `bak`, `bak-closed`, `boss`, `logo`, `vacuum-scared`.
- **Sheets** (keyed, then split into blobs by grid position): `vacuums.png` → 4 vacuums,
  `toys.png` → 4 toys, `bacon-bone.png` → bacon + bone.
- **Floors** (`floors.png`): trimmed to the texture block, sliced into 5 vertical strips.
- **Win** (`win.png`): full illustration, kept as-is (just resized).

## Replacing or adding art

Re-generate any asset, drop it in `assets/raw/` under the same base name (sheets keep the same grid
layout), and re-run the processor. To wire a brand-new asset, add its filename to the engine's asset
manifest. No other code changes needed.

## Prompts (for regeneration)

**Shared style block** (prefix every generation):
> Cute mobile-game art for "Bak-Man", a dog-themed Pac-Man in a cozy house. Friendly semi-flat vector
> cartoon, bold clean dark outlines, soft cel-shading, bright warm colours, storybook charm. Single
> subject, centered, filling the frame; transparent (or flat #CCCCCC) background; no text, no scenery,
> no ground shadow; crisp outline so it pops on a light floor; readable at small size.

Per-asset subjects are recorded in the design conversation; key ones: **Bak** = Husky × German Shepherd
mix, mostly black with white chest/muzzle/paws, tan eyebrow dots, pointy ears, fluffy tail, orange
collar, 3/4 view facing right, mouth open to chomp. **Vacuums** = a 2×2 grid (red Roomba / pink upright
/ teal stick / orange mop), each with one expressive cartoon eye.

---
name: Cozy House Arcade
colors:
  # base / surfaces
  background: '#1c140f'        # warm near-black behind the playfield + letterboxing
  surface: '#2a211b'           # HUD bars / cards
  surface-bright: '#3a2e25'
  on-surface: '#fff7ec'        # primary text on dark
  on-surface-variant: '#d8c4ad'
  outline: '#6b5746'
  # brand / accent (Bak's collar)
  primary: '#ff7a1a'
  on-primary: '#3a1c00'
  primary-container: '#ffd6ab'
  # collectibles
  bacon: '#c0492c'
  bone: '#f2e7c8'
  bone-glow: '#ffcf5a'
  # enemy hues (one per vacuum)
  enemy-roomba: '#e23b34'      # red — chaser
  enemy-upright: '#e85aa6'     # pink — ambusher
  enemy-stick: '#25b3a6'       # teal — flanker
  enemy-mop: '#f0892f'         # orange — shy
  frightened: '#3a6ff0'        # blue scared state
  frightened-flash: '#eaf0ff'  # warning flash
  # per-room wall colours (floor textures live in assets/sprites/floor-*.png)
  room-living: '#c47b4a'
  room-kitchen: '#6fae9c'
  room-bedroom: '#d98fa6'
  room-bathroom: '#6fa8d6'
  room-garage: '#8a8f98'
  # status
  success: '#5cc26a'
  error: '#ff6b5e'
typography:
  display-hero:
    fontFamily: Fredoka
    fontSize: 48px
    fontWeight: '700'
    letterSpacing: 0.01em
  headline:
    fontFamily: Fredoka
    fontSize: 28px
    fontWeight: '600'
  body:
    fontFamily: Nunito
    fontSize: 16px
    fontWeight: '600'
  score-display:
    fontFamily: Fredoka
    fontSize: 24px
    fontWeight: '700'
    letterSpacing: 0.02em
rounded:
  sm: 0.375rem
  DEFAULT: 0.625rem
  lg: 1rem
  full: 9999px
spacing:
  safe-margin: 20px
  gutter: 12px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 32px
---

## Brand & style
"Cozy House Arcade" — the warmth of a sunlit living room meets the snappy readability of a classic
maze arcade. Everything is rounded, friendly, and bright, sitting on a warm near-black field so the
gameplay elements pop. The humour is gentle: a happy dog versus a houseful of grumpy appliances.

## Colour
- **Warm void background** (`#1c140f`) frames the playfield and fills safe-area letterboxing, giving
  maximum contrast for sprites and dots — the arcade trick, but warm instead of pure black.
- **Bak's orange** (`#ff7a1a`, from his collar) is the brand accent: selected menu items, the score,
  power-up timer, and key call-to-action glows.
- **One hue per vacuum** so the player learns enemies at a glance: red chaser, pink ambusher, teal
  flanker, orange shy. The **frightened** state overrides all four with blue, flashing near its end.
- **Collectibles** read instantly: warm reddish **bacon** dots with a light outline; a cream **bone**
  with a golden glow marking it as the power-up.
- **Per-room wall colour** themes each maze (wood-trim living room, sage kitchen, rose bedroom, sky
  bathroom, steel garage); the floor is the matching `floor-*` texture, dimmed ~25% so sprites and
  dots stay legible on top.

## Typography
- **Fredoka** (rounded, chunky, playful) for the logo, headlines, level cards, and the score readout —
  it matches the cartoon art and stays readable when small.
- **Nunito** for body text, instructions, and buttons — friendly and highly legible.
- Web-font with system rounded fallbacks (`"Fredoka", "Baloo 2", system-ui, sans-serif`) so the game
  still renders cleanly before fonts load.

## Layout & motion
- **20px safe-zone** around the screen for the notch / home bar; HUD (score, lives, room) pinned to the
  top, the maze centered, controls are full-screen swipe (no on-screen buttons to obscure play).
- Depth via soft glows, not hard shadows: bone glow, power-up aura around Bak while a bone is active,
  a subtle vignette on the warm background.
- Motion is bouncy and quick: a little squash on Bak's chomp, a pop+poof when a vacuum is eaten, a
  gentle card slide for room intros, screen shake reserved for boss hits.

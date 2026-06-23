# Design — Bak-Man (dog-themed maze arcade)

Status: approved 2026-06-23.

An original, Pac-Man-style maze arcade game starring **Bak**, a Husky × German Shepherd mix,
loose in a cozy house full of hostile vacuum cleaners. Mobile-first, delivered as a link you tap
and play in mobile Safari — no install. Original engine, original synthesized audio, original art.
Not affiliated with Bandai Namco's Pac-Man; no copyrighted assets or trademarked names are used.

## Platform & delivery
- HTML5 Canvas + TypeScript + Vite. Lightweight, fast to load over cellular, full pixel control.
- Portrait orientation. Scales to any phone; respects notch / home-bar safe areas. Targets 60fps.
- Shipped as static files + PWA ("Add to Home Screen", fullscreen, offline after first load).
- Hosted free (default: GitHub Pages).

## Controls
- **On-screen joystick** in the thumb zone below the maze: drag it to set Bak's heading
  (up/down/left/right). Bak keeps rolling in the current direction and turns at the next valid
  opening — the classic Pac-Man "buffered turn" feel. Arrow keys / WASD also work on desktop.
- HUD buttons: **pause** (⏸) and **mute** (🔊). Menus advance on tap.

## The world — a cozy house
- **5 rooms**, each a hand-designed maze: **Living Room → Kitchen → Bedroom → Bathroom → Garage**.
- Each room has its own wall colour and floor texture (see THEME.md / ASSETS.md).
- A **charging dock** in the centre is the vacuums' "den": they emerge from it and return there to
  reboot after being chomped.
- **Doggie-door warp tunnels** on the left/right edges wrap Bak (and the vacuums) across the room.

## Goal & game flow
- Eat all the **bacon strips** in a room to clear it.
- Title → room-intro card → play the room → clear → next room → …
- Clear the full house **twice (10 rooms)** with difficulty rising, then a **boss room** vs. **The Big Vac**.
- Beat the boss → **win screen**. Lose all lives → game over. Pause anytime.

## Bak (the player)
- Two-frame chomp (mouth open/closed) that animates as he moves; faces his heading
  (sprite flips left/right, reused for up/down).
- 3 lives; lose one on vacuum contact; brief respawn invulnerability with a blink.

## The vacuums (enemies) — Pac-Man's four ghosts, reimagined
Four types, each owning a colour and an AI personality:
- **Roomba (red)** — *chaser*: targets Bak's current tile (Blinky).
- **Upright (pink)** — *ambusher*: targets a few tiles ahead of Bak's heading (Pinky).
- **Stick (teal)** — *flanker*: targets a tile derived from Bak + Roomba's positions — unpredictable (Inky).
- **Mop (orange)** — *shy*: chases when far, peels off to its corner when close (Clyde).

Movement is grid-locked. At each intersection a vacuum picks, among the non-reverse options, the move
that minimises straight-line distance to its current target tile. A global **scatter ↔ chase** timer
flips all vacuums between "go to your home corner" and "hunt" phases.

## Power-up — the big bone
- A few **bones** sit in fixed spots. Eat one → all vacuums enter **frightened** state for a few
  seconds: they slow down, turn blue (scared sprite), and flee (move away from Bak).
- Bak can chomp a frightened vacuum → it becomes a pair of "eyes/plug" that races back to the dock and
  reboots. Successive chomps on one bone score **200 → 400 → 800 → 1600**.
- The frightened state flashes white as a warning just before it ends.

## Bonus toys (power-ups)
- After Bak has eaten a set number of bacon strips (and again later in the room), a **toy** appears
  near the dock for a while. Each toy grants points **plus** a distinct power-up (two different toys
  per room, cycling through all four):
  - 🎾 **Tennis ball** — *Fetch frenzy*: Bak speeds up (~5s).
  - 🦆 **Rubber duck** — *Squeak!*: all vacuums panic and flee (~6s), like a free bone.
  - 🥿 **Slipper** — *Gotcha*: vacuums freeze in place (~3s).
  - 🥣 **Food bowl** — *Jackpot*: a big point bonus (3×).
- Each pickup shows its effect (FETCH! / SQUEAK! / FREEZE! / +points), a sparkle, and a sound.

## Scoring & persistence
- Bacon 10 · bone 50 · frightened-vacuum chain 200/400/800/1600 · toys 100–1000 by room · room-clear bonus.
- High score saved on-device (`localStorage`); shown on the title and game-over screens.

## The boss — The Big Vac
- A large central-vacuum overlord in a special arena, with a health bar and a glowing red eye (its
  weak point), assisted by 1–2 minion vacuums.
- **Mechanic (an extension of the bone power-up):** a few bones sit in the arena. Eat one → the Big Vac
  powers down for ~5s, its eye turns blue, and Bak can chomp the exposed intake/eye to land a hit.
  Three hits defeat it. Between windows it sweeps the arena and creates a "suction" hazard that tugs
  Bak toward its intake. Contact while it is *not* powered down costs a life.
- Defeat → big score bonus + the **win screen**. Multi-stage feel via faster sweeps after each hit.

## Audio
- Synthesized retro SFX (chomp/"waka", bone, chomp-vacuum, death, toy pickup, boss hit) + looping
  music (one house theme, one boss theme). Web Audio API, starts on first tap (iOS), mute button.

## Juice
- Chomp mouth animation, particle "poof" when a vacuum is eaten, screen shake on boss hits,
  respawn blink, floating score popups, room-intro cards. Tuned to hold 60fps on a phone.

## Architecture (brief)
- Fixed-timestep game loop; a tile-based maze model (grid of wall / bacon / bone / warp / dock cells);
  entities (Bak, four vacuum types, boss); systems (input, AI/targeting, collision, scoring,
  frightened-timer, spawning); a scene/state manager; a per-room layout table; an asset manifest.
- Built first with procedural placeholder art so it is fully playable immediately; the real sprites
  (already generated — 21 files in `assets/sprites/`) drop in via the manifest with no code changes.

## Out of scope (YAGNI)
- Accounts, online leaderboards, multiplayer, level editor, monetization, rooms beyond the 5 + boss.

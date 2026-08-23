# Asset Licenses

## Game code & generated assets

All source code in this repository is **MIT licensed** (see `LICENSE`).

**All in-game artwork is procedural.** Every texture (player ships, enemies, bosses, bullets, items, particles, backgrounds) is drawn at boot with the Canvas 2D API by `src/art/textures.ts` and `src/art/backgrounds.ts`. There are no image files.

**All audio is synthesized at runtime** by `src/systems/audio/engine.ts` using the Web Audio API (oscillators, noise buffers, biquad filters). There are no audio files and no samples.

Fonts: system UI/monospace font stacks only — no webfont files are shipped.

## Third-party runtime dependencies

| Package | Version | License | Use                                    |
| ------- | ------- | ------- | -------------------------------------- |
| phaser  | 3.90.0  | MIT     | Game engine (rendering, input, scenes) |

Dev-only tooling (Vite, TypeScript, Vitest, Playwright, ESLint, Prettier, typescript-eslint, @eslint/js) is used for building/testing and is not distributed with the game. Their licenses are MIT/BSD/Apache-2.0 per their packages; see `node_modules/<pkg>/LICENSE` or the lockfile for exact copies.

## Originality statement

Propeller Dawn is an original fictional work: its name, slogan, world, factions, ship designs (DA-01 Lark / DA-07 Kite / DA-12 Rook), enemy roster, bosses (The Solbreaker, The Ember Crown), stages, music and UI are created for this project. It does not reproduce names, logos, characters, designs, stage layouts, music or other distinctive elements of any existing commercial shoot 'em up, and it uses no real-world national symbols.

# Propeller Dawn — Architecture

## Stack

TypeScript 5.9 (strict) · Vite 7 · Phaser 3.90 · Vitest 3 · Playwright · ESLint 9 + Prettier · Web Audio API.

No runtime dependencies other than Phaser. No backend, no trackers, no CDN scripts.

## Layering rule

```
pure logic (no Phaser imports)      Phaser-coupled
─────────────────────────────       ─────────────────────────
src/core/*        types, rng        src/art/*       textures, parallax bg
src/systems/*     score, combat,    src/entities/*  player, enemies, bosses,
                  powerup, save,                    bullets (pools), items
                  patterns, waves,  src/scenes/*    scene flow & orchestration
                  input, audio,     src/ui/*        HUD, widgets
                  locale
src/data/*        ships, enemies,
                  stages, difficulty
```

Everything game-rule-shaped lives on the left and is unit-tested without a DOM.
Phaser classes consume them; they never import back.

## Key decisions

### Fixed-timestep simulation

`GameScene.update` accumulates wall delta and steps logic at 60 Hz (max 5 catch-up steps). Input latency and collision fairness are frame-rate independent; rendering interpolates implicitly via Phaser.

### Data-driven content

Stages are timelines of `{ atSec, section, spawns[], bossId?, bannerKey? }`. Enemy behavior = `EnemyDef` (hp/score/fire timers/pattern params/drop table) + `MoveId` path function. Difficulty is a multiplier bundle (`enemySpeed/fireInterval/bulletSpeed/bossHp/lives/score`). Balance changes never touch systems code. `tests/unit/stages.test.ts` validates timeline integrity (sorted, ≥10 sections, known ids, gentle first 60 s).

### Bullet patterns as pure generators

`PATTERNS[id](ctx, params) → BulletSpawn[]`. Deterministic under the seeded RNG (`mulberry32`); the run seed comes from the run state (URL-overridable for reproduction). Splitting bullets carry metadata and are expanded by the pool.

### Object pooling

`EnemyBulletPool` (cap 620) and `PlayerBulletPool` (cap 90) recycle `Image`s through swap-remove arrays — zero per-frame allocation on the hot path. Items use the same strategy. Off-screen bullets are recycled immediately in `update`.

### Bosses are scripted state machines

`BossBase` exposes hit circles, hazards, damage routing by part index. **The Solbreaker**: 3 HP phases (cross-fans → rotating rings + summons → enraged spiral + gap-walls) with charge-flash telegraphs. **Ember Crown**: sequential part destruction (thruster L/R → gunner with telegraphed laser column hazard → core combo phase). Damage routing makes armored parts genuinely invulnerable rather than just tanky.

### Save pipeline

`SaveService` owns a versioned schema (`version: 1`) behind an injected `StorageLike`. Load = migrate → sanitize per-field → flag recovery reason (`corrupt | version | invalid`). Persist failures are caught and surfaced (quota vs. unavailable) without breaking play. Tests cover roundtrip, corruption, future versions, garbage fields.

### Audio

`AudioEngine` lazily creates the `AudioContext` on first user gesture (autoplay-policy safe), synthesizes every SFX from oscillators/noise, and schedules music via a 250 ms-lookahead interval scheduler (5 tracks: title/dawn/ember/boss/result). Volumes/mute apply to gain nodes live; tab-hidden suspends the context.

### i18n

Flat key catalogs (`ko.ts` typed against `en.ts` keys). `I18n.t(key, params)` falls back to the key itself (never crashes), supports `{n}` interpolation, notifies listeners on switch; preference stored, system language detected when `auto`.

### Debug hooks vs. production

`__PD_DEBUG_HOOKS__` is a compile-time define: `true` only for `--mode e2e` builds. Hooks (warp, god, smash-boss, drag injection, stats) plus the `window.__PD_SAVE__` bridge exist solely in that mode; the deployed artifact compiles the branches out. Dev server additionally enables them via `import.meta.env.DEV`.

## Scene graph

Boot → Title → (Tutorial first-run) → ShipSelect → Briefing → Game ⇄ Pause overlay → StageClear overlay ⇄ next Briefing … → Result (win/lose/continue).

Run state (`RunState`: ship, difficulty, stageIndex, lives, bombs, power, shield, score, continues, seed) is passed by value between scenes so restarts/continues compose cleanly.

## Failure containment

- Boot texture generation errors surface a DOM retry overlay instead of a black screen.
- `localStorage` absence (private mode) falls back to a memory store with an in-game notice.
- Tab hidden → auto-pause + audio suspend; pointer cancel clears touch drag state.
- All scene-local listeners/timers/pools are released in `GameScene.shutdown`.

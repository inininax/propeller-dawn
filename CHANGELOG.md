# Changelog

All notable changes to Propeller Dawn are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/) · [SemVer](https://semver.org/).

## [1.2.0] — 2026-08-25

### Added

- **Leaderboard storage interface** (`LeaderboardStore`) with a local top-100 implementation; results are submitted automatically and the results screen shows your local rank (top 10). The interface is the plug-in point for a future online backend — no accounts, no network calls today.
- Boot now generates only title-essential textures; gameplay/boss textures are generated at the briefing screen. Lighthouse on the live URL: Performance 58 → **66**, Total Blocking Time **12.5s → 1.0s** (-92%), Accessibility 93 / Best Practices 100 / SEO 100, CLS 0.

## [1.1.1] — 2026-08-25

### Changed

- **English is now the default UI language** (Korean remains fully available via Settings → Language).

### Fixed

- Stage combat score (kills/combo/graze/medals) now carries into stage bonuses, the results screen and hi-scores — previously the displayed score silently dropped at stage clear and most points never reached the final tally.
- Ember Crown HP bar no longer refills when the core phase starts; core damage no longer double-counts the whole fight's HP pool.
- Destroyed Ember Crown thrusters no longer remain lethal or keep dashing; the boss bar/laser now hide correctly when the boss dies mid-laser.
- Pause → Settings → Replay Tutorial no longer strands a frozen pause overlay over the game.
- Held keys, focus mode and touch drag are cleared on pause and scene restart (no more stuck auto-fire or drifting ship after resume).
- Lives HUD now shows current stock including the active ship (last life no longer displays as empty).
- Gamepad players can now navigate and dismiss the pause overlay.
- Continue button renders its remaining count; the auto-end countdown is actually visible each second.
- Tab-switching away no longer resumes game music while paused; old-iOS WebKit audio unlock no longer fails permanently; noise-buffer failure no longer disables all audio.
- Enemy turrets stop firing from off-field; items are no longer magnet-collected by the player's corpse; boss-death bullet clear awards real score instead of phantom "+50" popups.
- Background ground layer no longer shows a drifting seam; boot no longer retries a failed step forever; HUD labels are localized; erase-save reverts live audio/language state.

## [1.1.0] — 2026-08-25

### Added

- **Gamepad support** — left stick/D-pad move, A/R1 fire, B/L1 bomb, X/L2 focus, Start pause (edge-triggered), hot-plug safe.
- **Offline support** — production builds register a service worker (app-shell + hashed-asset caching); the game now runs after first load without a network connection.
- **Continue score penalty** — each continue applies ×0.9 (compounding) to the final submitted score; results screen shows the multiplier and hi-scores use the adjusted value, closing the documented score-farming loophole.
- ShipSelect now shows the selected difficulty description; Settings gained a touch-accessible Back button.

### Fixed

- Settings-from-pause return path could strand a paused overlay over later screens (independent review finding).
- Continue-offer expiry state no longer persists across result-screen restarts.
- Continue countdown timer resets between offers.
- Tutorial completion now honors its original navigation target.
- Canvas `pointercancel` listener released on scene cleanup; `?seed=` URL param compiled out of production.

## [1.0.0] — 2026-08-23

### Added

- Complete 2-stage campaign (Dawn Passage, Ember Citadel) with 19 wave sections each, mid-boss encounters and multi-phase final bosses (The Solbreaker; The Ember Crown with destructible thrusters + telegraphed laser + core phase).
- Three playable fighters (DA-01 Lark, DA-07 Kite, DA-12 Rook) with distinct speed/firepower/bomb profiles and Kite/Rook stage-clear unlocks.
- Ten enemy archetypes incl. two elite squadrons, nine movement path behaviors, six bullet-pattern families (aimed, ring, fan, rotating spiral, gap-walls, splitting orbs).
- Arcade scoring: combo multiplier with decay window, graze bonus, medal chain ×1–×10, stage-clear life/bomb bonuses, per-difficulty hi-scores.
- Power-up levels 1–3, bombs that clear bullets into score sparks, one-shot shield item, continue system with per-difficulty limits.
- Difficulties 쉬움/보통/어려움 adjusting speed, fire rate, boss HP, lives, continues, score multiplier.
- Screens: boot/loading, title, paged tutorial (desktop/touch adaptive), fighter & difficulty select, briefing, gameplay HUD, pause overlay, stage-clear tally, win/lose results with continue countdown, settings, credits/license/privacy.
- Korean/English UI with instant switch, system-language detection, parameterized strings.
- Accessibility: screen-shake toggle, flashing-effects reduction, full keyboard menu navigation with visible focus, shape-coded bullets.
- Mobile support: relative drag movement with offset, auto-fire, bomb/focus buttons, pointer-cancel safety, coarse-pointer detection.
- Procedural art pipeline (all textures drawn at runtime) and Web Audio synthesis for 16 SFX plus five music tracks; autoplay-policy-safe unlock; tab-hidden suspend.
- Versioned localStorage save (schema v1) with corruption/version recovery, field sanitization, quota-failure surfacing, in-game erase with confirmation, diagnostics copy button.
- Debug/e2e tooling compiled out of production: seeded runs (`?seed=`), warp/god/smash hooks, stats bridge.
- Tooling: Vite 7 build with Phaser chunk split, TypeScript strict, ESLint 9 flat config, Prettier, Vitest unit suite (56 tests), Playwright E2E suite across desktop-chromium and mobile-safari (16 tests), GitHub Actions CI + Pages deployment.

### Known limitations (see docs/TEST_REPORT.md)

- Online leaderboard interface deferred to P1 (score submission already isolated behind `SaveService`).
- No service worker yet — manifest present but offline play is future work.
- Continue keeps accumulated score (documented deviation from strict arcade rules).

# Changelog

All notable changes to Propeller Dawn are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/) · [SemVer](https://semver.org/).

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

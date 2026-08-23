# Propeller Dawn

**Outfly the Last Dawn** · 마지막 새벽을 돌파하라

An original browser-based vertical shoot 'em up featuring piston-powered fighters, intense aerial combat, and epic boss battles. Built with TypeScript + Phaser 3, deployed as a static site.

[English](#features) · [한국어](#한국어)

---

## Features

- **Full game flow** — boot → title → tutorial → fighter select → briefing → 2-stage campaign → results, with pause/settings/credits one keypress away.
- **3 original fighters** — DA-01 Lark (balanced), DA-07 Kite (fast, piercing focus shot), DA-12 Rook (armored, wide spread, huge bomb). Ships unlock as you clear stages.
- **10 enemy types + 2 elite squadrons**, data-driven wave timelines (19 sections per stage), and **2 multi-phase bosses**: _The Solbreaker_ and _The Ember Crown_ (destructible thrusters → telegraphed laser → core).
- **Arcade scoring depth** — kill combos with decay window, graze bonuses, medal item chains (×1…×10), stage-clear life/bomb bonuses, per-difficulty hi-scores.
- **Power-ups & bombs** — 3 power levels per ship; bombs clear bullets and convert them to score.
- **3 difficulties** — Cadet / Ace / Veteran change bullet speed, fire rate, boss HP, lives and score multiplier — not just counts.
- **Readable bullet patterns** — four distinct bullet shapes (color-blind friendly), every heavy attack telegraphed by flash/siren/warning line; no unavoidable patterns.
- **Keyboard + touch** — Arrows/WASD, Space fire, X bomb, Z focus, Esc pause. On touch: relative drag movement, auto-fire, on-screen bomb & focus buttons, `pointercancel` safe.
- **KO/EN UI** switchable instantly in Settings; system language auto-detected.
- **Accessibility options** — reduce screen shake, reduce flashing, keyboard-navigable menus with visible focus.
- **Procedural everything** — all graphics are drawn at runtime to canvas; all SFX/music are synthesized live via Web Audio. Zero binary assets, zero third-party assets, no trackers, no accounts (progress stays in your browser's localStorage).

## Run it locally

```bash
npm ci
npm run dev          # dev server at http://localhost:5173
```

Quality gates (same ones CI runs):

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test         # unit tests (Vitest)
npm run build:e2e && npm run test:e2e   # Playwright suite (downloads browsers first: npx playwright install)
npm run build        # production bundle → dist/
npm audit --omit=dev
```

Requires Node ≥ 20 (see `engines` / `.node-version`).

## Controls

| Action | Desktop                          | Mobile                                       |
| ------ | -------------------------------- | -------------------------------------------- |
| Move   | Arrows / WASD (`Z` = focus slow) | Drag anywhere on the left ~60%               |
| Fire   | Hold Space                       | Automatic                                    |
| Bomb   | X or Shift                       | Round button, bottom-right                   |
| Pause  | Esc / P                          | Pause via browser tab switch auto-pauses too |

## Docs

- `docs/ARCHITECTURE.md` — structure & design decisions
- `docs/WORKLOG.md` — real, timestamped development log
- `docs/TEST_REPORT.md` — gate results, measured performance, manual matrix status
- `docs/DEPLOYMENT.md` — CI, GitHub Pages, caching, rollback
- `docs/ASSET_LICENSES.md` — licensing & originality statement
- `CHANGELOG.md`

## License

MIT — see [LICENSE](./LICENSE).

---

## 한국어

**프로펠러 던**은 브라우저에서 바로 즐기는 오리지널 세로 스크롤 슈팅 게임입니다.

### 특징

- 로딩부터 결과 화면까지 끊김 없는 전체 흐름 (부트 → 타이틀 → 튜토리얼 → 기체 선택 → 브리핑 → 2스테이지 캠페인 → 결과)
- 개성 있는 기체 3종: **DA-01 라크**(균형) / **DA-07 카이트**(고속·관통 집중사격) / **DA-12 룩**(중장갑·광역 산탄) — 스테이지 클리어로 해금
- 일반 적 8종 + 정예기 2종 이상, 스테이지별 19개 웨이브 구간, 부위 파괴형 보스 2종(**솔브레이커**, **잠불 왕관**)
- 콤보·근접 회피(그레이즈)·메달 연쇄 배율·스테이지 클리어 보너스로 구성된 아케이드 점수 시스템
- 난이도 3단계(쉬움/보통/어려움)는 탄속·발사 간격·보스 체력·점수 배율까지 조정합니다
- 색약에도 구분되는 탄환 모양 4종, 모든 강공격에는 예고 효과 — 피할 수 없는 패턴 금지 원칙
- 키보드(WASD/화살표, Space 사격, X 폭탄, Z 집중, Esc 일시정지)와 모바일 터치(상대 드래그 이동, 자동 사격, 폭탄 버튼) 지원
- 한국어/영어 즉시 전환, 화면 흔들림·섬광 저감 등 접근성 옵션
- 그래픽은 실행 중 절차 생성, 음악·효과음은 Web Audio 실시간 합성 — 외부 에셋 없음, 계정·추적 없음(진행 상황은 브라우저 localStorage에만 저장)

### 실행

```bash
npm ci
npm run dev
```

자세한 문서는 위 `docs/` 링크를 참고하세요. 라이선스는 MIT입니다.

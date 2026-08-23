export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

export const PLAY_MARGIN = 24;

export const SCENE = {
  BOOT: 'Boot',
  TITLE: 'Title',
  TUTORIAL: 'Tutorial',
  SHIP_SELECT: 'ShipSelect',
  BRIEFING: 'Briefing',
  GAME: 'Game',
  PAUSE: 'PauseOverlay',
  STAGE_CLEAR: 'StageClearOverlay',
  RESULT: 'Result',
  SETTINGS: 'Settings',
  CREDITS: 'Credits',
} as const;

export const DEPTH = {
  BACKGROUND: -100,
  ENEMY: 0,
  PLAYER: 10,
  ITEM: 20,
  PLAYER_BULLET: 30,
  ENEMY_BULLET: 40,
  BOSS: 50,
  EFFECT: 60,
  HUD: 100,
  OVERLAY: 200,
  DIALOG: 300,
} as const;

export const STORAGE_KEY = 'propeller-dawn.save.v1';

export const COMBO_WINDOW_MS = 2000;
export const ITEM_CHAIN_WINDOW_MS = 3000;
export const GRAZE_RADIUS_PX = 26;

export const PLAYER_RESPAWN_MS = 1200;
export const PLAYER_SAFETY_INVULN_MS = 2500;
export const GRADE_GRAZE_POINTS = 100;

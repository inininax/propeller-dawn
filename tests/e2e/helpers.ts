import type { Page } from '@playwright/test';

export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

interface DebugApi {
  getTouchUi(): Promise<boolean>;
  getStats(): Promise<{
    score: number;
    lives: number;
    bombs: number;
    power: number;
    stageIndex: number;
    bossActive: boolean;
    bullets: number;
    enemies: number;
    stageElapsedSec: number;
    playerX: number;
    playerY: number;
    playerAlive: boolean;
  }>;
  toggleGod(): Promise<boolean>;
  grantResources(): Promise<void>;
  warpToBoss(): Promise<void>;
  smashBoss(): Promise<boolean>;
  forceGameOver(): Promise<void>;
  setDrag(id: number, x: number, y: number): Promise<void>;
  clearDrag(): Promise<void>;
  getTouchUi(): Promise<boolean>;
}

interface SaveApi {
  markTutorialDone(): Promise<void>;
  resetAll(): Promise<void>;
  data(): Promise<{
    settings: { language: string; musicVolume: number };
    hiscores: Record<string, number>;
    stagesCleared: number;
  }>;
  startGame(patch?: { shipId?: string; difficulty?: string; stageIndex?: number }): Promise<void>;
  sceneKey(): Promise<string>;
}

type PD = { __PD_API__?: DebugApi; __PD_SAVE__?: SaveApi };

export async function gotoFresh(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem('__pd_cleared')) {
        window.localStorage.clear();
        window.sessionStorage.setItem('__pd_cleared', '1');
      }
    } catch {
      void 0;
    }
  });
  await page.goto('/');
  await page.waitForSelector('#game-root canvas', { timeout: 30_000 });
  await page.waitForFunction(() => window.__PD_GAME_READY__ === true, undefined, {
    timeout: 30_000,
  });
  await page.waitForFunction(
    () =>
      (window as unknown as PD).__PD_SAVE__ !== undefined &&
      String((window as unknown as PD).__PD_SAVE__?.sceneKey()) === 'Title',
    undefined,
    { timeout: 20_000 },
  );
}

export async function pd(page: Page): Promise<{ api: DebugApi; save: SaveApi }> {
  const save = await saveOf(page);
  const api = await apiOf(page);
  return { api, save };
}

export async function saveOf(page: Page): Promise<SaveApi> {
  await page.waitForFunction(() => (window as unknown as PD).__PD_SAVE__ !== undefined, undefined, {
    timeout: 20_000,
  });
  const save: SaveApi = {
    markTutorialDone: () =>
      page.evaluate(() => (window as unknown as PD).__PD_SAVE__?.markTutorialDone()),
    resetAll: () => page.evaluate(() => (window as unknown as PD).__PD_SAVE__?.resetAll()),
    data: async () => {
      const d = await page.evaluate(() => (window as unknown as PD).__PD_SAVE__?.data());
      if (!d) throw new Error('save unavailable');
      return d;
    },
    startGame: (patch?: { shipId?: string; difficulty?: string; stageIndex?: number }) =>
      page.evaluate((p) => (window as unknown as PD).__PD_SAVE__?.startGame(p ?? undefined), patch),
    sceneKey: async () =>
      (await page.evaluate(() => (window as unknown as PD).__PD_SAVE__?.sceneKey())) ?? 'unknown',
  };
  return save;
}

export async function apiOf(page: Page): Promise<DebugApi> {
  await page.waitForFunction(() => (window as unknown as PD).__PD_API__ !== undefined, undefined, {
    timeout: 30_000,
  });
  return {
    getTouchUi: () =>
      page.evaluate(() => (window as unknown as PD).__PD_API__?.getTouchUi() ?? false),
    setDrag: (id: number, x: number, y: number) =>
      page.evaluate(([i, vx, vy]) => (window as unknown as PD).__PD_API__?.setDrag(i!, vx!, vy!), [
        id,
        x,
        y,
      ] as const),
    clearDrag: () => page.evaluate(() => (window as unknown as PD).__PD_API__?.clearDrag()),
    getStats: () =>
      page.evaluate(
        () =>
          (window as unknown as PD).__PD_API__?.getStats() ?? {
            score: -1,
            lives: -1,
            bombs: -1,
            power: -1,
            stageIndex: -1,
            bossActive: false,
            bullets: -1,
            enemies: -1,
            stageElapsedSec: -1,
            playerX: -1,
            playerY: -1,
            playerAlive: false,
          },
      ),
    toggleGod: () =>
      page.evaluate(() => (window as unknown as PD).__PD_API__?.toggleGod() ?? false),
    grantResources: () =>
      page.evaluate(() => (window as unknown as PD).__PD_API__?.grantResources()),
    warpToBoss: () => page.evaluate(() => (window as unknown as PD).__PD_API__?.warpToBoss()),
    smashBoss: async () => {
      for (let i = 0; i < 10; i++) {
        const defeated = await page.evaluate(
          () => (window as unknown as PD).__PD_API__?.smashBoss() ?? false,
        );
        if (defeated) return true;
      }
      return false;
    },
    forceGameOver: () => page.evaluate(() => (window as unknown as PD).__PD_API__?.forceGameOver()),
  };
}

export async function sceneKey(page: Page): Promise<string> {
  return page.evaluate(() => (window as unknown as PD).__PD_SAVE__?.sceneKey() ?? 'unknown');
}

export async function expectScene(page: Page, name: string, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    (expected) => String((window as unknown as PD).__PD_SAVE__?.sceneKey()) === expected,
    name,
    { timeout },
  );
}

export function canvasPoint(
  box: { x: number; y: number; width: number; height: number },
  gameX: number,
  gameY: number,
): { x: number; y: number } {
  const scaleX = box.width / GAME_WIDTH;
  const scaleY = box.height / GAME_HEIGHT;
  return { x: box.x + gameX * scaleX, y: box.y + gameY * scaleY };
}

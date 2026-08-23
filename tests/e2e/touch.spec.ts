import { expect, test, type Page } from '@playwright/test';
import {
  apiOf,
  canvasPoint,
  gotoFresh,
  saveOf,
  sceneKey,
  GAME_HEIGHT,
  GAME_WIDTH,
} from './helpers';

test.describe('mobile touch flows', () => {
  test.skip(
    ({ browserName }) => browserName !== 'webkit',
    'touch project runs on the mobile-safari (WebKit) instance',
  );

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
  });

  test.afterAll(async () => {
    await page?.context()?.close();
  });

  async function startRun(): Promise<void> {
    const save = await saveOf(page);
    await save.markTutorialDone();
    await save.startGame({ difficulty: 'easy' });
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    expect(await sceneKey(page)).toBe('Game');
  }

  test('touch mode is detected and relative drag moves the ship', async () => {
    await gotoFresh(page);
    await startRun();
    const api = await apiOf(page);
    expect(await api.getTouchUi()).toBe(true);

    const xBefore = (await api.getStats()).playerX;
    await page.evaluate(() =>
      (
        window as unknown as {
          __PD_API__: { setDrag(id: number, x: number, y: number): void; clearDrag(): void };
        }
      ).__PD_API__.setDrag(7, 0.9, 0),
    );
    await page.waitForTimeout(450);
    await page.evaluate(() =>
      (
        window as unknown as {
          __PD_API__: { setDrag(id: number, x: number, y: number): void; clearDrag(): void };
        }
      ).__PD_API__.clearDrag(),
    );
    const xAfter = (await api.getStats()).playerX;
    expect(xAfter).toBeGreaterThan(xBefore + 60);

    const yBefore = (await api.getStats()).playerY;
    await page.evaluate(() =>
      (
        window as unknown as {
          __PD_API__: { setDrag(id: number, x: number, y: number): void; clearDrag(): void };
        }
      ).__PD_API__.setDrag(7, 0, -0.9),
    );
    await page.waitForTimeout(450);
    await page.evaluate(() =>
      (
        window as unknown as {
          __PD_API__: { setDrag(id: number, x: number, y: number): void; clearDrag(): void };
        }
      ).__PD_API__.clearDrag(),
    );
    expect((await api.getStats()).playerY).toBeLessThan(yBefore - 60);
  });

  test('real tap on bomb button consumes bomb stock', async () => {
    await gotoFresh(page);
    await startRun();
    const api = await apiOf(page);
    const bombsBefore = (await api.getStats()).bombs;
    const box = (await page.locator('#game-root canvas').boundingBox())!;
    const point = canvasPoint(box, GAME_WIDTH - 64, GAME_HEIGHT - 96);
    await page.touchscreen.tap(point.x, point.y);
    await page.waitForTimeout(400);
    expect((await api.getStats()).bombs).toBe(bombsBefore - 1);
  });
});

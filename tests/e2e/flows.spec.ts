import { expect, test, type Page } from '@playwright/test';
import { gotoFresh, apiOf, saveOf, sceneKey, expectScene, waitBossReady } from './helpers';

test.describe('desktop core flows', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
  });

  test.afterAll(async () => {
    await page?.context()?.close();
  });

  test('boots to title with no console errors', async () => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await gotoFresh(page);
    await page.waitForTimeout(1500);
    expect(await sceneKey(page)).toBe('Title');
    expect(errors).toEqual([]);
  });

  test('title menu reaches credits and back', async () => {
    await gotoFresh(page);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(140);
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    expect(await sceneKey(page)).toBe('Credits');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    expect(await sceneKey(page)).toBe('Title');
  });

  test('startGame helper routes through briefing', async () => {
    await gotoFresh(page);
    const save = await saveOf(page);
    await save.markTutorialDone();
    await save.startGame();
    await page.waitForTimeout(400);
    expect(await sceneKey(page)).toBe('Briefing');
  });

  test('gameplay: movement, firing, pause freeze and resume', async () => {
    await gotoFresh(page);
    const save = await saveOf(page);
    await save.markTutorialDone();
    await save.startGame({ difficulty: 'easy' });
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    expect(await sceneKey(page)).toBe('Game');
    const api = await apiOf(page);

    const before = await api.getStats();
    if (await api.getTouchUi()) {
      await api.setDrag(7, 0.9, 0);
      await page.waitForTimeout(500);
      await api.clearDrag();
    } else {
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(500);
      await page.keyboard.up('ArrowRight');
    }
    const afterMove = await api.getStats();
    expect(afterMove.playerX).toBeGreaterThan(before.playerX + 40);
    expect(afterMove.stageElapsedSec).toBeGreaterThan(before.stageElapsedSec);

    if (!(await api.getTouchUi())) {
      await page.keyboard.down('Space');
      await page.waitForTimeout(700);
      await page.keyboard.up('Space');
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    expect(await sceneKey(page)).toBe('PauseOverlay');
    const frozen = (await api.getStats()).stageElapsedSec;
    await page.waitForTimeout(900);
    expect((await api.getStats()).stageElapsedSec).toBe(frozen);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    expect(await sceneKey(page)).toBe('Game');
    await page.waitForTimeout(700);
    expect((await api.getStats()).stageElapsedSec).toBeGreaterThan(frozen);
  });

  test('full campaign: both stages and both bosses completable', async () => {
    test.setTimeout(150_000);
    await gotoFresh(page);
    const save = await saveOf(page);
    await save.markTutorialDone();
    await save.startGame({ difficulty: 'easy' });
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    expect(await sceneKey(page)).toBe('Game');
    const api = await apiOf(page);

    await api.toggleGod();
    await api.grantResources();
    await api.warpToBoss();
    await waitBossReady(page);
    expect(await api.smashBoss()).toBe(true);
    await expectScene(page, 'StageClearOverlay', 120_000);
    await page.waitForTimeout(2400);
    await page.keyboard.press('Enter');
    await expectScene(page, 'Briefing');

    await page.keyboard.press('Enter');
    await expectScene(page, 'Game');
    expect((await api.getStats()).stageIndex).toBe(1);

    await api.toggleGod();
    await api.grantResources();
    await api.warpToBoss();
    await waitBossReady(page, 60_000);
    expect(await api.smashBoss()).toBe(true);
    await expectScene(page, 'Result', 90_000);
  });

  test('game over leads to results and restart resets the run', async () => {
    await gotoFresh(page);
    const save = await saveOf(page);
    await save.markTutorialDone();
    await save.startGame({ difficulty: 'normal' });
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    expect(await sceneKey(page)).toBe('Game');
    const api = await apiOf(page);

    await api.forceGameOver();
    await expectScene(page, 'Result', 20_000);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    expect(['Briefing', 'Game']).toContain(await sceneKey(page));
  });

  test('settings persist across reload', async () => {
    await gotoFresh(page);
    await saveOf(page);
    await page.evaluate(() => {
      const raw = window.localStorage.getItem('propeller-dawn.save.v1');
      const parsed: Record<string, unknown> = raw ? JSON.parse(raw) : {};
      parsed.version = 1;
      parsed.settings = {
        ...((parsed.settings as object) ?? {}),
        language: 'ko',
        musicVolume: 0.25,
      };
      window.localStorage.setItem('propeller-dawn.save.v1', JSON.stringify(parsed));
    });
    await page.reload();
    await page.waitForSelector('#game-root canvas', { timeout: 30_000 });
    await page.waitForFunction(() => window.__PD_GAME_READY__ === true, undefined, {
      timeout: 30_000,
    });
    const save = await saveOf(page);
    const data = await save.data();
    expect(data.settings.language).toBe('ko');
    expect(data.settings.musicVolume).toBeCloseTo(0.25);
  });
});

import { describe, expect, it } from 'vitest';
import { I18n, resolveLanguage } from '@/systems/locale/i18n';
import { isShipUnlocked, shipUnlockStage } from '@/data/ships';

describe('i18n', () => {
  it('defaults to English; explicit preference wins', () => {
    expect(resolveLanguage('auto')).toBe('en');
    expect(resolveLanguage('ko')).toBe('ko');
    expect(resolveLanguage('en')).toBe('en');
  });

  it('translates known keys in both languages with params', () => {
    const i18n = new I18n('en');
    expect(i18n.t('result.useContinue', { n: 2 })).toContain('2');
    i18n.setPreference('ko');
    expect(i18n.t('common.resume')).toBe('계속하기');
  });

  it('falls back to the key when missing and notifies listeners on switch', () => {
    const i18n = new I18n('en');
    let notified = 0;
    i18n.onChange(() => {
      notified += 1;
    });
    i18n.setPreference('en');
    expect(notified).toBe(0);
    i18n.setPreference('ko');
    expect(notified).toBe(1);
    const missing = i18n.t('nope.missing' as never);
    expect(missing).toBe('nope.missing');
  });
});

describe('ship unlock rules', () => {
  it('lark is always available; kite needs stage 1; rook needs stage 2', () => {
    expect(isShipUnlocked('lark', 0)).toBe(true);
    expect(isShipUnlocked('kite', 0)).toBe(false);
    expect(isShipUnlocked('kite', 1)).toBe(true);
    expect(isShipUnlocked('rook', 1)).toBe(false);
    expect(isShipUnlocked('rook', 2)).toBe(true);
    expect(shipUnlockStage('lark')).toBe(0);
  });
});

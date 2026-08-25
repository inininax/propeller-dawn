import type { Language } from '../../core/types';
import { EN, type LocaleKey } from './en';
import { KO } from './ko';

export class I18n {
  private lang: Language = 'ko';

  private listeners = new Set<() => void>();

  constructor(private preference: 'auto' | Language = 'auto') {
    this.lang = resolveLanguage(this.preference);
  }

  get language(): Language {
    return this.lang;
  }

  setPreference(pref: 'auto' | Language): void {
    this.preference = pref;
    const next = resolveLanguage(pref);
    if (next !== this.lang) {
      this.lang = next;
      this.listeners.forEach((fn) => fn());
    }
  }

  t(key: LocaleKey, params?: Record<string, string | number>): string {
    let text: string;
    if (this.lang === 'ko') {
      text = KO[key] ?? key;
    } else {
      text = EN[key] ?? key;
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export function resolveLanguage(preference: 'auto' | Language): Language {
  if (preference === 'ko' || preference === 'en') return preference;
  return 'en';
}

export type { LocaleKey };

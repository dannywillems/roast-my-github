import { describe, it, expect } from 'vitest';
import { t } from '../i18n/index.ts';

describe('i18n', () => {
  it('returns English translations for en', () => {
    const i = t('en');
    expect(i.appName).toBe('Roast My GitHub');
    expect(i.analyze).toBe('Analyze');
  });

  it('returns French translations for fr', () => {
    const i = t('fr');
    expect(i.analyze).toBe('Analyser');
    expect(i.settings).toBe('Param\u00e8tres');
    expect(i.footerPrivacy).toContain('navigateur');
  });

  it('returns Spanish translations for es', () => {
    const i = t('es');
    expect(i.analyze).toBe('Analizar');
    expect(i.cancel).toBe('Cancelar');
  });

  it('returns Portuguese translations for pt', () => {
    const i = t('pt');
    expect(i.analyze).toBe('Analisar');
  });

  it('returns German translations for de', () => {
    const i = t('de');
    expect(i.analyze).toBe('Analysieren');
    expect(i.settings).toBe('Einstellungen');
  });

  it('returns Italian translations for it', () => {
    const i = t('it');
    expect(i.analyze).toBe('Analizza');
  });

  it('falls back to English for unknown language', () => {
    const i = t('xx');
    expect(i.appName).toBe('Roast My GitHub');
    expect(i.analyze).toBe('Analyze');
  });

  it('all languages have required keys', () => {
    const langs = ['en', 'fr', 'es', 'pt', 'de', 'it', 'nl'];
    for (const lang of langs) {
      const i = t(lang);
      expect(i.appName).toBeTruthy();
      expect(i.analyze).toBeTruthy();
      expect(i.cancel).toBeTruthy();
      expect(i.settings).toBeTruthy();
      expect(i.heroTitle).toBeTruthy();
      expect(i.chooseTone).toBeTruthy();
      expect(i.footerPrivacy).toBeTruthy();
      expect(i.toneRecruiterLabel).toBeTruthy();
      expect(i.toneRoastLabel).toBeTruthy();
    }
  });
});

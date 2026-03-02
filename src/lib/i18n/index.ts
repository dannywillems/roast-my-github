/**
 * i18n entry point. Re-exports types and the t() lookup function.
 *
 * See types.ts for instructions on adding keys or languages.
 */

export type { LangId, Translations } from './types';
import type { LangId, Translations } from './types';

import { en } from './en';
import { fr } from './fr';
import { es } from './es';
import { pt } from './pt';
import { de } from './de';
import { it } from './it';
import { nl } from './nl';

const allTranslations: Record<LangId, Translations> = {
  en,
  fr,
  pt,
  de,
  nl,
  es,
  it,
};

/**
 * Get translations for a given language.
 * Falls back to English for unknown language codes.
 */
export function t(langId: string): Translations {
  return allTranslations[langId as LangId] ?? en;
}

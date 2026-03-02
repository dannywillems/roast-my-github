/**
 * i18n type definitions.
 *
 * ## How to add a new translation key
 *
 * 1. Add the key to the Translations interface below.
 * 2. Add the English value in en.ts.
 * 3. Add the translated value in every other language file
 *    (fr.ts, es.ts, pt.ts, de.ts, it.ts, nl.ts).
 * 4. TypeScript will show errors for any language file missing the key.
 *
 * ## How to add a new language
 *
 * 1. Add the language code to the LangId union below.
 * 2. Create a new file src/lib/i18n/{code}.ts exporting a Translations object.
 * 3. Import and register it in src/lib/i18n/index.ts.
 * 4. Add the language entry to the languages array in src/lib/prompts.ts.
 * 5. Add a test case in src/lib/__tests__/i18n.test.ts.
 */

export type LangId = 'en' | 'fr' | 'pt' | 'de' | 'nl' | 'es' | 'it';

export interface Translations {
  // Nav
  appName: string;
  settings: string;

  // Hero
  heroTitle: string;
  heroSubtitle: string;

  // Platform selector
  selectPlatform: string;

  // Tone selector
  chooseTone: string;
  categoryProfessional: string;
  categoryProfessionalDesc: string;
  categoryFun: string;
  categoryFunDesc: string;

  // Advanced
  advancedOptions: string;
  responseLang: string;
  whatToAnalyze: string;
  customPersonality: string;
  customPersonalityPlaceholder: string;

  // Scope options
  scopeRecentActivity: string;
  scopeSourceCode: string;
  scopeCommitMessages: string;
  scopePullRequests: string;
  scopeIssues: string;
  scopeCommentsReviews: string;
  scopeCrossRepo: string;

  // Actions
  analyze: string;
  analyzing: string;
  cancel: string;
  via: string;

  // Follow-up
  goDeeper: string;
  askCustom: string;
  ask: string;
  last30Days: string;
  last90Days: string;
  codeReviewStyle: string;
  issueCommunication: string;
  comparePlatforms: string;
  collaboration: string;

  // Conversation
  conversation: string;
  export_: string;
  clear: string;
  initial: string;
  followUp: string;

  // Export
  markdownExport: string;
  plainTextExport: string;
  htmlExport: string;
  printPdf: string;

  // Results
  rendered: string;
  markdown: string;

  // Settings
  llmProvider: string;
  model: string;
  platformTokens: string;
  platformTokensOptional: string;
  whyTokens: string;
  whyTokensBody: string;
  keysLocalStorage: string;

  // Tone labels (keyed by tone id)
  toneRecruiterLabel: string;
  toneRecruiterDesc: string;
  toneInterviewerLabel: string;
  toneInterviewerDesc: string;
  toneSeniorLabel: string;
  toneSeniorDesc: string;
  toneCoworkerLabel: string;
  toneCoworkerDesc: string;
  toneMentorLabel: string;
  toneMentorDesc: string;
  toneInvestorLabel: string;
  toneInvestorDesc: string;
  toneRoastLabel: string;
  toneRoastDesc: string;
  toneDetectiveLabel: string;
  toneDetectiveDesc: string;
  toneSportscasterLabel: string;
  toneSportscasterDesc: string;
  toneTherapistLabel: string;
  toneTherapistDesc: string;
  tonePirateLabel: string;
  tonePirateDesc: string;
  toneDungeonMasterLabel: string;
  toneDungeonMasterDesc: string;
  toneFoodCriticLabel: string;
  toneFoodCriticDesc: string;

  // Footer
  footerPrivacy: string;

  // Analysis summary
  apiCalls: string;
  remaining: string;
  items: string;
  tokens: string;
  estCost: string;
  showAnalyzed: string;
  hideAnalyzed: string;
  showLogs: string;
  hideLogs: string;
}

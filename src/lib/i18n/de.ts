import type { Translations } from './types';

export const de: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Einstellungen',

  heroTitle: 'KI-gesteuerte Entwickleranalyse',
  heroSubtitle:
    'Analysieren Sie jeden Entwickler auf GitHub, GitLab, Codeberg ' +
    'und Bitbucket. Erhalten Sie strukturierte Bewertungen, ' +
    'Comedy-Roasts oder kreative Analysen mit KI.',

  selectPlatform: 'W\u00e4hlen Sie mindestens eine Plattform.',
  chooseTone: 'Ton w\u00e4hlen',
  categoryProfessional: 'Professionell',
  categoryProfessionalDesc: 'Strukturierte Bewertungen f\u00fcr Einstellung',
  categoryFun: 'Spa\u00df & Kreativ',
  categoryFunDesc: 'Unterhaltsame Analysen Ihres Codes',

  advancedOptions: 'Erweiterte Optionen',
  responseLang: 'Antwortsprache',
  whatToAnalyze: 'Was analysieren',
  customPersonality: 'Benutzerdefinierte Anweisungen',
  customPersonalityPlaceholder:
    "z.B. 'Fokus auf Sicherheit' oder " +
    "'Sei sarkastisch \u00fcber JS-Frameworks'",

  scopeRecentActivity: 'Letzte Aktivit\u00e4t (90 Tage)',
  scopeSourceCode: 'Quellcode',
  scopeCommitMessages: 'Commit-Nachrichten',
  scopePullRequests: 'Pull Requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Kommentare & Reviews',
  scopeCrossRepo: 'Cross-Repo-Beitr\u00e4ge',

  analyze: 'Analysieren',
  analyzing: 'Analyse l\u00e4uft...',
  cancel: 'Abbrechen',
  via: 'via',

  goDeeper: 'Vertiefen',
  askCustom: 'Stellen Sie eine Folgefrage...',
  ask: 'Fragen',
  last30Days: 'Letzte 30 Tage',
  last90Days: 'Letzte 90 Tage',
  codeReviewStyle: 'Code-Review-Stil',
  issueCommunication: 'Issue-Kommunikation',
  comparePlatforms: 'Plattformen vergleichen',
  collaboration: 'Zusammenarbeit',

  conversation: 'Konversation',
  export_: 'Exportieren',
  clear: 'L\u00f6schen',
  initial: 'Initial',
  followUp: 'Nachfrage',

  markdownExport: 'Markdown (.md)',
  plainTextExport: 'Klartext (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: 'Drucken / PDF',

  rendered: 'Gerendert',
  markdown: 'Markdown',

  llmProvider: 'LLM-Anbieter',
  model: 'Modell',
  platformTokens: 'Plattform-Tokens',
  platformTokensOptional: '(optional, empfohlen)',
  whyTokens: 'Warum Tokens verwenden?',
  whyTokensBody:
    'Ohne Tokens begrenzen Plattformen API-Anfragen. ' +
    'Mit Tokens erhalten Sie mehr Daten.',
  keysLocalStorage:
    'Alle Schl\u00fcssel werden im Browser gespeichert und ' +
    'nie an Server gesendet au\u00dfer an die jeweilige API.',

  toneRecruiterLabel: 'Recruiter-Bericht',
  toneRecruiterDesc: 'Strukturierte Kandidatenbewertung',
  toneInterviewerLabel: 'Tech-Lead-Interview',
  toneInterviewerDesc: 'W\u00fcrden Sie diese Person einstellen?',
  toneSeniorLabel: 'Senior-Ingenieur',
  toneSeniorDesc: 'Strenge Code-Review-Energie',
  toneCoworkerLabel: 'Direkter Kollege',
  toneCoworkerDesc: 'Ehrlich, ungefiltert, hilfreich',
  toneMentorLabel: 'Ermutigender Mentor',
  toneMentorDesc: 'Unterst\u00fctzend mit Wachstumstipps',
  toneInvestorLabel: 'VC-Investor',
  toneInvestorDesc: 'Due Diligence Ihres technischen Potenzials',
  toneRoastLabel: 'Comedy-Roast',
  toneRoastDesc: 'Brutaler Humor, kein Erbarmen',
  toneDetectiveLabel: 'Code-Detektiv',
  toneDetectiveDesc: 'Sherlock Holmes ermittelt in Ihren Commits',
  toneSportscasterLabel: 'Sportkommentator',
  toneSportscasterDesc: 'Live-Kommentar Ihrer Dev-Karriere',
  toneTherapistLabel: 'Code-Therapeut',
  toneTherapistDesc: 'Sprechen wir \u00fcber Ihre Repository-Probleme',
  tonePirateLabel: 'Piratenkapit\u00e4n',
  tonePirateDesc: 'Arr, lasst mich Euren Code inspizieren, Matrose',
  toneDungeonMasterLabel: 'Dungeon Master',
  toneDungeonMasterDesc: 'W\u00fcrfeln Sie Initiative auf Ihrem Charakterbogen',
  toneFoodCriticLabel: 'Gastronomie-Kritiker',
  toneFoodCriticDesc: 'Ihr Code steht heute Abend auf der Speisekarte',

  footerPrivacy: 'Alle Daten bleiben in Ihrem Browser',

  apiCalls: 'API-Aufrufe',
  remaining: 'verbleibend',
  items: 'Elemente',
  tokens: 'Tokens',
  estCost: 'Gesch.',
  showAnalyzed: 'Elemente anzeigen',
  hideAnalyzed: 'Elemente ausblenden',
  showLogs: 'Logs anzeigen',
  hideLogs: 'Logs ausblenden',
};

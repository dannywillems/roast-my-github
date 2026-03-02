import type { Translations } from './types';

export const nl: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Instellingen',

  heroTitle: 'AI-aangedreven ontwikkelaarsprofiel',
  heroSubtitle:
    'Analyseer elke ontwikkelaar op GitHub, GitLab, Codeberg en ' +
    'Bitbucket. Krijg gestructureerde beoordelingen, comedy-roasts ' +
    'of creatieve analyses met AI.',

  selectPlatform: 'Selecteer minstens een platform.',
  chooseTone: 'Kies een toon',
  categoryProfessional: 'Professioneel',
  categoryProfessionalDesc:
    'Gestructureerde beoordelingen voor werving en groei',
  categoryFun: 'Leuk & Creatief',
  categoryFunDesc: 'Vermakelijke analyses van je code',

  advancedOptions: 'Geavanceerde opties',
  responseLang: 'Antwoordtaal',
  whatToAnalyze: 'Wat analyseren',
  customPersonality: 'Aangepaste persoonlijkheidsinstructies',
  customPersonalityPlaceholder:
    "bijv. 'Focus op beveiligingspraktijken' of " +
    "'Wees extra sarcastisch over JS-frameworks'",

  scopeRecentActivity: 'Recente activiteit (90 dagen)',
  scopeSourceCode: 'Broncode',
  scopeCommitMessages: 'Commit-berichten',
  scopePullRequests: 'Pull requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Commentaren & reviews',
  scopeCrossRepo: 'Cross-repo-bijdragen',

  analyze: 'Analyseren',
  analyzing: 'Bezig met analyseren...',
  cancel: 'Annuleren',
  via: 'via',

  goDeeper: 'Verdiepen',
  askCustom: 'Stel een vervolgvraag...',
  ask: 'Vraag',
  last30Days: 'Laatste 30 dagen',
  last90Days: 'Laatste 90 dagen',
  codeReviewStyle: 'Code-review-stijl',
  issueCommunication: 'Issue-communicatie',
  comparePlatforms: 'Platforms vergelijken',
  collaboration: 'Samenwerking',

  conversation: 'Gesprek',
  export_: 'Exporteren',
  clear: 'Wissen',
  initial: 'Initieel',
  followUp: 'Vervolg',

  markdownExport: 'Markdown (.md)',
  plainTextExport: 'Platte tekst (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: 'Afdrukken / PDF',

  rendered: 'Weergave',
  markdown: 'Markdown',

  llmProvider: 'LLM-aanbieder',
  model: 'Model',
  platformTokens: 'Platformtokens',
  platformTokensOptional: '(optioneel, aanbevolen)',
  whyTokens: 'Waarom tokens gebruiken?',
  whyTokensBody:
    'Zonder tokens beperken platforms API-verzoeken. ' +
    'Met tokens krijgt u meer gegevens.',
  keysLocalStorage:
    'Alle sleutels worden in uw browser opgeslagen en ' +
    'nooit naar een server verzonden behalve de betreffende API.',

  toneRecruiterLabel: 'Recruiter-rapport',
  toneRecruiterDesc: 'Gestructureerde kandidaatbeoordeling',
  toneInterviewerLabel: 'Tech-lead-interview',
  toneInterviewerDesc: 'Zou u deze persoon aannemen?',
  toneSeniorLabel: 'Senior engineer',
  toneSeniorDesc: 'Strenge code-review-energie',
  toneCoworkerLabel: 'Directe collega',
  toneCoworkerDesc: 'Eerlijk, ongefilterd, behulpzaam',
  toneMentorLabel: 'Aanmoedigende mentor',
  toneMentorDesc: 'Ondersteunend met groeiadviezen',
  toneInvestorLabel: 'VC-investeerder',
  toneInvestorDesc: 'Due diligence van uw technisch potentieel',
  toneRoastLabel: 'Comedy-roast',
  toneRoastDesc: 'Brutale humor, geen genade',
  toneDetectiveLabel: 'Code-detective',
  toneDetectiveDesc: 'Sherlock Holmes onderzoekt uw commits',
  toneSportscasterLabel: 'Sportcommentator',
  toneSportscasterDesc: 'Live-commentaar op uw dev-loopbaan',
  toneTherapistLabel: 'Code-therapeut',
  toneTherapistDesc: 'Laten we praten over uw repository-problemen',
  tonePirateLabel: 'Piratenkapitein',
  tonePirateDesc: 'Arr, laat me uw code inspecteren, matroos',
  toneDungeonMasterLabel: 'Dungeon Master',
  toneDungeonMasterDesc: 'Gooi initiatief op uw personageblad',
  toneFoodCriticLabel: 'Gastronomisch criticus',
  toneFoodCriticDesc: 'Uw code staat vanavond op het menu',

  footerPrivacy: 'Alle gegevens blijven in uw browser',

  apiCalls: 'API-aanroepen',
  remaining: 'resterend',
  items: 'items',
  tokens: 'tokens',
  estCost: 'Gesch.',
  showAnalyzed: 'Geanalyseerde items tonen',
  hideAnalyzed: 'Geanalyseerde items verbergen',
  showLogs: 'Logs tonen',
  hideLogs: 'Logs verbergen',
};

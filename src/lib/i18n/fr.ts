import type { Translations } from './types';

export const fr: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Param\u00e8tres',

  heroTitle: 'Profilage de d\u00e9veloppeurs par IA',
  heroSubtitle:
    'Analysez tout d\u00e9veloppeur sur GitHub, GitLab, Codeberg et ' +
    'Bitbucket. Obtenez des \u00e9valuations structur\u00e9es, des roasts ' +
    'comiques ou des analyses cr\u00e9atives par IA.',

  selectPlatform: 'S\u00e9lectionnez au moins une plateforme.',
  chooseTone: 'Choisissez un ton',
  categoryProfessional: 'Professionnel',
  categoryProfessionalDesc:
    '\u00c9valuations structur\u00e9es pour le recrutement',
  categoryFun: 'Fun & Cr\u00e9atif',
  categoryFunDesc: 'Analyses amusantes de votre code',

  advancedOptions: 'Options avanc\u00e9es',
  responseLang: 'Langue de r\u00e9ponse',
  whatToAnalyze: 'Quoi analyser',
  customPersonality: 'Instructions de personnalit\u00e9',
  customPersonalityPlaceholder:
    "ex. 'Concentrez-vous sur la s\u00e9curit\u00e9' ou " +
    "'Soyez sarcastique sur les frameworks JS'",

  scopeRecentActivity: 'Activit\u00e9 r\u00e9cente (90 jours)',
  scopeSourceCode: 'Code source',
  scopeCommitMessages: 'Messages de commit',
  scopePullRequests: 'Pull requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Commentaires & revues',
  scopeCrossRepo: 'Contributions cross-repo',

  analyze: 'Analyser',
  analyzing: 'Analyse en cours...',
  cancel: 'Annuler',
  via: 'via',

  goDeeper: 'Approfondir',
  askCustom: 'Posez une question de suivi...',
  ask: 'Demander',
  last30Days: '30 derniers jours',
  last90Days: '90 derniers jours',
  codeReviewStyle: 'Style de code review',
  issueCommunication: 'Communication issues',
  comparePlatforms: 'Comparer les plateformes',
  collaboration: 'Collaboration',

  conversation: 'Conversation',
  export_: 'Exporter',
  clear: 'Effacer',
  initial: 'Initial',
  followUp: 'Suivi',

  markdownExport: 'Markdown (.md)',
  plainTextExport: 'Texte brut (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: 'Imprimer / PDF',

  rendered: 'Rendu',
  markdown: 'Markdown',

  llmProvider: 'Fournisseur LLM',
  model: 'Mod\u00e8le',
  platformTokens: 'Jetons de plateforme',
  platformTokensOptional: '(optionnel, recommand\u00e9)',
  whyTokens: 'Pourquoi des jetons ?',
  whyTokensBody:
    'Sans jetons, les plateformes limitent les requ\u00eates API. ' +
    'Avec des jetons, vous obtenez plus de donn\u00e9es.',
  keysLocalStorage:
    'Toutes les cl\u00e9s sont stock\u00e9es dans votre navigateur et ' +
    'jamais envoy\u00e9es sauf aux API respectives.',

  toneRecruiterLabel: 'Rapport recruteur',
  toneRecruiterDesc: '\u00c9valuation structur\u00e9e de candidat',
  toneInterviewerLabel: 'Entretien tech lead',
  toneInterviewerDesc: 'Embaucheriez-vous cette personne ?',
  toneSeniorLabel: 'Ing\u00e9nieur senior',
  toneSeniorDesc: '\u00c9nergie de code review stricte',
  toneCoworkerLabel: 'Coll\u00e8gue franc',
  toneCoworkerDesc: 'Honn\u00eate, sans filtre, utile',
  toneMentorLabel: 'Mentor encourageant',
  toneMentorDesc: 'Bienveillant avec des conseils de progression',
  toneInvestorLabel: 'Investisseur VC',
  toneInvestorDesc: 'Due diligence sur votre potentiel technique',
  toneRoastLabel: 'Roast com\u00e9die',
  toneRoastDesc: 'Humour brutal, sans piti\u00e9',
  toneDetectiveLabel: 'D\u00e9tective du code',
  toneDetectiveDesc: 'Sherlock Holmes enqu\u00eate sur vos commits',
  toneSportscasterLabel: 'Commentateur sportif',
  toneSportscasterDesc: 'Commentaire en direct de votre carri\u00e8re dev',
  toneTherapistLabel: 'Th\u00e9rapeute du code',
  toneTherapistDesc: 'Parlons de vos probl\u00e8mes de repository',
  tonePirateLabel: 'Capitaine pirate',
  tonePirateDesc: 'Arr, laissez-moi inspecter votre code, matelot',
  toneDungeonMasterLabel: 'Ma\u00eetre du donjon',
  toneDungeonMasterDesc: "Lancez l'initiative sur votre fiche de personnage",
  toneFoodCriticLabel: 'Critique gastronomique',
  toneFoodCriticDesc: 'Votre code est au menu ce soir',

  footerPrivacy: 'Toutes les donn\u00e9es restent dans votre navigateur',

  apiCalls: 'appels API',
  remaining: 'restants',
  items: '\u00e9l\u00e9ments',
  tokens: 'tokens',
  estCost: 'Est',
  showAnalyzed: 'Afficher les \u00e9l\u00e9ments',
  hideAnalyzed: 'Masquer les \u00e9l\u00e9ments',
  showLogs: 'Afficher les logs',
  hideLogs: 'Masquer les logs',
};

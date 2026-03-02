import type { Translations } from './types';

export const it: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Impostazioni',

  heroTitle: 'Profilazione sviluppatori con IA',
  heroSubtitle:
    'Analizza qualsiasi sviluppatore su GitHub, GitLab, Codeberg e ' +
    'Bitbucket. Ottieni valutazioni strutturate, roast comici ' +
    'o analisi creative con IA.',

  selectPlatform: 'Seleziona almeno una piattaforma.',
  chooseTone: 'Scegli un tono',
  categoryProfessional: 'Professionale',
  categoryProfessionalDesc: 'Valutazioni strutturate per assunzioni',
  categoryFun: 'Divertente & Creativo',
  categoryFunDesc: 'Analisi divertenti del tuo codice',

  advancedOptions: 'Opzioni avanzate',
  responseLang: 'Lingua della risposta',
  whatToAnalyze: 'Cosa analizzare',
  customPersonality: 'Istruzioni di personalit\u00e0',
  customPersonalityPlaceholder:
    "es. 'Concentrati sulla sicurezza' o " +
    "'Sii sarcastico sui framework JS'",

  scopeRecentActivity: 'Attivit\u00e0 recente (90 giorni)',
  scopeSourceCode: 'Codice sorgente',
  scopeCommitMessages: 'Messaggi di commit',
  scopePullRequests: 'Pull requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Commenti & recensioni',
  scopeCrossRepo: 'Contributi cross-repo',

  analyze: 'Analizza',
  analyzing: 'Analisi in corso...',
  cancel: 'Annulla',
  via: 'via',

  goDeeper: 'Approfondire',
  askCustom: 'Fai una domanda di follow-up...',
  ask: 'Chiedi',
  last30Days: 'Ultimi 30 giorni',
  last90Days: 'Ultimi 90 giorni',
  codeReviewStyle: 'Stile di code review',
  issueCommunication: 'Comunicazione issue',
  comparePlatforms: 'Confronta piattaforme',
  collaboration: 'Collaborazione',

  conversation: 'Conversazione',
  export_: 'Esporta',
  clear: 'Cancella',
  initial: 'Iniziale',
  followUp: 'Follow-up',

  markdownExport: 'Markdown (.md)',
  plainTextExport: 'Testo semplice (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: 'Stampa / PDF',

  rendered: 'Renderizzato',
  markdown: 'Markdown',

  llmProvider: 'Provider LLM',
  model: 'Modello',
  platformTokens: 'Token piattaforma',
  platformTokensOptional: '(opzionale, consigliato)',
  whyTokens: 'Perch\u00e9 usare token?',
  whyTokensBody:
    'Senza token le piattaforme limitano le richieste API. ' +
    'Con i token ottieni pi\u00f9 dati.',
  keysLocalStorage:
    'Tutte le chiavi sono salvate nel browser e ' +
    'mai inviate tranne alle rispettive API.',

  toneRecruiterLabel: 'Rapporto recruiter',
  toneRecruiterDesc: 'Valutazione strutturata del candidato',
  toneInterviewerLabel: 'Colloquio tech lead',
  toneInterviewerDesc: 'Assumeresti questa persona?',
  toneSeniorLabel: 'Ingegnere senior',
  toneSeniorDesc: 'Energia da code review rigorosa',
  toneCoworkerLabel: 'Collega diretto',
  toneCoworkerDesc: 'Onesto, senza filtri, utile',
  toneMentorLabel: 'Mentore incoraggiante',
  toneMentorDesc: 'Supporto con consigli di crescita',
  toneInvestorLabel: 'Investitore VC',
  toneInvestorDesc: 'Due diligence sul tuo potenziale tecnico',
  toneRoastLabel: 'Roast comico',
  toneRoastDesc: 'Umorismo brutale, senza piet\u00e0',
  toneDetectiveLabel: 'Detective del codice',
  toneDetectiveDesc: 'Sherlock Holmes indaga sui tuoi commit',
  toneSportscasterLabel: 'Commentatore sportivo',
  toneSportscasterDesc: 'Telecronaca dal vivo della tua carriera dev',
  toneTherapistLabel: 'Terapeuta del codice',
  toneTherapistDesc: 'Parliamo dei tuoi problemi di repository',
  tonePirateLabel: 'Capitano pirata',
  tonePirateDesc: 'Arr, fammi ispezionare il tuo codice, mozzo',
  toneDungeonMasterLabel: 'Dungeon Master',
  toneDungeonMasterDesc: 'Tira iniziativa sulla tua scheda personaggio',
  toneFoodCriticLabel: 'Critico gastronomico',
  toneFoodCriticDesc: 'Il tuo codice \u00e8 nel menu stasera',

  footerPrivacy: 'Tutti i dati restano nel tuo browser',

  apiCalls: 'chiamate API',
  remaining: 'rimanenti',
  items: 'elementi',
  tokens: 'token',
  estCost: 'Stima',
  showAnalyzed: 'Mostra elementi',
  hideAnalyzed: 'Nascondi elementi',
  showLogs: 'Mostra log',
  hideLogs: 'Nascondi log',
};

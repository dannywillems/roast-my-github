/**
 * Simple i18n system for UI labels.
 * Each language maps string keys to translated values.
 */

export type LangId =
  | 'en'
  | 'fr'
  | 'pt'
  | 'de'
  | 'nl'
  | 'es'
  | 'it'
  | 'ja'
  | 'ko'
  | 'zh';

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

const en: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Settings',

  heroTitle: 'AI-powered developer profiling',
  heroSubtitle:
    'Analyze any developer across GitHub, GitLab, Codeberg, ' +
    'and Bitbucket. Get structured assessments, comedy roasts, ' +
    'or creative takes powered by AI.',

  selectPlatform: 'Select at least one platform.',
  chooseTone: 'Choose a tone',
  categoryProfessional: 'Professional',
  categoryProfessionalDesc: 'Structured assessments for hiring and growth',
  categoryFun: 'Fun & Creative',
  categoryFunDesc: 'Entertaining takes on your code',

  advancedOptions: 'Advanced options',
  responseLang: 'Response language',
  whatToAnalyze: 'What to analyze',
  customPersonality: 'Custom personality instructions',
  customPersonalityPlaceholder:
    "e.g. 'Focus on security practices' or " +
    "'Be extra sarcastic about JS frameworks'",

  scopeRecentActivity: 'Recent activity (90 days)',
  scopeSourceCode: 'Source code',
  scopeCommitMessages: 'Commit messages',
  scopePullRequests: 'Pull requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Comments & reviews',
  scopeCrossRepo: 'Cross-repo contributions',

  analyze: 'Analyze',
  analyzing: 'Analyzing...',
  cancel: 'Cancel',
  via: 'via',

  goDeeper: 'Go deeper',
  askCustom: 'Ask a custom follow-up question...',
  ask: 'Ask',
  last30Days: 'Last 30 days',
  last90Days: 'Last 90 days',
  codeReviewStyle: 'Code review style',
  issueCommunication: 'Issue communication',
  comparePlatforms: 'Compare platforms',
  collaboration: 'Collaboration',

  conversation: 'Conversation',
  export_: 'Export',
  clear: 'Clear',
  initial: 'Initial',
  followUp: 'Follow-up',

  markdownExport: 'Markdown (.md)',
  plainTextExport: 'Plain text (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: 'Print / PDF',

  rendered: 'Rendered',
  markdown: 'Markdown',

  llmProvider: 'LLM Provider',
  model: 'Model',
  platformTokens: 'Platform Tokens',
  platformTokensOptional: '(optional, recommended)',
  whyTokens: 'Why use tokens?',
  whyTokensBody:
    'Without tokens, platforms limit API requests. ' +
    'With tokens you get higher rate limits and more data.',
  keysLocalStorage:
    'All keys and tokens are stored in your browser and ' +
    'never sent to any server except the respective API.',

  footerPrivacy: 'All data stays in your browser',

  apiCalls: 'API calls',
  remaining: 'remaining',
  items: 'items',
  tokens: 'tokens',
  estCost: 'Est',
  showAnalyzed: 'Show analyzed items',
  hideAnalyzed: 'Hide analyzed items',
  showLogs: 'Show logs',
  hideLogs: 'Hide logs',
};

const fr: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Parametres',

  heroTitle: 'Profilage de developpeurs par IA',
  heroSubtitle:
    'Analysez tout developpeur sur GitHub, GitLab, Codeberg et ' +
    'Bitbucket. Obtenez des evaluations structurees, des roasts ' +
    'comiques ou des analyses creatives par IA.',

  selectPlatform: 'Selectionnez au moins une plateforme.',
  chooseTone: 'Choisissez un ton',
  categoryProfessional: 'Professionnel',
  categoryProfessionalDesc: 'Evaluations structurees pour le recrutement',
  categoryFun: 'Fun & Creatif',
  categoryFunDesc: 'Analyses amusantes de votre code',

  advancedOptions: 'Options avancees',
  responseLang: 'Langue de reponse',
  whatToAnalyze: 'Quoi analyser',
  customPersonality: 'Instructions de personnalite',
  customPersonalityPlaceholder:
    "ex. 'Concentrez-vous sur la securite' ou " +
    "'Soyez sarcastique sur les frameworks JS'",

  scopeRecentActivity: 'Activite recente (90 jours)',
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
  model: 'Modele',
  platformTokens: 'Jetons de plateforme',
  platformTokensOptional: '(optionnel, recommande)',
  whyTokens: 'Pourquoi des jetons ?',
  whyTokensBody:
    'Sans jetons, les plateformes limitent les requetes API. ' +
    'Avec des jetons, vous obtenez plus de donnees.',
  keysLocalStorage:
    'Toutes les cles sont stockees dans votre navigateur et ' +
    'jamais envoyees sauf aux API respectives.',

  footerPrivacy: 'Toutes les donnees restent dans votre navigateur',

  apiCalls: 'appels API',
  remaining: 'restants',
  items: 'elements',
  tokens: 'tokens',
  estCost: 'Est',
  showAnalyzed: 'Afficher les elements',
  hideAnalyzed: 'Masquer les elements',
  showLogs: 'Afficher les logs',
  hideLogs: 'Masquer les logs',
};

const es: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Ajustes',

  heroTitle: 'Perfilado de desarrolladores con IA',
  heroSubtitle:
    'Analiza cualquier desarrollador en GitHub, GitLab, Codeberg y ' +
    'Bitbucket. Obtiene evaluaciones estructuradas, roasts comicos ' +
    'o analisis creativos con IA.',

  selectPlatform: 'Selecciona al menos una plataforma.',
  chooseTone: 'Elige un tono',
  categoryProfessional: 'Profesional',
  categoryProfessionalDesc: 'Evaluaciones estructuradas para contratacion',
  categoryFun: 'Divertido & Creativo',
  categoryFunDesc: 'Analisis divertidos de tu codigo',

  advancedOptions: 'Opciones avanzadas',
  responseLang: 'Idioma de respuesta',
  whatToAnalyze: 'Que analizar',
  customPersonality: 'Instrucciones de personalidad',
  customPersonalityPlaceholder:
    "ej. 'Enfocate en seguridad' o " + "'Se sarcastico sobre frameworks JS'",

  scopeRecentActivity: 'Actividad reciente (90 dias)',
  scopeSourceCode: 'Codigo fuente',
  scopeCommitMessages: 'Mensajes de commit',
  scopePullRequests: 'Pull requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Comentarios & reviews',
  scopeCrossRepo: 'Contribuciones cross-repo',

  analyze: 'Analizar',
  analyzing: 'Analizando...',
  cancel: 'Cancelar',
  via: 'via',

  goDeeper: 'Profundizar',
  askCustom: 'Haz una pregunta de seguimiento...',
  ask: 'Preguntar',
  last30Days: 'Ultimos 30 dias',
  last90Days: 'Ultimos 90 dias',
  codeReviewStyle: 'Estilo de code review',
  issueCommunication: 'Comunicacion en issues',
  comparePlatforms: 'Comparar plataformas',
  collaboration: 'Colaboracion',

  conversation: 'Conversacion',
  export_: 'Exportar',
  clear: 'Limpiar',
  initial: 'Inicial',
  followUp: 'Seguimiento',

  markdownExport: 'Markdown (.md)',
  plainTextExport: 'Texto plano (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: 'Imprimir / PDF',

  rendered: 'Renderizado',
  markdown: 'Markdown',

  llmProvider: 'Proveedor LLM',
  model: 'Modelo',
  platformTokens: 'Tokens de plataforma',
  platformTokensOptional: '(opcional, recomendado)',
  whyTokens: 'Por que usar tokens?',
  whyTokensBody:
    'Sin tokens, las plataformas limitan las peticiones API. ' +
    'Con tokens obtienes mas datos.',
  keysLocalStorage:
    'Todas las claves se almacenan en tu navegador y ' +
    'nunca se envian excepto a las API respectivas.',

  footerPrivacy: 'Todos los datos se quedan en tu navegador',

  apiCalls: 'llamadas API',
  remaining: 'restantes',
  items: 'elementos',
  tokens: 'tokens',
  estCost: 'Est',
  showAnalyzed: 'Mostrar elementos',
  hideAnalyzed: 'Ocultar elementos',
  showLogs: 'Mostrar logs',
  hideLogs: 'Ocultar logs',
};

const pt: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Configuracoes',

  heroTitle: 'Perfilamento de desenvolvedores com IA',
  heroSubtitle:
    'Analise qualquer desenvolvedor no GitHub, GitLab, Codeberg e ' +
    'Bitbucket. Obtenha avaliacoes estruturadas, roasts comicos ' +
    'ou analises criativas com IA.',

  selectPlatform: 'Selecione pelo menos uma plataforma.',
  chooseTone: 'Escolha um tom',
  categoryProfessional: 'Profissional',
  categoryProfessionalDesc: 'Avaliacoes estruturadas para contratacao',
  categoryFun: 'Divertido & Criativo',
  categoryFunDesc: 'Analises divertidas do seu codigo',

  advancedOptions: 'Opcoes avancadas',
  responseLang: 'Idioma da resposta',
  whatToAnalyze: 'O que analisar',
  customPersonality: 'Instrucoes de personalidade',
  customPersonalityPlaceholder:
    "ex. 'Foque em seguranca' ou " + "'Seja sarcastico sobre frameworks JS'",

  scopeRecentActivity: 'Atividade recente (90 dias)',
  scopeSourceCode: 'Codigo fonte',
  scopeCommitMessages: 'Mensagens de commit',
  scopePullRequests: 'Pull requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Comentarios & reviews',
  scopeCrossRepo: 'Contribuicoes cross-repo',

  analyze: 'Analisar',
  analyzing: 'Analisando...',
  cancel: 'Cancelar',
  via: 'via',

  goDeeper: 'Aprofundar',
  askCustom: 'Faca uma pergunta de acompanhamento...',
  ask: 'Perguntar',
  last30Days: 'Ultimos 30 dias',
  last90Days: 'Ultimos 90 dias',
  codeReviewStyle: 'Estilo de code review',
  issueCommunication: 'Comunicacao em issues',
  comparePlatforms: 'Comparar plataformas',
  collaboration: 'Colaboracao',

  conversation: 'Conversa',
  export_: 'Exportar',
  clear: 'Limpar',
  initial: 'Inicial',
  followUp: 'Acompanhamento',

  markdownExport: 'Markdown (.md)',
  plainTextExport: 'Texto simples (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: 'Imprimir / PDF',

  rendered: 'Renderizado',
  markdown: 'Markdown',

  llmProvider: 'Provedor LLM',
  model: 'Modelo',
  platformTokens: 'Tokens da plataforma',
  platformTokensOptional: '(opcional, recomendado)',
  whyTokens: 'Por que usar tokens?',
  whyTokensBody:
    'Sem tokens, as plataformas limitam requisicoes API. ' +
    'Com tokens voce obtem mais dados.',
  keysLocalStorage:
    'Todas as chaves sao armazenadas no seu navegador e ' +
    'nunca enviadas exceto para as APIs respectivas.',

  footerPrivacy: 'Todos os dados ficam no seu navegador',

  apiCalls: 'chamadas API',
  remaining: 'restantes',
  items: 'itens',
  tokens: 'tokens',
  estCost: 'Est',
  showAnalyzed: 'Mostrar itens',
  hideAnalyzed: 'Ocultar itens',
  showLogs: 'Mostrar logs',
  hideLogs: 'Ocultar logs',
};

const de: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Einstellungen',

  heroTitle: 'KI-gesteuerte Entwickleranalyse',
  heroSubtitle:
    'Analysieren Sie jeden Entwickler auf GitHub, GitLab, Codeberg ' +
    'und Bitbucket. Erhalten Sie strukturierte Bewertungen, ' +
    'Comedy-Roasts oder kreative Analysen mit KI.',

  selectPlatform: 'Wahlen Sie mindestens eine Plattform.',
  chooseTone: 'Ton wahlen',
  categoryProfessional: 'Professionell',
  categoryProfessionalDesc: 'Strukturierte Bewertungen fur Einstellung',
  categoryFun: 'Spass & Kreativ',
  categoryFunDesc: 'Unterhaltsame Analysen Ihres Codes',

  advancedOptions: 'Erweiterte Optionen',
  responseLang: 'Antwortsprache',
  whatToAnalyze: 'Was analysieren',
  customPersonality: 'Benutzerdefinierte Anweisungen',
  customPersonalityPlaceholder:
    "z.B. 'Fokus auf Sicherheit' oder " +
    "'Sei sarkastisch uber JS-Frameworks'",

  scopeRecentActivity: 'Letzte Aktivitat (90 Tage)',
  scopeSourceCode: 'Quellcode',
  scopeCommitMessages: 'Commit-Nachrichten',
  scopePullRequests: 'Pull Requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Kommentare & Reviews',
  scopeCrossRepo: 'Cross-Repo-Beitrage',

  analyze: 'Analysieren',
  analyzing: 'Analyse lauft...',
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
  clear: 'Loschen',
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
    'Alle Schlussel werden im Browser gespeichert und ' +
    'nie an Server gesendet ausser an die jeweilige API.',

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

const it: Translations = {
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
  customPersonality: 'Istruzioni di personalita',
  customPersonalityPlaceholder:
    "es. 'Concentrati sulla sicurezza' o " +
    "'Sii sarcastico sui framework JS'",

  scopeRecentActivity: 'Attivita recente (90 giorni)',
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
  whyTokens: 'Perche usare token?',
  whyTokensBody:
    'Senza token le piattaforme limitano le richieste API. ' +
    'Con i token ottieni piu dati.',
  keysLocalStorage:
    'Tutte le chiavi sono salvate nel browser e ' +
    'mai inviate tranne alle rispettive API.',

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

const nl: Translations = {
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

const ja: Translations = {
  appName: 'Roast My GitHub',
  settings: '設定',

  heroTitle: 'AI開発者プロファイリング',
  heroSubtitle:
    'GitHub、GitLab、Codeberg、Bitbucketの開発者を分析。' +
    'AIによる構造化評価やクリエイティブな分析を取得。',

  selectPlatform: 'プラットフォームを1つ以上選択してください。',
  chooseTone: 'トーンを選択',
  categoryProfessional: 'プロフェッショナル',
  categoryProfessionalDesc: '採用と成長のための構造化評価',
  categoryFun: '楽しい＆クリエイティブ',
  categoryFunDesc: 'コードの面白い分析',

  advancedOptions: '詳細オプション',
  responseLang: '回答言語',
  whatToAnalyze: '分析対象',
  customPersonality: 'カスタム指示',
  customPersonalityPlaceholder:
    "例: 'セキュリティに注目' や " + "'JSフレームワークについて皮肉を込めて'",

  scopeRecentActivity: '最近のアクティビティ (90日間)',
  scopeSourceCode: 'ソースコード',
  scopeCommitMessages: 'コミットメッセージ',
  scopePullRequests: 'プルリクエスト',
  scopeIssues: 'イシュー',
  scopeCommentsReviews: 'コメント＆レビュー',
  scopeCrossRepo: 'クロスリポジトリ貢献',

  analyze: '分析',
  analyzing: '分析中...',
  cancel: 'キャンセル',
  via: 'via',

  goDeeper: '深掘り',
  askCustom: 'フォローアップ質問を入力...',
  ask: '質問',
  last30Days: '過去30日間',
  last90Days: '過去90日間',
  codeReviewStyle: 'コードレビュースタイル',
  issueCommunication: 'イシューコミュニケーション',
  comparePlatforms: 'プラットフォーム比較',
  collaboration: 'コラボレーション',

  conversation: '会話',
  export_: 'エクスポート',
  clear: 'クリア',
  initial: '初回',
  followUp: 'フォローアップ',

  markdownExport: 'Markdown (.md)',
  plainTextExport: 'テキスト (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: '印刷 / PDF',

  rendered: 'レンダリング',
  markdown: 'Markdown',

  llmProvider: 'LLMプロバイダー',
  model: 'モデル',
  platformTokens: 'プラットフォームトークン',
  platformTokensOptional: '(任意、推奨)',
  whyTokens: 'トークンを使う理由',
  whyTokensBody:
    'トークンなしではプラットフォームがAPIリクエストを制限します。' +
    'トークンを使うとより多くのデータを取得できます。',
  keysLocalStorage:
    '全てのキーはブラウザに保存され、' +
    '各APIを除きサーバーに送信されることはありません。',

  footerPrivacy: '全てのデータはブラウザ内に保存されます',

  apiCalls: 'API呼び出し',
  remaining: '残り',
  items: '項目',
  tokens: 'トークン',
  estCost: '推定',
  showAnalyzed: '分析項目を表示',
  hideAnalyzed: '分析項目を非表示',
  showLogs: 'ログを表示',
  hideLogs: 'ログを非表示',
};

const ko: Translations = {
  appName: 'Roast My GitHub',
  settings: '설정',

  heroTitle: 'AI 개발자 프로파일링',
  heroSubtitle:
    'GitHub, GitLab, Codeberg, Bitbucket의 개발자를 분석하세요. ' +
    'AI 기반 구조화된 평가와 창의적 분석을 받으세요.',

  selectPlatform: '플랫폼을 하나 이상 선택하세요.',
  chooseTone: '톤 선택',
  categoryProfessional: '전문적',
  categoryProfessionalDesc: '채용과 성장을 위한 구조화된 평가',
  categoryFun: '재미 & 창의적',
  categoryFunDesc: '코드에 대한 재미있는 분석',

  advancedOptions: '고급 옵션',
  responseLang: '응답 언어',
  whatToAnalyze: '분석 대상',
  customPersonality: '사용자 지정 지시',
  customPersonalityPlaceholder:
    "예: '보안 관행에 집중' 또는 " + "'JS 프레임워크에 대해 비꼬아주세요'",

  scopeRecentActivity: '최근 활동 (90일)',
  scopeSourceCode: '소스 코드',
  scopeCommitMessages: '커밋 메시지',
  scopePullRequests: '풀 리퀘스트',
  scopeIssues: '이슈',
  scopeCommentsReviews: '댓글 & 리뷰',
  scopeCrossRepo: '크로스 레포 기여',

  analyze: '분석',
  analyzing: '분석 중...',
  cancel: '취소',
  via: 'via',

  goDeeper: '심층 분석',
  askCustom: '후속 질문을 입력하세요...',
  ask: '질문',
  last30Days: '최근 30일',
  last90Days: '최근 90일',
  codeReviewStyle: '코드 리뷰 스타일',
  issueCommunication: '이슈 커뮤니케이션',
  comparePlatforms: '플랫폼 비교',
  collaboration: '협업',

  conversation: '대화',
  export_: '내보내기',
  clear: '지우기',
  initial: '초기',
  followUp: '후속',

  markdownExport: 'Markdown (.md)',
  plainTextExport: '텍스트 (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: '인쇄 / PDF',

  rendered: '렌더링',
  markdown: 'Markdown',

  llmProvider: 'LLM 제공자',
  model: '모델',
  platformTokens: '플랫폼 토큰',
  platformTokensOptional: '(선택 사항, 권장)',
  whyTokens: '토큰을 사용하는 이유',
  whyTokensBody:
    '토큰 없이는 플랫폼이 API 요청을 제한합니다. ' +
    '토큰을 사용하면 더 많은 데이터를 가져올 수 있습니다.',
  keysLocalStorage:
    '모든 키는 브라우저에 저장되며 ' +
    '각 API를 제외하고 서버로 전송되지 않습니다.',

  footerPrivacy: '모든 데이터는 브라우저에 저장됩니다',

  apiCalls: 'API 호출',
  remaining: '남은',
  items: '항목',
  tokens: '토큰',
  estCost: '추정',
  showAnalyzed: '분석 항목 표시',
  hideAnalyzed: '분석 항목 숨기기',
  showLogs: '로그 표시',
  hideLogs: '로그 숨기기',
};

const zh: Translations = {
  appName: 'Roast My GitHub',
  settings: '设置',

  heroTitle: 'AI开发者分析',
  heroSubtitle:
    '分析GitHub、GitLab、Codeberg和Bitbucket上的任何开发者。' +
    '获取AI驱动的结构化评估或创意分析。',

  selectPlatform: '请至少选择一个平台。',
  chooseTone: '选择风格',
  categoryProfessional: '专业',
  categoryProfessionalDesc: '用于招聘和成长的结构化评估',
  categoryFun: '趣味 & 创意',
  categoryFunDesc: '关于代码的有趣分析',

  advancedOptions: '高级选项',
  responseLang: '回复语言',
  whatToAnalyze: '分析内容',
  customPersonality: '自定义指令',
  customPersonalityPlaceholder:
    "例如: '关注安全实践' 或 " + "'对JS框架多些讽刺'",

  scopeRecentActivity: '近期活动 (90天)',
  scopeSourceCode: '源代码',
  scopeCommitMessages: '提交信息',
  scopePullRequests: 'Pull requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: '评论 & 审查',
  scopeCrossRepo: '跨仓库贡献',

  analyze: '分析',
  analyzing: '分析中...',
  cancel: '取消',
  via: 'via',

  goDeeper: '深入分析',
  askCustom: '输入后续问题...',
  ask: '提问',
  last30Days: '最近30天',
  last90Days: '最近90天',
  codeReviewStyle: '代码审查风格',
  issueCommunication: 'Issue沟通',
  comparePlatforms: '平台对比',
  collaboration: '协作',

  conversation: '对话',
  export_: '导出',
  clear: '清除',
  initial: '初始',
  followUp: '后续',

  markdownExport: 'Markdown (.md)',
  plainTextExport: '纯文本 (.txt)',
  htmlExport: 'HTML (.html)',
  printPdf: '打印 / PDF',

  rendered: '渲染',
  markdown: 'Markdown',

  llmProvider: 'LLM提供商',
  model: '模型',
  platformTokens: '平台令牌',
  platformTokensOptional: '(可选, 推荐)',
  whyTokens: '为什么使用令牌?',
  whyTokensBody: '没有令牌时平台会限制API请求。' + '使用令牌可以获取更多数据。',
  keysLocalStorage:
    '所有密钥存储在您的浏览器中, ' + '除各自API外不会发送到任何服务器。',

  footerPrivacy: '所有数据保存在您的浏览器中',

  apiCalls: 'API调用',
  remaining: '剩余',
  items: '项目',
  tokens: '令牌',
  estCost: '估计',
  showAnalyzed: '显示分析项目',
  hideAnalyzed: '隐藏分析项目',
  showLogs: '显示日志',
  hideLogs: '隐藏日志',
};

const allTranslations: Record<LangId, Translations> = {
  en,
  fr,
  pt,
  de,
  nl,
  es,
  it,
  ja,
  ko,
  zh,
};

/**
 * Get translations for a given language.
 * Falls back to English for missing keys.
 */
export function t(langId: string): Translations {
  return allTranslations[langId as LangId] ?? en;
}

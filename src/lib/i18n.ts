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

// For languages with complex scripts, provide simplified versions
const nl: Translations = {
  ...en,
  settings: 'Instellingen',
  heroTitle: 'AI-aangedreven ontwikkelaarsprofiel',
  heroSubtitle:
    'Analyseer elke ontwikkelaar op GitHub, GitLab, Codeberg en ' +
    'Bitbucket. Krijg gestructureerde beoordelingen of creatieve ' +
    'analyses met AI.',
  chooseTone: 'Kies een toon',
  categoryProfessional: 'Professioneel',
  categoryFun: 'Leuk & Creatief',
  advancedOptions: 'Geavanceerde opties',
  analyze: 'Analyseren',
  analyzing: 'Bezig met analyseren...',
  cancel: 'Annuleren',
  goDeeper: 'Verdiepen',
  conversation: 'Gesprek',
  clear: 'Wissen',
  footerPrivacy: 'Alle gegevens blijven in uw browser',
};

const ja: Translations = {
  ...en,
  settings: '設定',
  heroTitle: 'AI開発者プロファイリング',
  heroSubtitle:
    'GitHub、GitLab、Codeberg、Bitbucketの開発者を分析。' +
    'AIによる構造化評価やクリエイティブな分析を取得。',
  chooseTone: 'トーンを選択',
  categoryProfessional: 'プロフェッショナル',
  categoryFun: '楽しい＆クリエイティブ',
  advancedOptions: '詳細オプション',
  analyze: '分析',
  analyzing: '分析中...',
  cancel: 'キャンセル',
  goDeeper: '深掘り',
  conversation: '会話',
  clear: 'クリア',
  footerPrivacy: '全てのデータはブラウザ内に保存されます',
};

const ko: Translations = {
  ...en,
  settings: '설정',
  heroTitle: 'AI 개발자 프로파일링',
  heroSubtitle:
    'GitHub, GitLab, Codeberg, Bitbucket의 개발자를 분석하세요. ' +
    'AI 기반 구조화된 평가와 창의적 분석을 받으세요.',
  chooseTone: '톤 선택',
  categoryProfessional: '전문적',
  categoryFun: '재미 & 창의적',
  advancedOptions: '고급 옵션',
  analyze: '분석',
  analyzing: '분석 중...',
  cancel: '취소',
  goDeeper: '심층 분석',
  conversation: '대화',
  clear: '지우기',
  footerPrivacy: '모든 데이터는 브라우저에 저장됩니다',
};

const zh: Translations = {
  ...en,
  settings: '设置',
  heroTitle: 'AI开发者分析',
  heroSubtitle:
    '分析GitHub、GitLab、Codeberg和Bitbucket上的任何开发者。' +
    '获取AI驱动的结构化评估或创意分析。',
  chooseTone: '选择风格',
  categoryProfessional: '专业',
  categoryFun: '趣味 & 创意',
  advancedOptions: '高级选项',
  analyze: '分析',
  analyzing: '分析中...',
  cancel: '取消',
  goDeeper: '深入分析',
  conversation: '对话',
  clear: '清除',
  footerPrivacy: '所有数据保存在您的浏览器中',
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

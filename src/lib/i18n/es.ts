import type { Translations } from './types';

export const es: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Ajustes',

  heroTitle: 'Perfilado de desarrolladores con IA',
  heroSubtitle:
    'Analiza cualquier desarrollador en GitHub, GitLab, Codeberg y ' +
    'Bitbucket. Obt\u00e9n evaluaciones estructuradas, roasts c\u00f3micos ' +
    'o an\u00e1lisis creativos con IA.',

  selectPlatform: 'Selecciona al menos una plataforma.',
  chooseTone: 'Elige un tono',
  categoryProfessional: 'Profesional',
  categoryProfessionalDesc: 'Evaluaciones estructuradas para contrataci\u00f3n',
  categoryFun: 'Divertido & Creativo',
  categoryFunDesc: 'An\u00e1lisis divertidos de tu c\u00f3digo',

  advancedOptions: 'Opciones avanzadas',
  responseLang: 'Idioma de respuesta',
  whatToAnalyze: 'Qu\u00e9 analizar',
  customPersonality: 'Instrucciones de personalidad',
  customPersonalityPlaceholder:
    "ej. 'Enf\u00f3cate en seguridad' o " +
    "'S\u00e9 sarc\u00e1stico sobre frameworks JS'",

  scopeRecentActivity: 'Actividad reciente (90 d\u00edas)',
  scopeSourceCode: 'C\u00f3digo fuente',
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
  last30Days: '\u00daltimos 30 d\u00edas',
  last90Days: '\u00daltimos 90 d\u00edas',
  codeReviewStyle: 'Estilo de code review',
  issueCommunication: 'Comunicaci\u00f3n en issues',
  comparePlatforms: 'Comparar plataformas',
  collaboration: 'Colaboraci\u00f3n',

  conversation: 'Conversaci\u00f3n',
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
  whyTokens: '\u00bfPor qu\u00e9 usar tokens?',
  whyTokensBody:
    'Sin tokens, las plataformas limitan las peticiones API. ' +
    'Con tokens obtienes m\u00e1s datos.',
  keysLocalStorage:
    'Todas las claves se almacenan en tu navegador y ' +
    'nunca se env\u00edan excepto a las API respectivas.',

  toneRecruiterLabel: 'Informe de reclutador',
  toneRecruiterDesc: 'Evaluaci\u00f3n estructurada de candidato',
  toneInterviewerLabel: 'Entrevista tech lead',
  toneInterviewerDesc: '\u00bfContratar\u00edas a esta persona?',
  toneSeniorLabel: 'Ingeniero senior',
  toneSeniorDesc: 'Energ\u00eda de code review estricto',
  toneCoworkerLabel: 'Colega directo',
  toneCoworkerDesc: 'Honesto, sin filtro, \u00fatil',
  toneMentorLabel: 'Mentor motivador',
  toneMentorDesc: 'Apoyo con consejos de crecimiento',
  toneInvestorLabel: 'Inversor VC',
  toneInvestorDesc: 'Due diligence de tu potencial t\u00e9cnico',
  toneRoastLabel: 'Roast de comedia',
  toneRoastDesc: 'Humor brutal, sin piedad',
  toneDetectiveLabel: 'Detective del c\u00f3digo',
  toneDetectiveDesc: 'Sherlock Holmes investiga tus commits',
  toneSportscasterLabel: 'Comentarista deportivo',
  toneSportscasterDesc: 'Narraci\u00f3n en vivo de tu carrera dev',
  toneTherapistLabel: 'Terapeuta del c\u00f3digo',
  toneTherapistDesc: 'Hablemos de tus problemas de repositorio',
  tonePirateLabel: 'Capit\u00e1n pirata',
  tonePirateDesc: 'Arr, d\u00e9jame inspeccionar tu c\u00f3digo, grumete',
  toneDungeonMasterLabel: 'Dungeon Master',
  toneDungeonMasterDesc: 'Tira iniciativa en tu hoja de personaje',
  toneFoodCriticLabel: 'Cr\u00edtico gastron\u00f3mico',
  toneFoodCriticDesc: 'Tu c\u00f3digo est\u00e1 en el men\u00fa esta noche',

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

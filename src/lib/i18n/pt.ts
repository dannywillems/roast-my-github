import type { Translations } from './types';

export const pt: Translations = {
  appName: 'Roast My GitHub',
  settings: 'Configura\u00e7\u00f5es',

  heroTitle: 'Perfilamento de desenvolvedores com IA',
  heroSubtitle:
    'Analise qualquer desenvolvedor no GitHub, GitLab, Codeberg e ' +
    'Bitbucket. Obtenha avalia\u00e7\u00f5es estruturadas, roasts c\u00f4micos ' +
    'ou an\u00e1lises criativas com IA.',

  selectPlatform: 'Selecione pelo menos uma plataforma.',
  chooseTone: 'Escolha um tom',
  categoryProfessional: 'Profissional',
  categoryProfessionalDesc:
    'Avalia\u00e7\u00f5es estruturadas para contrata\u00e7\u00e3o',
  categoryFun: 'Divertido & Criativo',
  categoryFunDesc: 'An\u00e1lises divertidas do seu c\u00f3digo',

  advancedOptions: 'Op\u00e7\u00f5es avan\u00e7adas',
  responseLang: 'Idioma da resposta',
  whatToAnalyze: 'O que analisar',
  customPersonality: 'Instru\u00e7\u00f5es de personalidade',
  customPersonalityPlaceholder:
    "ex. 'Foque em seguran\u00e7a' ou " +
    "'Seja sarc\u00e1stico sobre frameworks JS'",

  scopeRecentActivity: 'Atividade recente (90 dias)',
  scopeSourceCode: 'C\u00f3digo fonte',
  scopeCommitMessages: 'Mensagens de commit',
  scopePullRequests: 'Pull requests',
  scopeIssues: 'Issues',
  scopeCommentsReviews: 'Coment\u00e1rios & reviews',
  scopeCrossRepo: 'Contribui\u00e7\u00f5es cross-repo',

  analyze: 'Analisar',
  analyzing: 'Analisando...',
  cancel: 'Cancelar',
  via: 'via',

  goDeeper: 'Aprofundar',
  askCustom: 'Fa\u00e7a uma pergunta de acompanhamento...',
  ask: 'Perguntar',
  last30Days: '\u00daltimos 30 dias',
  last90Days: '\u00daltimos 90 dias',
  codeReviewStyle: 'Estilo de code review',
  issueCommunication: 'Comunica\u00e7\u00e3o em issues',
  comparePlatforms: 'Comparar plataformas',
  collaboration: 'Colabora\u00e7\u00e3o',

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
    'Sem tokens, as plataformas limitam requisi\u00e7\u00f5es API. ' +
    'Com tokens voc\u00ea obt\u00e9m mais dados.',
  keysLocalStorage:
    'Todas as chaves s\u00e3o armazenadas no seu navegador e ' +
    'nunca enviadas exceto para as APIs respectivas.',

  toneRecruiterLabel: 'Relat\u00f3rio de recrutador',
  toneRecruiterDesc: 'Avalia\u00e7\u00e3o estruturada de candidato',
  toneInterviewerLabel: 'Entrevista tech lead',
  toneInterviewerDesc: 'Voc\u00ea contrataria essa pessoa?',
  toneSeniorLabel: 'Engenheiro s\u00eanior',
  toneSeniorDesc: 'Energia de code review rigoroso',
  toneCoworkerLabel: 'Colega direto',
  toneCoworkerDesc: 'Honesto, sem filtro, \u00fatil',
  toneMentorLabel: 'Mentor encorajador',
  toneMentorDesc: 'Apoio com dicas de crescimento',
  toneInvestorLabel: 'Investidor VC',
  toneInvestorDesc: 'Due diligence do seu potencial t\u00e9cnico',
  toneRoastLabel: 'Roast de com\u00e9dia',
  toneRoastDesc: 'Humor brutal, sem piedade',
  toneDetectiveLabel: 'Detetive do c\u00f3digo',
  toneDetectiveDesc: 'Sherlock Holmes investiga seus commits',
  toneSportscasterLabel: 'Comentarista esportivo',
  toneSportscasterDesc: 'Narra\u00e7\u00e3o ao vivo da sua carreira dev',
  toneTherapistLabel: 'Terapeuta do c\u00f3digo',
  toneTherapistDesc: 'Vamos falar dos seus problemas de reposit\u00f3rio',
  tonePirateLabel: 'Capit\u00e3o pirata',
  tonePirateDesc: 'Arr, deixe-me inspecionar seu c\u00f3digo, marujo',
  toneDungeonMasterLabel: 'Mestre do calabou\u00e7o',
  toneDungeonMasterDesc: 'Role iniciativa na sua ficha de personagem',
  toneFoodCriticLabel: 'Cr\u00edtico gastron\u00f4mico',
  toneFoodCriticDesc: 'Seu c\u00f3digo est\u00e1 no card\u00e1pio esta noite',

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

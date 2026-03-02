import type { Translations } from './types';

export const en: Translations = {
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

  toneRecruiterLabel: 'Recruiter Report',
  toneRecruiterDesc: 'Structured candidate assessment',
  toneInterviewerLabel: 'Tech Lead Interview',
  toneInterviewerDesc: 'Would you hire this person?',
  toneSeniorLabel: 'Senior Engineer',
  toneSeniorDesc: 'Strict code review energy',
  toneCoworkerLabel: 'Blunt Coworker',
  toneCoworkerDesc: 'Honest, no filter, helpful',
  toneMentorLabel: 'Encouraging Mentor',
  toneMentorDesc: 'Supportive with growth tips',
  toneInvestorLabel: 'VC Investor',
  toneInvestorDesc: 'Due diligence on your technical potential',
  toneRoastLabel: 'Comedy Roast',
  toneRoastDesc: 'Brutal humor, no mercy',
  toneDetectiveLabel: 'Code Detective',
  toneDetectiveDesc: 'Sherlock Holmes investigates your commits',
  toneSportscasterLabel: 'Sports Commentator',
  toneSportscasterDesc: 'Play-by-play of your dev career',
  toneTherapistLabel: 'Code Therapist',
  toneTherapistDesc: 'Let us talk about your repository issues',
  tonePirateLabel: 'Pirate Captain',
  tonePirateDesc: 'Arr, let me inspect yer code, matey',
  toneDungeonMasterLabel: 'Dungeon Master',
  toneDungeonMasterDesc: 'Roll for initiative on your character sheet',
  toneFoodCriticLabel: 'Food Critic',
  toneFoodCriticDesc: 'Your code is on the menu tonight',

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

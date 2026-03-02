// ---------------------------------------------------------------
// Normalized types for multi-platform developer analysis.
// All platform providers map their API responses into these types.
// ---------------------------------------------------------------

export type PlatformId = 'github' | 'gitlab' | 'codeberg' | 'bitbucket';

export interface PlatformInput {
  platform: PlatformId;
  username: string;
  pat?: string;
}

// ---- Normalized data types ----

export interface PlatformUser {
  platform: PlatformId;
  login: string;
  name: string | null;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  avatarUrl: string;
  profileUrl: string;
  company: string | null;
  location: string | null;
  website: string | null;
}

export interface PlatformRepo {
  platform: PlatformId;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  updatedAt: string;
  pushedAt: string;
  url: string;
  fork: boolean;
  topics: string[];
  hasIssues: boolean;
  license: string | null;
  size: number;
}

export interface PlatformCommit {
  platform: PlatformId;
  sha: string;
  message: string;
  authorName: string;
  authorDate: string;
  url: string;
}

export interface PlatformPR {
  platform: PlatformId;
  number: number;
  title: string;
  state: string;
  body: string | null;
  createdAt: string;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  reviewComments: number;
  url: string;
}

export interface PlatformIssue {
  platform: PlatformId;
  number: number;
  title: string;
  state: string;
  body: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  comments: number;
  url: string;
  repoFullName?: string;
  isPullRequest: boolean;
}

export interface PlatformComment {
  platform: PlatformId;
  body: string;
  createdAt: string;
  url: string;
  authorLogin: string;
}

export interface PlatformEvent {
  platform: PlatformId;
  type: string;
  repoName: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface PlatformFile {
  path: string;
  content: string;
}

export interface PlatformTreeEntry {
  path: string;
  type: string;
  size?: number;
}

export interface PlatformOrg {
  platform: PlatformId;
  login: string;
  description: string | null;
}

// ---- Per-repo detail ----

export type RepoRelation = 'owned' | 'forked' | 'contributed';

export interface PlatformRepoDetail {
  repo: PlatformRepo;
  relation: RepoRelation;
  commits: PlatformCommit[];
  files: PlatformFile[];
  tree: PlatformTreeEntry[];
  pullRequests: PlatformPR[];
  issues: PlatformIssue[];
  issueComments: PlatformComment[];
  prReviewComments: PlatformComment[];
}

// ---- Cross-repo search results ----

export interface CrossRepoItem {
  platform: PlatformId;
  title: string;
  url: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  body: string | null;
  repoFullName: string;
  isPullRequest: boolean;
  comments: number;
  labels: string[];
}

export interface CrossRepoActivity {
  recentPRs: CrossRepoItem[];
  recentIssues: CrossRepoItem[];
  recentCommitRepos: string[];
}

// ---- Analysis scope options ----

export interface AnalysisScope {
  recentActivity: boolean;
  sourceCode: boolean;
  pullRequests: boolean;
  issues: boolean;
  commentsReviews: boolean;
  crossRepoContributions: boolean;
  commitMessages: boolean;
}

export const defaultScope: AnalysisScope = {
  recentActivity: true,
  sourceCode: true,
  pullRequests: true,
  issues: true,
  commentsReviews: true,
  crossRepoContributions: true,
  commitMessages: true,
};

// ---- Analysis manifest ----

export interface AnalyzedItem {
  platform: PlatformId;
  label: string;
  url: string;
  type: 'profile' | 'repo' | 'file' | 'commit' | 'pr' | 'issue' | 'comment';
}

export interface AnalysisMetadata {
  analyzedItems: AnalyzedItem[];
  rateLimitRemaining: number | null;
  rateLimitTotal: number | null;
  rateLimitReset: string | null;
  apiCallsMade: number;
}

// ---- Top-level data per platform ----

export interface PlatformData {
  platform: PlatformId;
  user: PlatformUser;
  orgs: PlatformOrg[];
  events: PlatformEvent[];
  ownedRepos: PlatformRepo[];
  forkedRepos: PlatformRepo[];
  contributedRepoNames: string[];
  repoDetails: PlatformRepoDetail[];
  crossRepoActivity: CrossRepoActivity;
  metadata: AnalysisMetadata;
}

export interface MultiPlatformData {
  platforms: PlatformData[];
}

// ---- Platform provider interface ----

export interface PlatformProvider {
  id: PlatformId;
  name: string;
  fetchData(
    username: string,
    pat?: string,
    onProgress?: (msg: string) => void,
    scope?: AnalysisScope,
  ): Promise<PlatformData>;
}

// ---- Follow-up types ----

export type FollowUpType =
  | 'deep-dive-repo'
  | 'time-frame'
  | 'code-review-style'
  | 'issue-communication'
  | 'compare-platforms'
  | 'specific-repo'
  | 'collaboration-patterns'
  | 'custom';

export interface FollowUpAction {
  type: FollowUpType;
  label: string;
  description: string;
  context?: Record<string, unknown>;
}

export interface FollowUpContext {
  type: FollowUpType;
  repoFullName?: string;
  timeFrameDays?: number;
  customPrompt?: string;
}

// ---- Conversation history ----

export interface ConversationEntry {
  id: string;
  timestamp: string;
  type: 'initial' | 'follow-up';
  platformInputs: PlatformInput[];
  scope: AnalysisScope;
  toneId: string;
  prompt: string;
  response: string;
  metadata: {
    tokenEstimate: number;
    costEstimate: string;
    followUpType?: FollowUpType;
  };
}

// ---- Platform display info ----

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  icon: string;
  placeholder: string;
  patLabel: string;
  patPlaceholder: string;
  patHelp: string;
}

export const platformConfigs: PlatformConfig[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: 'GH',
    placeholder: 'GitHub username',
    patLabel: 'GitHub PAT',
    patPlaceholder: 'ghp_...',
    patHelp:
      'Fine-grained token with public repo read access. ' +
      '60 req/hr without, 5,000/hr with.',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: 'GL',
    placeholder: 'GitLab username',
    patLabel: 'GitLab Token',
    patPlaceholder: 'glpat-...',
    patHelp:
      'Personal access token with read_api scope. ' +
      '10 req/sec unauthenticated.',
  },
  {
    id: 'codeberg',
    name: 'Codeberg',
    icon: 'CB',
    placeholder: 'Codeberg username',
    patLabel: 'Codeberg Token',
    patPlaceholder: 'token...',
    patHelp: 'Gitea API token for higher rate limits.',
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    icon: 'BB',
    placeholder: 'Bitbucket username',
    patLabel: 'Bitbucket App Password',
    patPlaceholder: 'app password...',
    patHelp:
      'App password with read permissions. ' + '1,000 req/hr unauthenticated.',
  },
];

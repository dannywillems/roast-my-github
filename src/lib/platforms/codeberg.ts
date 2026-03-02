// ---------------------------------------------------------------
// Codeberg (Gitea) platform provider.
//
// Uses Gitea API v1 at https://codeberg.org/api/v1/.
// Maps all responses to normalized Platform types from types.ts.
//
// Auth: Authorization header with token.
// Note: Codeberg does not have a public events API, so events
// are left as an empty array.
// ---------------------------------------------------------------

import type {
  PlatformProvider,
  PlatformData,
  PlatformUser,
  PlatformRepo,
  PlatformCommit,
  PlatformPR,
  PlatformIssue,
  PlatformComment,
  PlatformFile,
  PlatformTreeEntry,
  PlatformOrg,
  PlatformRepoDetail,
  CrossRepoActivity,
  AnalysisMetadata,
  AnalyzedItem,
  AnalysisScope,
  RepoRelation,
} from './types';
import { defaultScope } from './types';

// ---- Internal API response interfaces ----

interface GiteaUser {
  id: number;
  login: string;
  full_name: string;
  description: string;
  avatar_url: string;
  created: string;
  followers_count: number;
  following_count: number;
  location: string;
  website: string;
}

interface GiteaRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  html_url: string;
  fork: boolean;
  topics: string[] | null;
  has_issues: boolean;
  size: number;
  owner: { login: string };
}

interface GiteaCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  html_url: string;
}

interface GiteaPull {
  number: number;
  title: string;
  state: string;
  body: string | null;
  created_at: string;
  merged_at: string | null;
  merged: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  html_url: string;
}

interface GiteaIssue {
  number: number;
  title: string;
  state: string;
  body: string | null;
  labels: { name: string }[];
  created_at: string;
  updated_at: string;
  comments: number;
  html_url: string;
  pull_request?: unknown;
}

interface GiteaComment {
  body: string;
  created_at: string;
  html_url: string;
  user: { login: string };
}

interface GiteaTreeEntry {
  path: string;
  type: string;
  size?: number;
}

interface GiteaTreeResponse {
  tree: GiteaTreeEntry[];
}

interface GiteaOrg {
  username: string;
  description: string;
  avatar_url: string;
}

// ---- Constants ----

const API_BASE = 'https://codeberg.org/api/v1';
const MAX_FILE_CONTENT_LENGTH = 3000;
const MAX_BODY_TRUNCATE_LENGTH = 500;
const MAX_OWNED_REPOS_IN_OVERVIEW = 15;
const MAX_FORKED_REPOS_IN_OVERVIEW = 10;
const MAX_TRACKED_COMMENTS_PER_CATEGORY = 5;
const MAX_COMMIT_LABEL_LENGTH = 60;

const INTERESTING_FILES = [
  'lib.rs',
  'main.rs',
  'mod.rs',
  'index.ts',
  'index.tsx',
  'index.js',
  'app.ts',
  'app.tsx',
  'app.py',
  'main.py',
  '__init__.py',
  'main.go',
  'main.c',
  'main.cpp',
  'Cargo.toml',
  'package.json',
  'pyproject.toml',
  'go.mod',
  'Makefile',
  'Dockerfile',
  'README.md',
];

// ---- Tracking state ----

let _rateLimitRemaining: number | null = null;
let _rateLimitTotal: number | null = null;
let _rateLimitReset: string | null = null;
let _apiCallsMade = 0;

function resetTracking(): void {
  _rateLimitRemaining = null;
  _rateLimitTotal = null;
  _rateLimitReset = null;
  _apiCallsMade = 0;
}

function trackRateLimit(res: Response): void {
  const remaining = res.headers.get('x-ratelimit-remaining');
  const limit = res.headers.get('x-ratelimit-limit');
  if (remaining !== null) _rateLimitRemaining = parseInt(remaining);
  if (limit !== null) _rateLimitTotal = parseInt(limit);
}

// ---- HTTP helpers ----

function makeHeaders(pat?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/json',
  };
  if (pat) h['Authorization'] = `token ${pat}`;
  return h;
}

async function giteaFetch<T>(path: string, pat?: string): Promise<T> {
  const h = makeHeaders(pat);
  const res = await fetch(`${API_BASE}${path}`, { headers: h });
  _apiCallsMade++;
  trackRateLimit(res);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Codeberg resource not found: ${path}`);
    }
    if (res.status === 403 || res.status === 429) {
      throw new Error(
        `Codeberg API rate limited or forbidden: ${path}. ` +
          'Try adding a Codeberg token.',
      );
    }
    throw new Error(`Codeberg API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

async function giteaSafe<T>(path: string, pat?: string): Promise<T> {
  try {
    return await giteaFetch<T>(path, pat);
  } catch {
    return [] as unknown as T;
  }
}

async function fetchRawFile(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  pat?: string,
): Promise<string | null> {
  const h = makeHeaders(pat);
  try {
    const res = await fetch(
      `${API_BASE}/repos/${owner}/${repo}/raw/${branch}/${filePath}`,
      { headers: h },
    );
    _apiCallsMade++;
    trackRateLimit(res);
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > MAX_FILE_CONTENT_LENGTH
      ? text.slice(0, MAX_FILE_CONTENT_LENGTH) + '\n... (truncated)'
      : text;
  } catch {
    return null;
  }
}

function truncate(
  s: string | null,
  max: number = MAX_BODY_TRUNCATE_LENGTH,
): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '... (truncated)' : s;
}

// ---- File selection heuristics ----

function pickInterestingFiles(tree: PlatformTreeEntry[]): string[] {
  const found: string[] = [];

  for (const entry of tree) {
    const filename = entry.path.split('/').pop() ?? '';
    if (INTERESTING_FILES.includes(filename)) {
      found.push(entry.path);
    }
  }

  const unique = [...new Set(found)];

  const configFiles = new Set([
    'Cargo.toml',
    'package.json',
    'pyproject.toml',
    'go.mod',
    'Makefile',
    'Dockerfile',
    'README.md',
  ]);

  return unique.sort((a, b) => {
    const aName = a.split('/').pop() ?? '';
    const bName = b.split('/').pop() ?? '';
    const aIsConfig = configFiles.has(aName) ? 1 : 0;
    const bIsConfig = configFiles.has(bName) ? 1 : 0;
    return aIsConfig - bIsConfig;
  });
}

// ---- Mapping helpers ----

function mapUser(u: GiteaUser): PlatformUser {
  return {
    platform: 'codeberg',
    login: u.login,
    name: u.full_name || null,
    bio: u.description || null,
    publicRepos: 0,
    followers: u.followers_count ?? 0,
    following: u.following_count ?? 0,
    createdAt: u.created,
    avatarUrl: u.avatar_url,
    profileUrl: `https://codeberg.org/${u.login}`,
    company: null,
    location: u.location || null,
    website: u.website || null,
  };
}

function mapRepo(r: GiteaRepo): PlatformRepo {
  return {
    platform: 'codeberg',
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    language: r.language || null,
    stars: r.stars_count,
    forks: r.forks_count,
    openIssues: r.open_issues_count ?? 0,
    defaultBranch: r.default_branch || 'main',
    updatedAt: r.updated_at,
    pushedAt: r.updated_at,
    url: r.html_url,
    fork: r.fork,
    topics: r.topics ?? [],
    hasIssues: r.has_issues ?? true,
    license: null,
    size: r.size ?? 0,
  };
}

function mapCommit(c: GiteaCommit): PlatformCommit {
  return {
    platform: 'codeberg',
    sha: c.sha,
    message: c.commit.message,
    authorName: c.commit.author.name,
    authorDate: c.commit.author.date,
    url: c.html_url,
  };
}

function mapPull(p: GiteaPull): PlatformPR {
  return {
    platform: 'codeberg',
    number: p.number,
    title: p.title,
    state: p.state,
    body: truncate(p.body),
    createdAt: p.created_at,
    mergedAt: p.merged_at,
    additions: p.additions ?? 0,
    deletions: p.deletions ?? 0,
    changedFiles: p.changed_files ?? 0,
    comments: p.comments ?? 0,
    reviewComments: 0,
    url: p.html_url,
  };
}

function mapIssue(issue: GiteaIssue, repoFullName: string): PlatformIssue {
  return {
    platform: 'codeberg',
    number: issue.number,
    title: issue.title,
    state: issue.state,
    body: truncate(issue.body),
    labels: (issue.labels ?? []).map(l => l.name),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    comments: issue.comments ?? 0,
    url: issue.html_url,
    repoFullName,
    isPullRequest: !!issue.pull_request,
  };
}

function mapComment(c: GiteaComment): PlatformComment {
  return {
    platform: 'codeberg',
    body: truncate(c.body),
    createdAt: c.created_at,
    url: c.html_url,
    authorLogin: c.user?.login ?? 'unknown',
  };
}

function mapOrg(o: GiteaOrg): PlatformOrg {
  return {
    platform: 'codeberg',
    login: o.username,
    description: o.description || null,
  };
}

// ---- Deep dive into a single repo ----

async function fetchRepoDetail(
  owner: string,
  repoData: GiteaRepo,
  mapped: PlatformRepo,
  _username: string,
  pat: string | undefined,
  hasAuth: boolean,
  scope: AnalysisScope,
  analyzed: AnalyzedItem[],
): Promise<PlatformRepoDetail> {
  const repoName = repoData.name;
  const branch = repoData.default_branch || 'main';

  // Fetch commits
  const commits: PlatformCommit[] = [];
  if (scope.commitMessages) {
    const giteaCommits = await giteaSafe<GiteaCommit[]>(
      `/repos/${owner}/${repoName}/commits?limit=20`,
      pat,
    );
    for (const c of giteaCommits) {
      const mc = mapCommit(c);
      commits.push(mc);
      analyzed.push({
        platform: 'codeberg',
        label: `Commit: ${c.commit.message.split('\n')[0].slice(0, MAX_COMMIT_LABEL_LENGTH)}`,
        url: mc.url,
        type: 'commit',
      });
    }
  }

  // Fetch tree
  let tree: PlatformTreeEntry[] = [];
  if (scope.sourceCode) {
    const treeResp = await giteaSafe<GiteaTreeResponse>(
      `/repos/${owner}/${repoName}/git/trees/${branch}?recursive=true`,
      pat,
    );
    if (treeResp && treeResp.tree) {
      tree = treeResp.tree.map(e => ({
        path: e.path,
        type: e.type === 'blob' ? 'blob' : 'tree',
        size: e.size,
      }));
    }
  }

  // Pick and fetch interesting files
  const files: PlatformFile[] = [];
  if (scope.sourceCode) {
    const blobEntries = tree.filter(e => e.type === 'blob');
    const filesToRead = pickInterestingFiles(blobEntries);
    const maxFiles = hasAuth ? 5 : 2;
    for (const fp of filesToRead.slice(0, maxFiles)) {
      const content = await fetchRawFile(owner, repoName, branch, fp, pat);
      if (content) {
        files.push({ path: fp, content });
        analyzed.push({
          platform: 'codeberg',
          label: `File: ${mapped.fullName}/${fp}`,
          url: `${mapped.url}/src/branch/${branch}/${fp}`,
          type: 'file',
        });
      }
    }
  }

  // Fetch pull requests
  const pullRequests: PlatformPR[] = [];
  if (scope.pullRequests) {
    const pulls = await giteaSafe<GiteaPull[]>(
      `/repos/${owner}/${repoName}/pulls?state=all&limit=10`,
      pat,
    );
    for (const p of pulls) {
      const mp = mapPull(p);
      pullRequests.push(mp);
      analyzed.push({
        platform: 'codeberg',
        label: `PR #${p.number}: ${p.title}`,
        url: mp.url,
        type: 'pr',
      });
    }
  }

  // Fetch issues (exclude pull requests)
  const issues: PlatformIssue[] = [];
  if (scope.issues) {
    const allIssues = await giteaSafe<GiteaIssue[]>(
      `/repos/${owner}/${repoName}/issues?type=issues&state=all&limit=10`,
      pat,
    );
    for (const issue of allIssues) {
      if (issue.pull_request) continue;
      const mi = mapIssue(issue, mapped.fullName);
      issues.push(mi);
      analyzed.push({
        platform: 'codeberg',
        label: `Issue #${issue.number}: ${issue.title}`,
        url: mi.url,
        type: 'issue',
      });
    }
  }

  // Fetch comments
  const issueComments: PlatformComment[] = [];
  if (scope.commentsReviews) {
    const comments = await giteaSafe<GiteaComment[]>(
      `/repos/${owner}/${repoName}/issues/comments?limit=15`,
      pat,
    );
    for (const c of comments) {
      issueComments.push(mapComment(c));
    }
    for (const c of issueComments.slice(0, MAX_TRACKED_COMMENTS_PER_CATEGORY)) {
      analyzed.push({
        platform: 'codeberg',
        label: `Comment by @${c.authorLogin}`,
        url: c.url,
        type: 'comment',
      });
    }
  }

  const relation: RepoRelation = mapped.fork ? 'forked' : 'owned';

  return {
    repo: mapped,
    relation,
    commits,
    files,
    tree,
    pullRequests,
    issues,
    issueComments,
    prReviewComments: [],
  };
}

// ---- Main entry point ----

async function fetchCodebergData(
  username: string,
  pat?: string,
  onProgress?: (msg: string) => void,
  scope?: AnalysisScope,
): Promise<PlatformData> {
  const log = onProgress ?? (() => {});
  const hasAuth = !!pat;
  const s = scope ?? defaultScope;
  resetTracking();

  const analyzed: AnalyzedItem[] = [];
  const maxDeepDives = hasAuth ? 5 : 3;

  // Phase 1: Fetch user profile.
  log('Fetching Codeberg profile...');
  const giteaUser = await giteaFetch<GiteaUser>(
    `/users/${encodeURIComponent(username)}`,
    pat,
  );
  const user = mapUser(giteaUser);

  analyzed.push({
    platform: 'codeberg',
    label: `Profile: ${username}`,
    url: `https://codeberg.org/${username}`,
    type: 'profile',
  });

  // Phase 2: Fetch repositories sorted by recently updated.
  log('Fetching Codeberg repositories...');
  const repos = await giteaSafe<GiteaRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?sort=updated&limit=30`,
    pat,
  );

  const allRepos = repos.map(mapRepo);
  const ownedRepos = allRepos.filter(r => !r.fork);
  const forkedRepos = allRepos.filter(r => r.fork);

  user.publicRepos = allRepos.length;

  for (const r of ownedRepos.slice(0, MAX_OWNED_REPOS_IN_OVERVIEW)) {
    analyzed.push({
      platform: 'codeberg',
      label: `Owned: ${r.fullName}`,
      url: r.url,
      type: 'repo',
    });
  }
  for (const r of forkedRepos.slice(0, MAX_FORKED_REPOS_IN_OVERVIEW)) {
    analyzed.push({
      platform: 'codeberg',
      label: `Fork: ${r.fullName}`,
      url: r.url,
      type: 'repo',
    });
  }

  // Phase 3: Fetch organizations.
  log('Fetching Codeberg organizations...');
  const giteaOrgs = await giteaSafe<GiteaOrg[]>(
    `/users/${encodeURIComponent(username)}/orgs`,
    pat,
  );
  const orgs: PlatformOrg[] = Array.isArray(giteaOrgs)
    ? giteaOrgs.map(mapOrg)
    : [];

  // Phase 4: Deep dive into top repos by update time.
  const deepDiveRepos = repos.slice(0, maxDeepDives);
  const repoDetails: PlatformRepoDetail[] = [];

  for (const repo of deepDiveRepos) {
    const mapped = mapRepo(repo);
    const owner = repo.owner?.login ?? username;
    const relation = mapped.fork ? 'forked' : 'owned';
    log(
      `Analyzing ${mapped.fullName} [${relation}] (code, PRs, issues, comments)...`,
    );
    const detail = await fetchRepoDetail(
      owner,
      repo,
      mapped,
      username,
      pat,
      hasAuth,
      s,
      analyzed,
    );
    repoDetails.push(detail);
  }

  // Codeberg does not have a public events API.
  // Cross-repo activity is also limited without search capabilities.
  const crossRepoActivity: CrossRepoActivity = {
    recentPRs: [],
    recentIssues: [],
    recentCommitRepos: [],
  };

  const metadata: AnalysisMetadata = {
    analyzedItems: analyzed,
    rateLimitRemaining: _rateLimitRemaining,
    rateLimitTotal: _rateLimitTotal,
    rateLimitReset: _rateLimitReset,
    apiCallsMade: _apiCallsMade,
  };

  return {
    platform: 'codeberg',
    user,
    orgs,
    events: [],
    ownedRepos: ownedRepos.slice(0, MAX_OWNED_REPOS_IN_OVERVIEW),
    forkedRepos: forkedRepos.slice(0, MAX_FORKED_REPOS_IN_OVERVIEW),
    contributedRepoNames: [],
    repoDetails,
    crossRepoActivity,
    metadata,
  };
}

// ---- Exported provider ----

export const codebergProvider: PlatformProvider = {
  id: 'codeberg',
  name: 'Codeberg',
  fetchData: fetchCodebergData,
};

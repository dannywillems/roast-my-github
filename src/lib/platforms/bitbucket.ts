// ---------------------------------------------------------------
// Bitbucket platform provider.
//
// Uses Bitbucket REST API 2.0 at https://api.bitbucket.org/2.0/.
// Maps all responses to normalized Platform types from types.ts.
//
// Auth: Basic auth with username and app password.
// Rate limit: 1000 req/hr unauthenticated.
// Paginated responses use a "values" array and a "next" URL field.
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

interface BBUser {
  username: string;
  display_name: string;
  created_on: string;
  links: {
    avatar: { href: string };
    html: { href: string };
  };
  location?: string;
  website?: string;
}

interface BBRepo {
  slug: string;
  name: string;
  full_name: string;
  description: string;
  language: string;
  size: number;
  updated_on: string;
  created_on: string;
  mainbranch?: { name: string };
  links: {
    html: { href: string };
  };
  parent?: unknown;
  has_issues: boolean;
  fork_policy: string;
  project?: { key: string };
  owner: { username: string };
}

interface BBCommit {
  hash: string;
  message: string;
  date: string;
  author: {
    raw: string;
    user?: { display_name: string };
  };
  links: {
    html: { href: string };
  };
}

interface BBPullRequest {
  id: number;
  title: string;
  state: string;
  description: string;
  created_on: string;
  updated_on: string;
  merge_commit?: { hash: string };
  comment_count: number;
  links: {
    html: { href: string };
  };
}

interface BBIssue {
  id: number;
  title: string;
  state: string;
  content: { raw: string };
  priority: string;
  kind: string;
  created_on: string;
  updated_on: string;
  links: {
    html: { href: string };
  };
}

interface BBComment {
  content: { raw: string };
  created_on: string;
  user: { username: string; display_name: string };
  links: {
    html: { href: string };
  };
}

interface BBPaginated<T> {
  values: T[];
  next?: string;
  size?: number;
}

interface BBSrcEntry {
  path: string;
  type: string;
  size?: number;
}

interface BBWorkspace {
  slug: string;
  name: string;
}

// ---- Constants ----

const API_BASE = 'https://api.bitbucket.org/2.0';
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
  'bitbucket-pipelines.yml',
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
  // Bitbucket does not consistently expose rate limit headers,
  // but check for them in case they appear.
  const remaining = res.headers.get('x-ratelimit-remaining');
  const limit = res.headers.get('x-ratelimit-limit');
  if (remaining !== null) _rateLimitRemaining = parseInt(remaining);
  if (limit !== null) _rateLimitTotal = parseInt(limit);
}

// ---- HTTP helpers ----

// For Bitbucket, the PAT is used as an app password with basic auth.
// The username passed to fetchData is also the auth username.
let _authUsername = '';

function makeHeaders(pat?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/json',
  };
  if (pat && _authUsername) {
    const encoded = btoa(`${_authUsername}:${pat}`);
    h['Authorization'] = `Basic ${encoded}`;
  }
  return h;
}

async function bbFetch<T>(path: string, pat?: string): Promise<T> {
  const h = makeHeaders(pat);
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { headers: h });
  _apiCallsMade++;
  trackRateLimit(res);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Bitbucket resource not found: ${path}`);
    }
    if (res.status === 403 || res.status === 429) {
      throw new Error(
        `Bitbucket API rate limited or forbidden: ${path}. ` +
          'Try adding a Bitbucket app password.',
      );
    }
    throw new Error(`Bitbucket API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

async function bbSafe<T>(path: string, pat?: string): Promise<T> {
  try {
    return await bbFetch<T>(path, pat);
  } catch {
    return [] as unknown as T;
  }
}

async function bbSafePaginated<T>(path: string, pat?: string): Promise<T[]> {
  try {
    const resp = await bbFetch<BBPaginated<T>>(path, pat);
    return resp.values ?? [];
  } catch {
    return [];
  }
}

async function fetchRawFile(
  workspace: string,
  slug: string,
  commitOrBranch: string,
  filePath: string,
  pat?: string,
): Promise<string | null> {
  const h = makeHeaders(pat);
  try {
    const res = await fetch(
      `${API_BASE}/repositories/${workspace}/${slug}/src/${commitOrBranch}/${filePath}`,
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
    if (entry.path.includes('bitbucket-pipelines')) {
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

function mapUser(u: BBUser): PlatformUser {
  return {
    platform: 'bitbucket',
    login: u.username,
    name: u.display_name || null,
    bio: null,
    publicRepos: 0,
    followers: 0,
    following: 0,
    createdAt: u.created_on,
    avatarUrl: u.links?.avatar?.href ?? '',
    profileUrl: u.links?.html?.href ?? `https://bitbucket.org/${u.username}`,
    company: null,
    location: u.location || null,
    website: u.website || null,
  };
}

function mapRepo(r: BBRepo): PlatformRepo {
  const isForked = !!r.parent;
  return {
    platform: 'bitbucket',
    name: r.slug,
    fullName: r.full_name,
    description: r.description || null,
    language: r.language || null,
    stars: 0,
    forks: 0,
    openIssues: 0,
    defaultBranch: r.mainbranch?.name ?? 'main',
    updatedAt: r.updated_on,
    pushedAt: r.updated_on,
    url: r.links?.html?.href ?? `https://bitbucket.org/${r.full_name}`,
    fork: isForked,
    topics: [],
    hasIssues: r.has_issues ?? false,
    license: null,
    size: r.size ?? 0,
  };
}

function mapCommit(c: BBCommit): PlatformCommit {
  return {
    platform: 'bitbucket',
    sha: c.hash,
    message: c.message,
    authorName: c.author?.user?.display_name ?? c.author?.raw ?? 'unknown',
    authorDate: c.date,
    url: c.links?.html?.href ?? '',
  };
}

function mapPullRequest(pr: BBPullRequest): PlatformPR {
  // Bitbucket PR states: OPEN, MERGED, DECLINED, SUPERSEDED.
  // Map merged state based on state field.
  const isMerged = pr.state === 'MERGED';
  return {
    platform: 'bitbucket',
    number: pr.id,
    title: pr.title,
    state: pr.state.toLowerCase(),
    body: truncate(pr.description),
    createdAt: pr.created_on,
    mergedAt: isMerged ? pr.updated_on : null,
    additions: 0,
    deletions: 0,
    changedFiles: 0,
    comments: pr.comment_count ?? 0,
    reviewComments: 0,
    url: pr.links?.html?.href ?? '',
  };
}

function mapIssue(issue: BBIssue, repoFullName: string): PlatformIssue {
  return {
    platform: 'bitbucket',
    number: issue.id,
    title: issue.title,
    state: issue.state,
    body: truncate(issue.content?.raw ?? null),
    labels: [issue.priority, issue.kind].filter(Boolean),
    createdAt: issue.created_on,
    updatedAt: issue.updated_on,
    comments: 0,
    url: issue.links?.html?.href ?? '',
    repoFullName,
    isPullRequest: false,
  };
}

function mapComment(c: BBComment): PlatformComment {
  return {
    platform: 'bitbucket',
    body: truncate(c.content?.raw ?? ''),
    createdAt: c.created_on,
    url: c.links?.html?.href ?? '',
    authorLogin: c.user?.username ?? 'unknown',
  };
}

function mapWorkspace(w: BBWorkspace): PlatformOrg {
  return {
    platform: 'bitbucket',
    login: w.slug,
    description: w.name || null,
  };
}

// ---- Source tree browsing ----

// Bitbucket uses a different approach for browsing source trees.
// The /src endpoint returns paginated directory listings. We walk
// the root directory recursively up to a reasonable depth.
async function fetchSourceTree(
  workspace: string,
  slug: string,
  branch: string,
  pat?: string,
): Promise<PlatformTreeEntry[]> {
  const entries: PlatformTreeEntry[] = [];

  async function walkDir(dirPath: string, depth: number): Promise<void> {
    if (depth > 3) return;
    if (entries.length > 200) return;

    const pathSuffix = dirPath ? `/${dirPath}` : '';
    const resp = await bbSafe<BBPaginated<BBSrcEntry>>(
      `/repositories/${workspace}/${slug}/src/${branch}${pathSuffix}?pagelen=100`,
      pat,
    );

    const values = (resp as BBPaginated<BBSrcEntry>)?.values ?? [];
    for (const entry of values) {
      if (entry.type === 'commit_file') {
        entries.push({
          path: entry.path,
          type: 'blob',
          size: entry.size,
        });
      } else if (entry.type === 'commit_directory') {
        entries.push({
          path: entry.path,
          type: 'tree',
        });
        await walkDir(entry.path, depth + 1);
      }
    }
  }

  try {
    await walkDir('', 0);
  } catch {
    // Source browsing may fail for empty repos.
  }

  return entries;
}

// ---- Deep dive into a single repo ----

async function fetchRepoDetail(
  workspace: string,
  repoData: BBRepo,
  mapped: PlatformRepo,
  _username: string,
  pat: string | undefined,
  hasAuth: boolean,
  scope: AnalysisScope,
  analyzed: AnalyzedItem[],
): Promise<PlatformRepoDetail> {
  const slug = repoData.slug;
  const branch = repoData.mainbranch?.name ?? 'main';

  // Fetch commits
  const commits: PlatformCommit[] = [];
  if (scope.commitMessages) {
    const bbCommits = await bbSafePaginated<BBCommit>(
      `/repositories/${workspace}/${slug}/commits?pagelen=20`,
      pat,
    );
    for (const c of bbCommits) {
      const mc = mapCommit(c);
      commits.push(mc);
      analyzed.push({
        platform: 'bitbucket',
        label: `Commit: ${c.message.split('\n')[0].slice(0, MAX_COMMIT_LABEL_LENGTH)}`,
        url: mc.url,
        type: 'commit',
      });
    }
  }

  // Fetch source tree
  let tree: PlatformTreeEntry[] = [];
  if (scope.sourceCode) {
    tree = await fetchSourceTree(workspace, slug, branch, pat);
  }

  // Pick and fetch interesting files
  const files: PlatformFile[] = [];
  if (scope.sourceCode) {
    const blobEntries = tree.filter(e => e.type === 'blob');
    const filesToRead = pickInterestingFiles(blobEntries);
    const maxFiles = hasAuth ? 5 : 2;
    for (const fp of filesToRead.slice(0, maxFiles)) {
      const content = await fetchRawFile(workspace, slug, branch, fp, pat);
      if (content) {
        files.push({ path: fp, content });
        analyzed.push({
          platform: 'bitbucket',
          label: `File: ${mapped.fullName}/${fp}`,
          url: `${mapped.url}/src/${branch}/${fp}`,
          type: 'file',
        });
      }
    }
  }

  // Fetch pull requests
  const pullRequests: PlatformPR[] = [];
  if (scope.pullRequests) {
    const prs = await bbSafePaginated<BBPullRequest>(
      `/repositories/${workspace}/${slug}/pullrequests?state=MERGED&state=OPEN&state=DECLINED&pagelen=10`,
      pat,
    );
    for (const pr of prs) {
      const mpr = mapPullRequest(pr);
      pullRequests.push(mpr);
      analyzed.push({
        platform: 'bitbucket',
        label: `PR #${pr.id}: ${pr.title}`,
        url: mpr.url,
        type: 'pr',
      });
    }
  }

  // Fetch issues (only if the repo has issues enabled)
  const issues: PlatformIssue[] = [];
  if (scope.issues && repoData.has_issues) {
    const bbIssues = await bbSafePaginated<BBIssue>(
      `/repositories/${workspace}/${slug}/issues?pagelen=10`,
      pat,
    );
    for (const issue of bbIssues) {
      const mi = mapIssue(issue, mapped.fullName);
      issues.push(mi);
      analyzed.push({
        platform: 'bitbucket',
        label: `Issue #${issue.id}: ${issue.title}`,
        url: mi.url,
        type: 'issue',
      });
    }
  }

  // Fetch PR comments for the most recent PRs
  const prReviewComments: PlatformComment[] = [];
  if (scope.commentsReviews && pullRequests.length > 0) {
    const prsToFetch = pullRequests.slice(0, 3);
    for (const pr of prsToFetch) {
      const comments = await bbSafePaginated<BBComment>(
        `/repositories/${workspace}/${slug}/pullrequests/${pr.number}/comments?pagelen=15`,
        pat,
      );
      for (const c of comments) {
        prReviewComments.push(mapComment(c));
      }
    }
    for (const c of prReviewComments.slice(
      0,
      MAX_TRACKED_COMMENTS_PER_CATEGORY,
    )) {
      analyzed.push({
        platform: 'bitbucket',
        label: `PR comment by @${c.authorLogin}`,
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
    issueComments: [],
    prReviewComments,
  };
}

// ---- Main entry point ----

async function fetchBitbucketData(
  username: string,
  pat?: string,
  onProgress?: (msg: string) => void,
  scope?: AnalysisScope,
): Promise<PlatformData> {
  const log = onProgress ?? (() => {});
  const hasAuth = !!pat;
  const s = scope ?? defaultScope;
  resetTracking();

  // Store username for basic auth header construction.
  _authUsername = username;

  const analyzed: AnalyzedItem[] = [];
  const maxDeepDives = hasAuth ? 5 : 3;

  // Phase 1: Fetch user profile.
  log('Fetching Bitbucket profile...');
  const bbUser = await bbFetch<BBUser>(
    `/users/${encodeURIComponent(username)}`,
    pat,
  );
  const user = mapUser(bbUser);

  analyzed.push({
    platform: 'bitbucket',
    label: `Profile: ${username}`,
    url: user.profileUrl,
    type: 'profile',
  });

  // Phase 2: Fetch repositories sorted by recently updated.
  log('Fetching Bitbucket repositories...');
  const repoResp = await bbSafe<BBPaginated<BBRepo>>(
    `/repositories/${encodeURIComponent(username)}?sort=-updated_on&pagelen=30`,
    pat,
  );
  const repos: BBRepo[] = (repoResp as BBPaginated<BBRepo>)?.values ?? [];

  const allRepos = repos.map(mapRepo);
  const ownedRepos = allRepos.filter(r => !r.fork);
  const forkedRepos = allRepos.filter(r => r.fork);

  user.publicRepos = allRepos.length;

  for (const r of ownedRepos.slice(0, MAX_OWNED_REPOS_IN_OVERVIEW)) {
    analyzed.push({
      platform: 'bitbucket',
      label: `Owned: ${r.fullName}`,
      url: r.url,
      type: 'repo',
    });
  }
  for (const r of forkedRepos.slice(0, MAX_FORKED_REPOS_IN_OVERVIEW)) {
    analyzed.push({
      platform: 'bitbucket',
      label: `Fork: ${r.fullName}`,
      url: r.url,
      type: 'repo',
    });
  }

  // Phase 3: Fetch workspaces (Bitbucket's equivalent of organizations).
  log('Fetching Bitbucket workspaces...');
  let orgs: PlatformOrg[] = [];
  if (hasAuth) {
    // Workspaces endpoint requires authentication.
    const workspaces = await bbSafePaginated<BBWorkspace>(
      `/workspaces?pagelen=20`,
      pat,
    );
    orgs = workspaces.map(mapWorkspace);
  }

  // Phase 4: Deep dive into top repos by update time.
  const deepDiveRepos = repos.slice(0, maxDeepDives);
  const repoDetails: PlatformRepoDetail[] = [];

  for (const repo of deepDiveRepos) {
    const mapped = mapRepo(repo);
    const workspace = repo.owner?.username ?? username;
    const relation = mapped.fork ? 'forked' : 'owned';
    log(
      `Analyzing ${mapped.fullName} [${relation}] (code, PRs, issues, comments)...`,
    );
    const detail = await fetchRepoDetail(
      workspace,
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

  // Bitbucket does not offer a cross-repo search API comparable to
  // GitHub's search. Leave cross-repo activity empty.
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
    platform: 'bitbucket',
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

export const bitbucketProvider: PlatformProvider = {
  id: 'bitbucket',
  name: 'Bitbucket',
  fetchData: fetchBitbucketData,
};

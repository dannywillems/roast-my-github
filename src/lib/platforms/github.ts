// ---------------------------------------------------------------
// GitHub platform provider.
//
// Implements the PlatformProvider interface from ./types.ts,
// mapping GitHub API responses into the normalized Platform types.
//
// Data fetching strategy:
//
// 1. EVENTS FIRST: /users/{login}/events gives the last 90 days
//    of activity across ALL repos (pushes, PRs, reviews, comments,
//    issue interactions). This tells us what the person is actually
//    working on right now.
//
// 2. RECENT REPOS: Sort owned repos by pushed_at (not stars).
//    Stars bias toward old viral projects. pushed_at shows where
//    they spend time today.
//
// 3. CROSS-REPO CONTRIBUTIONS: Search API finds PRs, issues, and
//    commits authored by the user in ANY repo (open source
//    contributions, work on org repos, etc.).
//
// 4. DEEP DIVES: Pick repos to deep-dive based on recent events,
//    not popularity. Read actual source files, recent commits,
//    PRs, issues, and comments.
//
// 5. ORGANIZATIONS: Fetch org memberships to understand the
//    ecosystem they work in.
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
  PlatformEvent,
  PlatformFile,
  PlatformTreeEntry,
  PlatformOrg,
  PlatformRepoDetail,
  CrossRepoItem,
  CrossRepoActivity,
  AnalysisScope,
  AnalyzedItem,
  AnalysisMetadata,
  RepoRelation,
} from './types.ts';

export { defaultScope } from './types.ts';
export type { AnalysisScope, AnalyzedItem, AnalysisMetadata } from './types.ts';

// ---- Internal GitHub API types (not exported) ----

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  avatar_url: string;
  html_url: string;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  hireable: boolean | null;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  pushed_at: string;
  html_url: string;
  fork: boolean;
  topics: string[];
  has_issues: boolean;
  has_wiki: boolean;
  license: { spdx_id: string } | null;
  size: number;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string; name: string };
  };
  html_url: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  body: string | null;
  labels: { name: string }[];
  created_at: string;
  updated_at: string;
  comments: number;
  pull_request?: unknown;
  html_url: string;
  repository_url?: string;
}

interface GitHubPR {
  number: number;
  title: string;
  state: string;
  body: string | null;
  created_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
  html_url: string;
}

interface GitHubComment {
  body: string;
  created_at: string;
  html_url: string;
  user?: { login: string };
}

interface GitHubEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: Record<string, unknown>;
}

interface GitHubOrg {
  login: string;
  description: string | null;
}

interface SearchItem {
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  body: string | null;
  repository_url: string;
  pull_request?: unknown;
  comments: number;
  labels: { name: string }[];
}

interface FileContent {
  path: string;
  content: string;
}

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

// Internal aggregate types (not exported)

interface RepoDetail {
  repo: GitHubRepo;
  relation: RepoRelation;
  commits: GitHubCommit[];
  files: FileContent[];
  tree: TreeEntry[];
  pullRequests: GitHubPR[];
  issues: GitHubIssue[];
  issueComments: GitHubComment[];
  prReviewComments: GitHubComment[];
}

// ---- Constants ----

const API_BASE = 'https://api.github.com';

// Max characters to read from a single source file before truncating.
// Keeps the LLM prompt from being overwhelmed by a single large file.
const MAX_FILE_CONTENT_LENGTH = 3000;

// Max characters to keep from PR/issue/comment bodies.
// Long bodies are truncated to save prompt tokens.
const MAX_BODY_TRUNCATE_LENGTH = 500;

// Max characters for cross-repo PR/issue bodies (shorter than deep-dive).
const MAX_CROSS_REPO_BODY_LENGTH = 300;

// Max owned repos to include in the overview section of the prompt.
const MAX_OWNED_REPOS_IN_OVERVIEW = 15;

// Max forked repos to include in the overview section.
const MAX_FORKED_REPOS_IN_OVERVIEW = 10;

// Max contributed repos to fetch metadata for (each costs an API call).
const MAX_CONTRIBUTED_REPOS_TO_FETCH = 5;

// Max comments to track in the analyzed items manifest per category.
const MAX_TRACKED_COMMENTS_PER_CATEGORY = 5;

// Max commit message length to show in analyzed items label.
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
  '.github/workflows/ci.yml',
  '.github/workflows/ci.yaml',
];

// ---- HTTP helpers ----

// Mutable tracker for rate limit info across calls
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
  const reset = res.headers.get('x-ratelimit-reset');
  if (remaining !== null) _rateLimitRemaining = parseInt(remaining);
  if (limit !== null) _rateLimitTotal = parseInt(limit);
  if (reset !== null) {
    _rateLimitReset = new Date(parseInt(reset) * 1000).toLocaleTimeString();
  }
}

function makeHeaders(pat?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (pat) h['Authorization'] = `Bearer ${pat}`;
  return h;
}

async function ghFetch<T>(
  path: string,
  pat?: string,
  accept?: string,
): Promise<T> {
  const h = makeHeaders(pat);
  if (accept) h['Accept'] = accept;
  const res = await fetch(`${API_BASE}${path}`, { headers: h });
  _apiCallsMade++;
  trackRateLimit(res);
  if (!res.ok) {
    if (res.status === 403) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        const resetAt = res.headers.get('x-ratelimit-reset');
        const resetDate = resetAt
          ? new Date(parseInt(resetAt) * 1000).toLocaleTimeString()
          : 'soon';
        throw new Error(
          `GitHub API rate limit exceeded. Resets at ${resetDate}. ` +
            'Add a GitHub PAT in Settings to get ' +
            '5,000 requests/hour.',
        );
      }
      throw new Error(
        `GitHub API 403 (forbidden): ${path}. ` +
          'This may be a rate limit. ' +
          'Try adding a GitHub PAT in Settings.',
      );
    }
    if (res.status === 404) {
      throw new Error(`GitHub user or resource not found: ${path}`);
    }
    throw new Error(`GitHub API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

async function ghSafe<T>(path: string, pat?: string): Promise<T> {
  try {
    return await ghFetch<T>(path, pat);
  } catch {
    return [] as unknown as T;
  }
}

async function fetchRawFile(
  owner: string,
  repo: string,
  path: string,
  pat?: string,
): Promise<string | null> {
  const h = makeHeaders(pat);
  h['Accept'] = 'application/vnd.github.v3.raw';
  try {
    const res = await fetch(
      `${API_BASE}/repos/${owner}/${repo}/contents/${path}`,
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

// ---- Exported pure utility functions ----

export function truncate(
  s: string | null,
  max: number = MAX_BODY_TRUNCATE_LENGTH,
): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '... (truncated)' : s;
}

export function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ---- Extract active repos from events ----

export function extractActiveRepos(
  events: GitHubEvent[],
  _username: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of events) {
    const repo = e.repo.name;
    counts.set(repo, (counts.get(repo) ?? 0) + 1);
  }
  return counts;
}

// ---- Pick which repos to deep-dive ----

export function pickDeepDiveRepos(
  ownedRepos: GitHubRepo[],
  allRepos: GitHubRepo[],
  activeRepoNames: Map<string, number>,
  maxCount: number = 5,
): GitHubRepo[] {
  // Score each repo: recent activity weight + stars weight
  const scored: { repo: GitHubRepo; score: number }[] = [];

  const allByName = new Map(allRepos.map(r => [r.full_name, r]));

  // Add all owned repos
  for (const r of ownedRepos) {
    const activityCount = activeRepoNames.get(r.full_name) ?? 0;
    const daysSincePush = daysSince(r.pushed_at);
    const recencyScore = Math.max(0, 100 - daysSincePush);
    const score =
      activityCount * 10 + recencyScore + Math.log2(r.stargazers_count + 1) * 5;
    scored.push({ repo: r, score });
  }

  // Add repos from events that the user doesn't own (contributions)
  for (const [name, count] of activeRepoNames) {
    if (ownedRepos.some(r => r.full_name === name)) continue;
    const repo = allByName.get(name);
    if (repo) {
      scored.push({ repo, score: count * 10 + 50 });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const result: GitHubRepo[] = [];
  for (const { repo } of scored) {
    if (seen.has(repo.full_name)) continue;
    seen.add(repo.full_name);
    result.push(repo);
    if (result.length >= maxCount) break;
  }

  return result;
}

// ---- File selection heuristics ----

export function pickInterestingFiles(tree: TreeEntry[]): string[] {
  const found: string[] = [];

  for (const entry of tree) {
    const filename = entry.path.split('/').pop() ?? '';
    if (INTERESTING_FILES.includes(filename)) {
      found.push(entry.path);
    }
    // Also pick CI workflow files
    if (entry.path.includes('.github/workflows/')) {
      found.push(entry.path);
    }
  }

  // Deduplicate
  const unique = [...new Set(found)];

  // Sort: prefer source files over config files
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

// ---- Mapping functions: GitHub types -> Platform types ----

function mapUser(u: GitHubUser): PlatformUser {
  return {
    platform: 'github',
    login: u.login,
    name: u.name,
    bio: u.bio,
    publicRepos: u.public_repos,
    followers: u.followers,
    following: u.following,
    createdAt: u.created_at,
    avatarUrl: u.avatar_url,
    profileUrl: u.html_url,
    company: u.company,
    location: u.location,
    website: u.blog,
  };
}

function mapRepo(r: GitHubRepo): PlatformRepo {
  return {
    platform: 'github',
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    openIssues: r.open_issues_count,
    defaultBranch: r.default_branch,
    updatedAt: r.updated_at,
    pushedAt: r.pushed_at,
    url: r.html_url,
    fork: r.fork,
    topics: r.topics,
    hasIssues: r.has_issues,
    license: r.license?.spdx_id ?? null,
    size: r.size,
  };
}

function mapCommit(c: GitHubCommit): PlatformCommit {
  return {
    platform: 'github',
    sha: c.sha,
    message: c.commit.message,
    authorName: c.commit.author.name,
    authorDate: c.commit.author.date,
    url: c.html_url,
  };
}

function mapPR(pr: GitHubPR): PlatformPR {
  return {
    platform: 'github',
    number: pr.number,
    title: pr.title,
    state: pr.state,
    body: pr.body,
    createdAt: pr.created_at,
    mergedAt: pr.merged_at,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
    comments: pr.comments,
    reviewComments: pr.review_comments,
    url: pr.html_url,
  };
}

function mapIssue(i: GitHubIssue): PlatformIssue {
  // Extract repo full name from repository_url if available
  // e.g. "https://api.github.com/repos/user/repo" -> "user/repo"
  let repoFullName: string | undefined;
  if (i.repository_url) {
    const parts = i.repository_url.split('/repos/');
    if (parts.length > 1) {
      repoFullName = parts[1];
    }
  }

  return {
    platform: 'github',
    number: i.number,
    title: i.title,
    state: i.state,
    body: i.body,
    labels: i.labels.map(l => l.name),
    createdAt: i.created_at,
    updatedAt: i.updated_at,
    comments: i.comments,
    url: i.html_url,
    repoFullName,
    isPullRequest: !!i.pull_request,
  };
}

function mapComment(c: GitHubComment): PlatformComment {
  return {
    platform: 'github',
    body: c.body,
    createdAt: c.created_at,
    url: c.html_url,
    authorLogin: c.user?.login ?? 'unknown',
  };
}

function mapEvent(e: GitHubEvent): PlatformEvent {
  return {
    platform: 'github',
    type: e.type,
    repoName: e.repo.name,
    createdAt: e.created_at,
    payload: e.payload,
  };
}

function mapOrg(o: GitHubOrg): PlatformOrg {
  return {
    platform: 'github',
    login: o.login,
    description: o.description,
  };
}

function mapFile(f: FileContent): PlatformFile {
  return {
    path: f.path,
    content: f.content,
  };
}

function mapTreeEntry(t: TreeEntry): PlatformTreeEntry {
  return {
    path: t.path,
    type: t.type,
    size: t.size,
  };
}

function mapSearchItem(item: SearchItem): CrossRepoItem {
  // Extract repo full name from repository_url
  // e.g. "https://api.github.com/repos/user/repo" -> "user/repo"
  let repoFullName = '';
  if (item.repository_url) {
    const parts = item.repository_url.split('/repos/');
    if (parts.length > 1) {
      repoFullName = parts[1];
    }
  }

  return {
    platform: 'github',
    title: item.title,
    url: item.html_url,
    state: item.state,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    body: item.body,
    repoFullName,
    isPullRequest: !!item.pull_request,
    comments: item.comments,
    labels: item.labels.map(l => l.name),
  };
}

function mapRepoDetail(d: RepoDetail): PlatformRepoDetail {
  return {
    repo: mapRepo(d.repo),
    relation: d.relation,
    commits: d.commits.map(mapCommit),
    files: d.files.map(mapFile),
    tree: d.tree.map(mapTreeEntry),
    pullRequests: d.pullRequests.map(mapPR),
    issues: d.issues.map(mapIssue),
    issueComments: d.issueComments.map(mapComment),
    prReviewComments: d.prReviewComments.map(mapComment),
  };
}

// ---- Cross-repo contributions via Search API ----

async function fetchCrossRepoActivity(
  username: string,
  pat?: string,
  analyzed?: AnalyzedItem[],
): Promise<CrossRepoActivity> {
  // Search for recent PRs by this user (across all repos)
  const prSearch = await ghSafe<{ items: SearchItem[] }>(
    `/search/issues?q=author:${username}` + `+type:pr+sort:updated&per_page=15`,
    pat,
  );
  const recentPRs = prSearch?.items ?? [];

  // Search for recent issues by this user
  const issueSearch = await ghSafe<{ items: SearchItem[] }>(
    `/search/issues?q=author:${username}` +
      `+type:issue+sort:updated&per_page=15`,
    pat,
  );
  const recentIssues = (issueSearch?.items ?? []).filter(i => !i.pull_request);

  // Search for recent commits by this user
  const commitSearch = await ghSafe<{
    items: { repository: { full_name: string } }[];
  }>(
    `/search/commits?q=author:${username}` + `+sort:author-date&per_page=20`,
    pat,
  );
  const commitRepos = [
    ...new Set((commitSearch?.items ?? []).map(c => c.repository.full_name)),
  ];

  // Truncate bodies
  for (const item of recentPRs) {
    item.body = truncate(item.body, MAX_CROSS_REPO_BODY_LENGTH);
  }
  for (const item of recentIssues) {
    item.body = truncate(item.body, MAX_CROSS_REPO_BODY_LENGTH);
  }

  // Track analyzed items
  if (analyzed) {
    for (const pr of recentPRs) {
      analyzed.push({
        platform: 'github',
        label: `Cross-repo PR: ${pr.title}`,
        url: pr.html_url,
        type: 'pr',
      });
    }
    for (const issue of recentIssues) {
      analyzed.push({
        platform: 'github',
        label: `Cross-repo issue: ${issue.title}`,
        url: issue.html_url,
        type: 'issue',
      });
    }
  }

  return {
    recentPRs: recentPRs.map(mapSearchItem),
    recentIssues: recentIssues.map(mapSearchItem),
    recentCommitRepos: commitRepos,
  };
}

// ---- Single repo deep dive ----

async function fetchRepoDetail(
  owner: string,
  repo: GitHubRepo,
  username: string,
  pat?: string,
  thorough: boolean = true,
  scope?: AnalysisScope,
  analyzed?: AnalyzedItem[],
): Promise<RepoDetail> {
  const s: AnalysisScope = scope ?? {
    recentActivity: true,
    sourceCode: true,
    pullRequests: true,
    issues: true,
    commentsReviews: true,
    crossRepoContributions: true,
    commitMessages: true,
  };

  // Fetch commits by this user in this repo
  const commits = s.commitMessages
    ? await ghSafe<GitHubCommit[]>(
        `/repos/${owner}/${repo.name}/commits` +
          `?author=${username}&per_page=20`,
        pat,
      )
    : [];

  if (analyzed) {
    for (const c of commits) {
      analyzed.push({
        platform: 'github',
        label: `Commit: ${c.commit.message.split('\n')[0].slice(0, MAX_COMMIT_LABEL_LENGTH)}`,
        url: c.html_url,
        type: 'commit',
      });
    }
  }

  // Fetch file tree
  let tree: TreeEntry[] = [];
  if (s.sourceCode) {
    try {
      const treeData = await ghFetch<{ tree: TreeEntry[] }>(
        `/repos/${owner}/${repo.name}/git/trees/` +
          `${repo.default_branch}?recursive=1`,
        pat,
      );
      tree = treeData.tree.filter((e: TreeEntry) => e.type === 'blob');
    } catch {
      // empty repos or permission issues
    }
  }

  // Pick interesting source files to read
  const files: FileContent[] = [];
  if (s.sourceCode) {
    const filesToRead = pickInterestingFiles(tree);
    const maxFiles = thorough ? 5 : 2;
    for (const path of filesToRead.slice(0, maxFiles)) {
      const content = await fetchRawFile(owner, repo.name, path, pat);
      if (content) {
        files.push({ path, content });
        if (analyzed) {
          analyzed.push({
            platform: 'github',
            label: `File: ${repo.full_name}/${path}`,
            url:
              `https://github.com/${repo.full_name}/blob/` +
              `${repo.default_branch}/${path}`,
            type: 'file',
          });
        }
      }
    }
  }

  // Without auth, skip the expensive per-repo fetches
  if (!thorough) {
    return {
      repo,
      relation: 'owned' as RepoRelation,
      commits,
      files,
      tree,
      pullRequests: [],
      issues: [],
      issueComments: [],
      prReviewComments: [],
    };
  }

  // Fetch PRs (all states, recent)
  const pullRequests = s.pullRequests
    ? await ghSafe<GitHubPR[]>(
        `/repos/${owner}/${repo.name}/pulls` +
          `?state=all&sort=updated&per_page=10`,
        pat,
      )
    : [];

  if (analyzed) {
    for (const pr of pullRequests) {
      analyzed.push({
        platform: 'github',
        label: `PR #${pr.number}: ${pr.title}`,
        url: pr.html_url,
        type: 'pr',
      });
    }
  }

  // Fetch issues (exclude PRs)
  let issues: GitHubIssue[] = [];
  if (s.issues) {
    const allIssues = await ghSafe<GitHubIssue[]>(
      `/repos/${owner}/${repo.name}/issues` +
        `?state=all&sort=updated&per_page=10`,
      pat,
    );
    issues = allIssues.filter((i: GitHubIssue) => !i.pull_request);
    if (analyzed) {
      for (const issue of issues) {
        analyzed.push({
          platform: 'github',
          label: `Issue #${issue.number}: ${issue.title}`,
          url: issue.html_url,
          type: 'issue',
        });
      }
    }
  }

  // Fetch issue comments (personality, communication)
  const issueComments = s.commentsReviews
    ? await ghSafe<GitHubComment[]>(
        `/repos/${owner}/${repo.name}/issues/comments` +
          `?sort=updated&direction=desc&per_page=15`,
        pat,
      )
    : [];

  // Fetch PR review comments (code review quality)
  const prReviewComments = s.commentsReviews
    ? await ghSafe<GitHubComment[]>(
        `/repos/${owner}/${repo.name}/pulls/comments` +
          `?sort=updated&direction=desc&per_page=15`,
        pat,
      )
    : [];

  // Truncate comment bodies
  for (const c of issueComments) c.body = truncate(c.body);
  for (const c of prReviewComments) c.body = truncate(c.body);

  if (analyzed && s.commentsReviews) {
    for (const c of issueComments.slice(0, MAX_TRACKED_COMMENTS_PER_CATEGORY)) {
      analyzed.push({
        platform: 'github',
        label: `Comment by @${c.user?.login ?? 'unknown'}`,
        url: c.html_url,
        type: 'comment',
      });
    }
    for (const c of prReviewComments.slice(
      0,
      MAX_TRACKED_COMMENTS_PER_CATEGORY,
    )) {
      analyzed.push({
        platform: 'github',
        label: `Review comment by @${c.user?.login ?? 'unknown'}`,
        url: c.html_url,
        type: 'comment',
      });
    }
  }

  return {
    repo,
    relation: 'owned' as RepoRelation,
    commits,
    files,
    tree,
    pullRequests,
    issues,
    issueComments,
    prReviewComments,
  };
}

// ---- Main entry point ----

export async function fetchGitHubData(
  username: string,
  pat?: string,
  onProgress?: (msg: string) => void,
  scope?: AnalysisScope,
): Promise<PlatformData> {
  const log = onProgress ?? (() => {});
  const hasAuth = !!pat;
  const s: AnalysisScope = scope ?? {
    recentActivity: true,
    sourceCode: true,
    pullRequests: true,
    issues: true,
    commentsReviews: true,
    crossRepoContributions: true,
    commitMessages: true,
  };
  resetTracking();

  const analyzed: AnalyzedItem[] = [];

  // Budget awareness:
  // Without PAT: 60 req/hr. We aim for ~30-40 requests.
  // With PAT: 5,000 req/hr. We can be thorough.
  const eventPages = hasAuth ? 3 : 1;
  const maxDeepDives = hasAuth ? 5 : 3;
  const maxRepoFetch = hasAuth ? 100 : 30;

  // Phase 1: Profile + events + orgs (parallel)
  log('Fetching profile and recent activity...');
  const fetches: Promise<unknown>[] = [
    ghFetch<GitHubUser>(`/users/${username}`, pat),
    s.recentActivity
      ? ghSafe<GitHubEvent[]>(
          `/users/${username}/events/public` + `?per_page=100&page=1`,
          pat,
        )
      : Promise.resolve([]),
    ghSafe<GitHubOrg[]>(`/users/${username}/orgs`, pat),
  ];
  if (s.recentActivity && eventPages >= 2) {
    fetches.push(
      ghSafe<GitHubEvent[]>(
        `/users/${username}/events/public` + `?per_page=100&page=2`,
        pat,
      ),
    );
  }
  if (s.recentActivity && eventPages >= 3) {
    fetches.push(
      ghSafe<GitHubEvent[]>(
        `/users/${username}/events/public` + `?per_page=100&page=3`,
        pat,
      ),
    );
  }

  const results = await Promise.all(fetches);
  const user = results[0] as GitHubUser;
  const events1 = results[1] as GitHubEvent[];
  const orgs = results[2] as GitHubOrg[];
  const events2 = (results[3] as GitHubEvent[] | undefined) ?? [];
  const events3 = (results[4] as GitHubEvent[] | undefined) ?? [];
  const recentEvents = [...events1, ...events2, ...events3];

  analyzed.push({
    platform: 'github',
    label: `Profile: ${username}`,
    url: `https://github.com/${username}`,
    type: 'profile',
  });

  // Phase 2: Repos sorted by recently pushed
  log('Fetching repositories...');
  const allRepos = await ghFetch<GitHubRepo[]>(
    `/users/${username}/repos?sort=pushed` +
      `&direction=desc&per_page=${maxRepoFetch}`,
    pat,
  );

  // Separate owned vs forked repos
  const ownedRepos = allRepos.filter(r => !r.fork);
  const forkedRepos = allRepos.filter(r => r.fork);
  const activeRepoNames = extractActiveRepos(recentEvents, username);

  // Identify repos from events that user doesn't own or fork.
  // These are contributions to other people's repos.
  const allRepoNames = new Set(allRepos.map(r => r.full_name));
  const contributedRepoNames: string[] = [];
  for (const name of activeRepoNames.keys()) {
    if (!allRepoNames.has(name)) {
      contributedRepoNames.push(name);
    }
  }

  for (const r of ownedRepos.slice(0, MAX_OWNED_REPOS_IN_OVERVIEW)) {
    analyzed.push({
      platform: 'github',
      label: `Owned: ${r.full_name}`,
      url: r.html_url,
      type: 'repo',
    });
  }
  for (const r of forkedRepos.slice(0, MAX_FORKED_REPOS_IN_OVERVIEW)) {
    analyzed.push({
      platform: 'github',
      label: `Fork: ${r.full_name}`,
      url: r.html_url,
      type: 'repo',
    });
  }

  // Fetch metadata for contributed repos (not in user's repo list)
  const contributedRepos: GitHubRepo[] = [];
  if (s.crossRepoContributions) {
    for (const name of contributedRepoNames.slice(
      0,
      MAX_CONTRIBUTED_REPOS_TO_FETCH,
    )) {
      log(`Fetching contributed repo ${name}...`);
      const repo = await ghSafe<GitHubRepo>(`/repos/${name}`, pat);
      if (repo && (repo as GitHubRepo).full_name) {
        contributedRepos.push(repo as GitHubRepo);
        analyzed.push({
          platform: 'github',
          label: `Contributed: ${name}`,
          url: (repo as GitHubRepo).html_url,
          type: 'repo',
        });
      }
    }
  }

  // Pick repos for deep dive: include owned, forked,
  // and contributed
  const deepDiveRepos = pickDeepDiveRepos(
    ownedRepos,
    [...allRepos, ...contributedRepos],
    activeRepoNames,
    maxDeepDives,
  );

  // Phase 3: Deep dives (sequential to avoid rate limits)
  const repoDetails: RepoDetail[] = [];
  for (const repo of deepDiveRepos) {
    const owner = repo.full_name.split('/')[0];
    const relation: RepoRelation = repo.fork
      ? 'forked'
      : owner === username
        ? 'owned'
        : 'contributed';
    log(
      `Analyzing ${repo.full_name} [${relation}] ` +
        `(code, PRs, issues, comments)...`,
    );
    const detail = await fetchRepoDetail(
      owner,
      repo,
      username,
      pat,
      hasAuth,
      s,
      analyzed,
    );
    detail.relation = relation;
    repoDetails.push(detail);
  }

  // Phase 4: Cross-repo contributions via Search API
  let crossRepoActivity: CrossRepoActivity = {
    recentPRs: [],
    recentIssues: [],
    recentCommitRepos: [],
  };
  if (s.crossRepoContributions && hasAuth) {
    log('Fetching cross-repo contributions...');
    crossRepoActivity = await fetchCrossRepoActivity(username, pat, analyzed);
  }

  const metadata: AnalysisMetadata = {
    analyzedItems: analyzed,
    rateLimitRemaining: _rateLimitRemaining,
    rateLimitTotal: _rateLimitTotal,
    rateLimitReset: _rateLimitReset,
    apiCallsMade: _apiCallsMade,
  };

  return {
    platform: 'github',
    user: mapUser(user),
    orgs: orgs.map(mapOrg),
    events: recentEvents.map(mapEvent),
    ownedRepos: ownedRepos.slice(0, MAX_OWNED_REPOS_IN_OVERVIEW).map(mapRepo),
    forkedRepos: forkedRepos
      .slice(0, MAX_FORKED_REPOS_IN_OVERVIEW)
      .map(mapRepo),
    contributedRepoNames,
    repoDetails: repoDetails.map(mapRepoDetail),
    crossRepoActivity,
    metadata,
  };
}

// ---- Platform provider ----

export const githubProvider: PlatformProvider = {
  id: 'github',
  name: 'GitHub',
  fetchData: fetchGitHubData,
};

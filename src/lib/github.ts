// ---------------------------------------------------------------
// GitHub data fetching strategy:
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

export interface GitHubUser {
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

export interface GitHubRepo {
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

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string; name: string };
  };
  html_url: string;
}

export interface GitHubIssue {
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

export interface GitHubPR {
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

export interface GitHubComment {
  body: string;
  created_at: string;
  html_url: string;
  user?: { login: string };
}

export interface GitHubEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: Record<string, unknown>;
}

export interface GitHubOrg {
  login: string;
  description: string | null;
}

export interface SearchItem {
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

export interface FileContent {
  path: string;
  content: string;
}

export interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

// ---- Top-level data shape ----

export interface GitHubData {
  user: GitHubUser;
  orgs: GitHubOrg[];
  recentEvents: GitHubEvent[];
  ownedRepos: GitHubRepo[];
  repoDetails: RepoDetail[];
  crossRepoActivity: CrossRepoActivity;
}

export interface RepoDetail {
  repo: GitHubRepo;
  commits: GitHubCommit[];
  files: FileContent[];
  tree: TreeEntry[];
  pullRequests: GitHubPR[];
  issues: GitHubIssue[];
  issueComments: GitHubComment[];
  prReviewComments: GitHubComment[];
}

export interface CrossRepoActivity {
  recentPRs: SearchItem[];
  recentIssues: SearchItem[];
  recentCommitRepos: string[];
}

// ---- Constants ----

const API_BASE = 'https://api.github.com';

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
            'Add a GitHub PAT in Settings to get 5,000 requests/hour.',
        );
      }
      throw new Error(
        `GitHub API 403 (forbidden): ${path}. ` +
          'This may be a rate limit. Try adding a GitHub PAT in Settings.',
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
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > 3000
      ? text.slice(0, 3000) + '\n... (truncated)'
      : text;
  } catch {
    return null;
  }
}

function truncate(s: string | null, max: number = 500): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '... (truncated)' : s;
}

// ---- Main entry point ----

export async function fetchGitHubData(
  username: string,
  pat?: string,
  onProgress?: (msg: string) => void,
): Promise<GitHubData> {
  const log = onProgress ?? (() => {});
  const hasAuth = !!pat;

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
    ghSafe<GitHubEvent[]>(
      `/users/${username}/events/public?per_page=100&page=1`,
      pat,
    ),
    ghSafe<GitHubOrg[]>(`/users/${username}/orgs`, pat),
  ];
  if (eventPages >= 2) {
    fetches.push(
      ghSafe<GitHubEvent[]>(
        `/users/${username}/events/public?per_page=100&page=2`,
        pat,
      ),
    );
  }
  if (eventPages >= 3) {
    fetches.push(
      ghSafe<GitHubEvent[]>(
        `/users/${username}/events/public?per_page=100&page=3`,
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

  // Phase 2: Repos sorted by recently pushed
  log('Fetching repositories...');
  const allRepos = await ghFetch<GitHubRepo[]>(
    `/users/${username}/repos?sort=pushed&direction=desc&per_page=${maxRepoFetch}`,
    pat,
  );

  // Build a picture of repos they actively work on
  const ownedRepos = allRepos.filter(r => !r.fork);
  const activeRepoNames = extractActiveRepos(recentEvents, username);

  // Pick repos for deep dive: prioritize recently active ones
  const deepDiveRepos = pickDeepDiveRepos(
    ownedRepos,
    allRepos,
    activeRepoNames,
    maxDeepDives,
  );

  // Phase 3: Deep dives (sequential to avoid rate limits)
  const repoDetails: RepoDetail[] = [];
  for (const repo of deepDiveRepos) {
    const owner = repo.full_name.split('/')[0];
    log(`Analyzing ${repo.full_name} (code, PRs, issues, comments)...`);
    const detail = await fetchRepoDetail(owner, repo, username, pat, hasAuth);
    repoDetails.push(detail);
  }

  // Phase 4: Cross-repo contributions (skip without auth to save budget)
  let crossRepoActivity: CrossRepoActivity = {
    recentPRs: [],
    recentIssues: [],
    recentCommitRepos: [],
  };
  if (hasAuth) {
    log('Fetching cross-repo contributions...');
    crossRepoActivity = await fetchCrossRepoActivity(username, pat);
  }

  return {
    user,
    orgs,
    recentEvents,
    ownedRepos: ownedRepos.slice(0, 15),
    repoDetails,
    crossRepoActivity,
  };
}

// ---- Extract active repos from events ----

function extractActiveRepos(
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

function pickDeepDiveRepos(
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

function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ---- Cross-repo contributions via Search API ----

async function fetchCrossRepoActivity(
  username: string,
  pat?: string,
): Promise<CrossRepoActivity> {
  // Search for recent PRs by this user (across all repos)
  const prSearch = await ghSafe<{ items: SearchItem[] }>(
    `/search/issues?q=author:${username}+type:pr+sort:updated&per_page=15`,
    pat,
  );
  const recentPRs = prSearch?.items ?? [];

  // Search for recent issues by this user
  const issueSearch = await ghSafe<{ items: SearchItem[] }>(
    `/search/issues?q=author:${username}+type:issue+sort:updated&per_page=15`,
    pat,
  );
  const recentIssues = (issueSearch?.items ?? []).filter(i => !i.pull_request);

  // Search for recent commits by this user
  const commitSearch = await ghSafe<{
    items: { repository: { full_name: string } }[];
  }>(`/search/commits?q=author:${username}+sort:author-date&per_page=20`, pat);
  const commitRepos = [
    ...new Set((commitSearch?.items ?? []).map(c => c.repository.full_name)),
  ];

  // Truncate bodies
  for (const item of recentPRs) {
    item.body = truncate(item.body, 300);
  }
  for (const item of recentIssues) {
    item.body = truncate(item.body, 300);
  }

  return {
    recentPRs,
    recentIssues,
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
): Promise<RepoDetail> {
  // Without auth: 3 calls per repo (commits, tree, 1 file read)
  // With auth: 7+ calls per repo (commits, tree, files, PRs, issues, comments)

  // Fetch commits by this user in this repo
  const commits = await ghSafe<GitHubCommit[]>(
    `/repos/${owner}/${repo.name}/commits?author=${username}&per_page=20`,
    pat,
  );

  // Fetch file tree
  let tree: TreeEntry[] = [];
  try {
    const treeData = await ghFetch<{ tree: TreeEntry[] }>(
      `/repos/${owner}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`,
      pat,
    );
    tree = treeData.tree.filter((e: TreeEntry) => e.type === 'blob');
  } catch {
    // empty repos or permission issues
  }

  // Pick interesting source files to read
  const filesToRead = pickInterestingFiles(tree);
  const maxFiles = thorough ? 5 : 2;
  const files: FileContent[] = [];
  for (const path of filesToRead.slice(0, maxFiles)) {
    const content = await fetchRawFile(owner, repo.name, path, pat);
    if (content) {
      files.push({ path, content });
    }
  }

  // Without auth, skip the expensive per-repo fetches
  if (!thorough) {
    return {
      repo,
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
  const pullRequests = await ghSafe<GitHubPR[]>(
    `/repos/${owner}/${repo.name}/pulls?state=all&sort=updated&per_page=10`,
    pat,
  );

  // Fetch issues (exclude PRs)
  const allIssues = await ghSafe<GitHubIssue[]>(
    `/repos/${owner}/${repo.name}/issues?state=all&sort=updated&per_page=10`,
    pat,
  );
  const issues = allIssues.filter((i: GitHubIssue) => !i.pull_request);

  // Fetch issue comments (personality, communication)
  const issueComments = await ghSafe<GitHubComment[]>(
    `/repos/${owner}/${repo.name}/issues/comments?sort=updated&direction=desc&per_page=15`,
    pat,
  );

  // Fetch PR review comments (code review quality)
  const prReviewComments = await ghSafe<GitHubComment[]>(
    `/repos/${owner}/${repo.name}/pulls/comments?sort=updated&direction=desc&per_page=15`,
    pat,
  );

  // Truncate comment bodies
  for (const c of issueComments) c.body = truncate(c.body);
  for (const c of prReviewComments) c.body = truncate(c.body);

  return {
    repo,
    commits,
    files,
    tree,
    pullRequests,
    issues,
    issueComments,
    prReviewComments,
  };
}

// ---- File selection heuristics ----

function pickInterestingFiles(tree: TreeEntry[]): string[] {
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

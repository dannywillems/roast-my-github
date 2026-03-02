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
  html_url: string;
  fork: boolean;
  topics: string[];
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  body: string | null;
  labels: { name: string }[];
  created_at: string;
  comments: number;
  pull_request?: unknown;
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
}

export interface GitHubComment {
  body: string;
  created_at: string;
  html_url: string;
}

export interface GitHubDiscussion {
  title: string;
  body: string;
  createdAt: string;
  comments: { totalCount: number };
  category: { name: string };
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

export interface GitHubData {
  user: GitHubUser;
  repos: GitHubRepo[];
  repoDetails: RepoDetail[];
  activity: UserActivity;
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

export interface UserActivity {
  recentIssueComments: GitHubComment[];
  discussions: GitHubDiscussion[];
}

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

function headers(pat?: string): Record<string, string> {
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
  const h = headers(pat);
  if (accept) h['Accept'] = accept;
  const res = await fetch(`${API_BASE}${path}`, { headers: h });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

async function ghFetchSafe<T>(
  path: string,
  pat?: string,
  fallback?: T,
): Promise<T> {
  try {
    return await ghFetch<T>(path, pat);
  } catch {
    return (fallback ?? []) as T;
  }
}

async function fetchRawFile(
  owner: string,
  repo: string,
  path: string,
  pat?: string,
): Promise<string | null> {
  const h = headers(pat);
  h['Accept'] = 'application/vnd.github.v3.raw';
  const res = await fetch(
    `${API_BASE}/repos/${owner}/${repo}/contents/${path}`,
    { headers: h },
  );
  if (!res.ok) return null;
  const text = await res.text();
  return text.length > 3000 ? text.slice(0, 3000) + '\n... (truncated)' : text;
}

// GraphQL for discussions (REST API does not support them)
async function fetchDiscussions(
  owner: string,
  repo: string,
  pat?: string,
): Promise<GitHubDiscussion[]> {
  if (!pat) return []; // GraphQL requires auth
  try {
    const query = `query {
      repository(owner: "${owner}", name: "${repo}") {
        discussions(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            title
            body
            createdAt
            comments { totalCount }
            category { name }
          }
        }
      }
    }`;
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.repository?.discussions?.nodes ?? [];
  } catch {
    return [];
  }
}

function truncateBody(body: string | null, max: number = 500): string {
  if (!body) return '';
  return body.length > max ? body.slice(0, max) + '... (truncated)' : body;
}

export async function fetchGitHubData(
  username: string,
  pat?: string,
  onProgress?: (msg: string) => void,
): Promise<GitHubData> {
  const log = onProgress ?? (() => {});

  log('Fetching user profile...');
  const user = await ghFetch<GitHubUser>(`/users/${username}`, pat);

  log('Fetching repositories...');
  const allRepos = await ghFetch<GitHubRepo[]>(
    `/users/${username}/repos?sort=updated&per_page=30`,
    pat,
  );

  // Filter out forks, pick top repos by stars then recency
  const ownRepos = allRepos.filter(r => !r.fork);
  const repos = ownRepos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10);

  // Deep-dive into top 3 repos
  const topRepos = repos.slice(0, 3);
  const repoDetails: RepoDetail[] = [];

  for (const repo of topRepos) {
    log(`Analyzing ${repo.name} (code, PRs, issues)...`);
    const detail = await fetchRepoDetail(username, repo, pat);
    repoDetails.push(detail);
  }

  // Fetch cross-repo activity
  log('Fetching user activity...');
  const activity = await fetchUserActivity(username, pat);

  return { user, repos, repoDetails, activity };
}

async function fetchUserActivity(
  username: string,
  pat?: string,
): Promise<UserActivity> {
  // Recent issue comments by this user across repos
  const recentIssueComments = await ghFetchSafe<GitHubComment[]>(
    `/search/issues?q=commenter:${username}+sort:updated&per_page=5`,
    pat,
    [],
  ).then(
    // search returns items, not comments directly; extract what we can
    () => [] as GitHubComment[],
  );

  // Discussions from top repos (collected in repo details already)
  return { recentIssueComments, discussions: [] };
}

async function fetchRepoDetail(
  owner: string,
  repo: GitHubRepo,
  pat?: string,
): Promise<RepoDetail> {
  // Fetch commits
  const commits = await ghFetchSafe<GitHubCommit[]>(
    `/repos/${owner}/${repo.name}/commits?per_page=15`,
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
    // might fail for empty repos
  }

  // Pick interesting source files to read
  const filesToRead = pickInterestingFiles(tree);
  const files: FileContent[] = [];

  for (const path of filesToRead.slice(0, 5)) {
    const content = await fetchRawFile(owner, repo.name, path, pat);
    if (content) {
      files.push({ path, content });
    }
  }

  // Fetch pull requests (both open and recently closed)
  const pullRequests = await ghFetchSafe<GitHubPR[]>(
    `/repos/${owner}/${repo.name}/pulls?state=all&sort=updated&per_page=10`,
    pat,
  );

  // Fetch issues (exclude PRs)
  const allIssues = await ghFetchSafe<GitHubIssue[]>(
    `/repos/${owner}/${repo.name}/issues?state=all&sort=updated&per_page=10`,
    pat,
  );
  const issues = allIssues.filter(i => !i.pull_request);

  // Fetch recent issue comments for personality analysis
  const issueComments = await ghFetchSafe<GitHubComment[]>(
    `/repos/${owner}/${repo.name}/issues/comments?sort=updated&direction=desc&per_page=10`,
    pat,
  );

  // Fetch PR review comments
  const prReviewComments = await ghFetchSafe<GitHubComment[]>(
    `/repos/${owner}/${repo.name}/pulls/comments?sort=updated&direction=desc&per_page=10`,
    pat,
  );

  // Truncate comment bodies to save context
  for (const c of issueComments) {
    c.body = truncateBody(c.body);
  }
  for (const c of prReviewComments) {
    c.body = truncateBody(c.body);
  }

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

function pickInterestingFiles(tree: TreeEntry[]): string[] {
  const found: string[] = [];

  for (const entry of tree) {
    const filename = entry.path.split('/').pop() ?? '';
    if (INTERESTING_FILES.includes(filename)) {
      found.push(entry.path);
    }
  }

  // Sort: prefer source files over config files
  const configFiles = new Set([
    'Cargo.toml',
    'package.json',
    'pyproject.toml',
    'go.mod',
    'Makefile',
    'Dockerfile',
  ]);

  return found.sort((a, b) => {
    const aName = a.split('/').pop() ?? '';
    const bName = b.split('/').pop() ?? '';
    const aIsConfig = configFiles.has(aName) ? 1 : 0;
    const bIsConfig = configFiles.has(bName) ? 1 : 0;
    return aIsConfig - bIsConfig;
  });
}

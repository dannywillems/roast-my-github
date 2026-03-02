// ---------------------------------------------------------------
// GitLab platform provider.
//
// Uses GitLab REST API v4 at https://gitlab.com/api/v4/.
// Maps all responses to normalized Platform types from types.ts.
//
// Auth: PRIVATE-TOKEN header with a personal access token.
// Rate limit: 10 req/sec unauthenticated.
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
  CrossRepoActivity,
  AnalysisMetadata,
  AnalyzedItem,
  AnalysisScope,
  RepoRelation,
} from './types';
import { defaultScope } from './types';

// ---- Internal API response interfaces ----

interface GLUser {
  id: number;
  username: string;
  name: string;
  bio: string | null;
  public_repos?: number;
  followers?: number;
  following?: number;
  created_at: string;
  avatar_url: string;
  web_url: string;
  organization: string | null;
  location: string | null;
  website_url: string | null;
}

interface GLProject {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string | null;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  last_activity_at: string;
  web_url: string;
  forked_from_project?: unknown;
  topics: string[];
  issues_enabled: boolean;
  license?: { key: string } | null;
  statistics?: { repository_size?: number } | null;
  namespace?: { kind: string };
}

interface GLCommit {
  id: string;
  message: string;
  author_name: string;
  authored_date: string;
  web_url: string;
}

interface GLMergeRequest {
  iid: number;
  title: string;
  state: string;
  description: string | null;
  created_at: string;
  merged_at: string | null;
  web_url: string;
  user_notes_count: number;
}

interface GLIssue {
  iid: number;
  title: string;
  state: string;
  description: string | null;
  labels: string[];
  created_at: string;
  updated_at: string;
  user_notes_count: number;
  web_url: string;
}

interface GLNote {
  body: string;
  created_at: string;
  author: { username: string };
  noteable_type: string;
}

interface GLEvent {
  action_name: string;
  target_type: string | null;
  target_title: string | null;
  created_at: string;
  project_id: number;
  push_data?: {
    commit_count?: number;
    ref?: string;
  };
}

interface GLTreeEntry {
  path: string;
  type: string;
  size?: number;
}

interface GLGroup {
  full_path: string;
  description: string | null;
}

// ---- Constants ----

const API_BASE = 'https://gitlab.com/api/v4';
const MAX_FILE_CONTENT_LENGTH = 3000;
const MAX_BODY_TRUNCATE_LENGTH = 500;
const MAX_CROSS_REPO_BODY_LENGTH = 300;
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
  '.gitlab-ci.yml',
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
  const remaining = res.headers.get('ratelimit-remaining');
  const limit = res.headers.get('ratelimit-limit');
  const reset = res.headers.get('ratelimit-reset');
  if (remaining !== null) _rateLimitRemaining = parseInt(remaining);
  if (limit !== null) _rateLimitTotal = parseInt(limit);
  if (reset !== null) {
    _rateLimitReset = new Date(parseInt(reset) * 1000).toLocaleTimeString();
  }
}

// ---- HTTP helpers ----

function makeHeaders(pat?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (pat) h['PRIVATE-TOKEN'] = pat;
  return h;
}

async function glFetch<T>(path: string, pat?: string): Promise<T> {
  const h = makeHeaders(pat);
  const res = await fetch(`${API_BASE}${path}`, { headers: h });
  _apiCallsMade++;
  trackRateLimit(res);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`GitLab resource not found: ${path}`);
    }
    if (res.status === 403 || res.status === 429) {
      throw new Error(
        `GitLab API rate limited or forbidden: ${path}. ` +
          'Try adding a GitLab personal access token.',
      );
    }
    throw new Error(`GitLab API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

async function glSafe<T>(path: string, pat?: string): Promise<T> {
  try {
    return await glFetch<T>(path, pat);
  } catch {
    return [] as unknown as T;
  }
}

async function fetchRawFile(
  projectId: number,
  filePath: string,
  ref: string,
  pat?: string,
): Promise<string | null> {
  const encodedPath = encodeURIComponent(filePath);
  const h = makeHeaders(pat);
  try {
    const res = await fetch(
      `${API_BASE}/projects/${projectId}/repository/files/${encodedPath}/raw?ref=${ref}`,
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
    if (entry.path.includes('.gitlab-ci')) {
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

function mapUser(gl: GLUser): PlatformUser {
  return {
    platform: 'gitlab',
    login: gl.username,
    name: gl.name || null,
    bio: gl.bio || null,
    publicRepos: gl.public_repos ?? 0,
    followers: gl.followers ?? 0,
    following: gl.following ?? 0,
    createdAt: gl.created_at,
    avatarUrl: gl.avatar_url,
    profileUrl: gl.web_url,
    company: gl.organization || null,
    location: gl.location || null,
    website: gl.website_url || null,
  };
}

function mapProject(p: GLProject): PlatformRepo {
  return {
    platform: 'gitlab',
    name: p.name,
    fullName: p.path_with_namespace,
    description: p.description,
    language: null,
    stars: p.star_count,
    forks: p.forks_count,
    openIssues: p.open_issues_count ?? 0,
    defaultBranch: p.default_branch || 'main',
    updatedAt: p.last_activity_at,
    pushedAt: p.last_activity_at,
    url: p.web_url,
    fork: !!p.forked_from_project,
    topics: p.topics ?? [],
    hasIssues: p.issues_enabled ?? true,
    license: p.license?.key ?? null,
    size: p.statistics?.repository_size ?? 0,
  };
}

function mapCommit(c: GLCommit, projectUrl: string): PlatformCommit {
  return {
    platform: 'gitlab',
    sha: c.id,
    message: c.message,
    authorName: c.author_name,
    authorDate: c.authored_date,
    url: c.web_url || `${projectUrl}/-/commit/${c.id}`,
  };
}

function mapMergeRequest(mr: GLMergeRequest, projectUrl: string): PlatformPR {
  return {
    platform: 'gitlab',
    number: mr.iid,
    title: mr.title,
    state: mr.state,
    body: truncate(mr.description),
    createdAt: mr.created_at,
    mergedAt: mr.merged_at,
    additions: 0,
    deletions: 0,
    changedFiles: 0,
    comments: mr.user_notes_count ?? 0,
    reviewComments: 0,
    url: mr.web_url || `${projectUrl}/-/merge_requests/${mr.iid}`,
  };
}

function mapIssue(issue: GLIssue, projectFullName: string): PlatformIssue {
  return {
    platform: 'gitlab',
    number: issue.iid,
    title: issue.title,
    state: issue.state,
    body: truncate(issue.description),
    labels: issue.labels ?? [],
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    comments: issue.user_notes_count ?? 0,
    url: issue.web_url,
    repoFullName: projectFullName,
    isPullRequest: false,
  };
}

function mapNote(note: GLNote, projectUrl: string): PlatformComment {
  return {
    platform: 'gitlab',
    body: truncate(note.body),
    createdAt: note.created_at,
    url: projectUrl,
    authorLogin: note.author?.username ?? 'unknown',
  };
}

function mapEvent(
  ev: GLEvent,
  projectNameById: Map<number, string>,
): PlatformEvent {
  const repoName =
    projectNameById.get(ev.project_id) ?? `project/${ev.project_id}`;
  const eventType = [ev.action_name, ev.target_type].filter(Boolean).join('_');
  return {
    platform: 'gitlab',
    type: eventType || 'unknown',
    repoName,
    createdAt: ev.created_at,
    payload: {
      action_name: ev.action_name,
      target_type: ev.target_type,
      target_title: ev.target_title,
      push_data: ev.push_data,
    },
  };
}

function mapGroup(g: GLGroup): PlatformOrg {
  return {
    platform: 'gitlab',
    login: g.full_path,
    description: g.description,
  };
}

// ---- Deep dive helpers ----

function daysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function pickDeepDiveProjects(
  projects: GLProject[],
  maxCount: number,
): GLProject[] {
  // Sort by last_activity_at descending, pick top N.
  const sorted = [...projects].sort((a, b) => {
    const dateA = new Date(a.last_activity_at).getTime();
    const dateB = new Date(b.last_activity_at).getTime();
    return dateB - dateA;
  });
  return sorted.slice(0, maxCount);
}

// ---- Single project deep dive ----

async function fetchProjectDetail(
  project: GLProject,
  mapped: PlatformRepo,
  username: string,
  pat: string | undefined,
  hasAuth: boolean,
  scope: AnalysisScope,
  analyzed: AnalyzedItem[],
): Promise<PlatformRepoDetail> {
  const pid = project.id;
  const projectUrl = project.web_url;

  // Fetch commits
  const commits: PlatformCommit[] = [];
  if (scope.commitMessages) {
    const glCommits = await glSafe<GLCommit[]>(
      `/projects/${pid}/repository/commits?per_page=20`,
      pat,
    );
    for (const c of glCommits) {
      const mc = mapCommit(c, projectUrl);
      commits.push(mc);
      analyzed.push({
        platform: 'gitlab',
        label: `Commit: ${c.message.split('\n')[0].slice(0, MAX_COMMIT_LABEL_LENGTH)}`,
        url: mc.url,
        type: 'commit',
      });
    }
  }

  // Fetch tree
  let tree: PlatformTreeEntry[] = [];
  if (scope.sourceCode) {
    const glTree = await glSafe<GLTreeEntry[]>(
      `/projects/${pid}/repository/tree?recursive=true&per_page=100`,
      pat,
    );
    tree = (glTree ?? []).map(e => ({
      path: e.path,
      type: e.type === 'blob' ? 'blob' : 'tree',
      size: e.size,
    }));
  }

  // Pick and fetch interesting files
  const files: PlatformFile[] = [];
  if (scope.sourceCode) {
    const blobEntries = tree.filter(e => e.type === 'blob');
    const filesToRead = pickInterestingFiles(blobEntries);
    const maxFiles = hasAuth ? 5 : 2;
    for (const fp of filesToRead.slice(0, maxFiles)) {
      const content = await fetchRawFile(
        pid,
        fp,
        project.default_branch || 'main',
        pat,
      );
      if (content) {
        files.push({ path: fp, content });
        analyzed.push({
          platform: 'gitlab',
          label: `File: ${mapped.fullName}/${fp}`,
          url: `${projectUrl}/-/blob/${project.default_branch || 'main'}/${fp}`,
          type: 'file',
        });
      }
    }
  }

  // Fetch merge requests
  const pullRequests: PlatformPR[] = [];
  if (scope.pullRequests) {
    const mrs = await glSafe<GLMergeRequest[]>(
      `/projects/${pid}/merge_requests?state=all&per_page=10`,
      pat,
    );
    for (const mr of mrs) {
      const mpr = mapMergeRequest(mr, projectUrl);
      pullRequests.push(mpr);
      analyzed.push({
        platform: 'gitlab',
        label: `MR !${mr.iid}: ${mr.title}`,
        url: mpr.url,
        type: 'pr',
      });
    }
  }

  // Fetch issues
  const issues: PlatformIssue[] = [];
  if (scope.issues) {
    const glIssues = await glSafe<GLIssue[]>(
      `/projects/${pid}/issues?state=all&per_page=10`,
      pat,
    );
    for (const issue of glIssues) {
      const mi = mapIssue(issue, mapped.fullName);
      issues.push(mi);
      analyzed.push({
        platform: 'gitlab',
        label: `Issue #${issue.iid}: ${issue.title}`,
        url: mi.url,
        type: 'issue',
      });
    }
  }

  // Fetch MR notes (comments on merge requests)
  const prReviewComments: PlatformComment[] = [];
  if (scope.commentsReviews && pullRequests.length > 0) {
    // Fetch notes for up to 3 recent MRs to limit API calls
    const mrsToFetch = pullRequests.slice(0, 3);
    for (const mr of mrsToFetch) {
      const notes = await glSafe<GLNote[]>(
        `/projects/${pid}/merge_requests/${mr.number}/notes?per_page=15`,
        pat,
      );
      for (const n of notes) {
        prReviewComments.push(mapNote(n, mr.url));
      }
    }
    for (const c of prReviewComments.slice(
      0,
      MAX_TRACKED_COMMENTS_PER_CATEGORY,
    )) {
      analyzed.push({
        platform: 'gitlab',
        label: `MR comment by @${c.authorLogin}`,
        url: c.url,
        type: 'comment',
      });
    }
  }

  // Fetch issue notes
  const issueComments: PlatformComment[] = [];
  if (scope.commentsReviews && issues.length > 0) {
    const issuesToFetch = issues.slice(0, 3);
    for (const issue of issuesToFetch) {
      const notes = await glSafe<GLNote[]>(
        `/projects/${pid}/issues/${issue.number}/notes?per_page=15`,
        pat,
      );
      for (const n of notes) {
        issueComments.push(mapNote(n, issue.url));
      }
    }
    for (const c of issueComments.slice(0, MAX_TRACKED_COMMENTS_PER_CATEGORY)) {
      analyzed.push({
        platform: 'gitlab',
        label: `Issue comment by @${c.authorLogin}`,
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
    prReviewComments,
  };
}

// ---- Main entry point ----

async function fetchGitLabData(
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

  // Phase 1: Resolve user by username.
  // GitLab user search returns an array; take the first match.
  log('Fetching GitLab profile...');
  const userResults = await glFetch<GLUser[]>(
    `/users?username=${encodeURIComponent(username)}`,
    pat,
  );
  if (!userResults || userResults.length === 0) {
    throw new Error(`GitLab user not found: ${username}`);
  }
  const glUser = userResults[0];
  const userId = glUser.id;
  const user = mapUser(glUser);

  analyzed.push({
    platform: 'gitlab',
    label: `Profile: ${username}`,
    url: glUser.web_url,
    type: 'profile',
  });

  // Phase 2: Fetch projects sorted by last activity.
  log('Fetching GitLab projects...');
  const projects = await glSafe<GLProject[]>(
    `/users/${userId}/projects?order_by=last_activity_at&per_page=30`,
    pat,
  );

  const allRepos = projects.map(mapProject);
  const ownedRepos = allRepos.filter(r => !r.fork);
  const forkedRepos = allRepos.filter(r => r.fork);

  // Update public repo count from actual project list if the user
  // endpoint did not provide it.
  if (user.publicRepos === 0) {
    user.publicRepos = allRepos.length;
  }

  for (const r of ownedRepos.slice(0, MAX_OWNED_REPOS_IN_OVERVIEW)) {
    analyzed.push({
      platform: 'gitlab',
      label: `Owned: ${r.fullName}`,
      url: r.url,
      type: 'repo',
    });
  }
  for (const r of forkedRepos.slice(0, MAX_FORKED_REPOS_IN_OVERVIEW)) {
    analyzed.push({
      platform: 'gitlab',
      label: `Fork: ${r.fullName}`,
      url: r.url,
      type: 'repo',
    });
  }

  // Phase 3: Fetch events.
  let events: PlatformEvent[] = [];
  if (s.recentActivity) {
    log('Fetching GitLab events...');
    const glEvents = await glSafe<GLEvent[]>(
      `/users/${userId}/events?per_page=100`,
      pat,
    );
    // Build a lookup from project id to name for event mapping.
    const projectNameById = new Map<number, string>();
    for (const p of projects) {
      projectNameById.set(p.id, p.path_with_namespace);
    }
    events = (glEvents ?? []).map(ev => mapEvent(ev, projectNameById));
  }

  // Phase 4: Fetch groups (organizations).
  log('Fetching GitLab groups...');
  const groups = await glSafe<GLGroup[]>(`/users/${userId}/memberships`, pat);
  // memberships endpoint may not return groups for unauthenticated calls.
  // Fall back to an empty array.
  const orgs: PlatformOrg[] = Array.isArray(groups) ? groups.map(mapGroup) : [];

  // Phase 5: Deep dives into top projects.
  const deepDiveProjects = pickDeepDiveProjects(projects, maxDeepDives);
  const repoDetails: PlatformRepoDetail[] = [];

  for (const project of deepDiveProjects) {
    const mapped = mapProject(project);
    const relation = mapped.fork ? 'forked' : 'owned';
    log(
      `Analyzing ${mapped.fullName} [${relation}] (code, MRs, issues, comments)...`,
    );
    const detail = await fetchProjectDetail(
      project,
      mapped,
      username,
      pat,
      hasAuth,
      s,
      analyzed,
    );
    repoDetails.push(detail);
  }

  // Phase 6: Cross-repo activity.
  // GitLab does not offer a search API for unauthenticated users,
  // so cross-repo data is limited.
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
    platform: 'gitlab',
    user,
    orgs,
    events,
    ownedRepos: ownedRepos.slice(0, MAX_OWNED_REPOS_IN_OVERVIEW),
    forkedRepos: forkedRepos.slice(0, MAX_FORKED_REPOS_IN_OVERVIEW),
    contributedRepoNames: [],
    repoDetails,
    crossRepoActivity,
    metadata,
  };
}

// ---- Exported provider ----

export const gitlabProvider: PlatformProvider = {
  id: 'gitlab',
  name: 'GitLab',
  fetchData: fetchGitLabData,
};

import { describe, it, expect } from 'vitest';
import {
  truncate,
  daysSince,
  extractActiveRepos,
  pickDeepDiveRepos,
  pickInterestingFiles,
  defaultScope,
  type GitHubEvent,
  type GitHubRepo,
  type TreeEntry,
} from '../github.ts';

// ---- truncate ----

describe('truncate', () => {
  it('returns empty string for null', () => {
    expect(truncate(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(truncate('')).toBe('');
  });

  it('returns the string unchanged when under limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns the string unchanged when exactly at limit', () => {
    expect(truncate('12345', 5)).toBe('12345');
  });

  it('truncates and adds suffix when over limit', () => {
    const result = truncate('hello world', 5);
    expect(result).toBe('hello... (truncated)');
  });

  it('uses default max of 500', () => {
    const short = 'a'.repeat(500);
    expect(truncate(short)).toBe(short);

    const long = 'a'.repeat(501);
    expect(truncate(long)).toContain('... (truncated)');
    expect(truncate(long).length).toBe(500 + '... (truncated)'.length);
  });
});

// ---- daysSince ----

describe('daysSince', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString();
    expect(daysSince(today)).toBe(0);
  });

  it('returns correct days for past date', () => {
    const daysAgo = 10;
    const date = new Date(
      Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(daysSince(date)).toBe(daysAgo);
  });

  it('handles ISO date strings', () => {
    const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysSince(date)).toBe(5);
  });
});

// ---- extractActiveRepos ----

describe('extractActiveRepos', () => {
  it('returns empty map for no events', () => {
    const result = extractActiveRepos([], 'user');
    expect(result.size).toBe(0);
  });

  it('counts events per repo', () => {
    const events: GitHubEvent[] = [
      {
        type: 'PushEvent',
        repo: { name: 'user/repo-a' },
        created_at: '2024-01-01T00:00:00Z',
        payload: {},
      },
      {
        type: 'PushEvent',
        repo: { name: 'user/repo-a' },
        created_at: '2024-01-02T00:00:00Z',
        payload: {},
      },
      {
        type: 'IssuesEvent',
        repo: { name: 'user/repo-b' },
        created_at: '2024-01-03T00:00:00Z',
        payload: {},
      },
    ];
    const result = extractActiveRepos(events, 'user');
    expect(result.get('user/repo-a')).toBe(2);
    expect(result.get('user/repo-b')).toBe(1);
  });

  it('counts all event types', () => {
    const events: GitHubEvent[] = [
      {
        type: 'PullRequestEvent',
        repo: { name: 'org/lib' },
        created_at: '2024-01-01T00:00:00Z',
        payload: {},
      },
      {
        type: 'IssueCommentEvent',
        repo: { name: 'org/lib' },
        created_at: '2024-01-02T00:00:00Z',
        payload: {},
      },
    ];
    const result = extractActiveRepos(events, 'user');
    expect(result.get('org/lib')).toBe(2);
  });
});

// ---- pickDeepDiveRepos ----

function makeRepo(overrides: Partial<GitHubRepo>): GitHubRepo {
  return {
    name: 'test-repo',
    full_name: 'user/test-repo',
    description: null,
    language: 'TypeScript',
    stargazers_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    default_branch: 'main',
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
    html_url: 'https://github.com/user/test-repo',
    fork: false,
    topics: [],
    has_issues: true,
    has_wiki: true,
    license: null,
    size: 100,
    ...overrides,
  };
}

describe('pickDeepDiveRepos', () => {
  it('returns empty array for no repos', () => {
    const result = pickDeepDiveRepos([], [], new Map(), 5);
    expect(result).toEqual([]);
  });

  it('respects maxCount limit', () => {
    const repos = [
      makeRepo({ name: 'a', full_name: 'user/a' }),
      makeRepo({ name: 'b', full_name: 'user/b' }),
      makeRepo({ name: 'c', full_name: 'user/c' }),
    ];
    const result = pickDeepDiveRepos(repos, repos, new Map(), 2);
    expect(result.length).toBe(2);
  });

  it('prioritizes recently pushed repos', () => {
    const old = makeRepo({
      name: 'old',
      full_name: 'user/old',
      pushed_at: '2020-01-01T00:00:00Z',
      stargazers_count: 0,
    });
    const recent = makeRepo({
      name: 'recent',
      full_name: 'user/recent',
      pushed_at: new Date().toISOString(),
      stargazers_count: 0,
    });
    const repos = [old, recent];
    const result = pickDeepDiveRepos(repos, repos, new Map(), 1);
    expect(result[0].name).toBe('recent');
  });

  it('prioritizes repos with recent events', () => {
    const repoA = makeRepo({
      name: 'a',
      full_name: 'user/a',
      pushed_at: '2020-01-01T00:00:00Z',
      stargazers_count: 0,
    });
    const repoB = makeRepo({
      name: 'b',
      full_name: 'user/b',
      pushed_at: '2020-01-01T00:00:00Z',
      stargazers_count: 0,
    });
    const activity = new Map([['user/a', 20]]);
    const repos = [repoA, repoB];
    const result = pickDeepDiveRepos(repos, repos, activity, 1);
    expect(result[0].name).toBe('a');
  });

  it('deduplicates repos', () => {
    const repo = makeRepo({ name: 'a', full_name: 'user/a' });
    const repos = [repo];
    const activity = new Map([['user/a', 5]]);
    const result = pickDeepDiveRepos(repos, repos, activity, 5);
    expect(result.length).toBe(1);
  });

  it('includes contributed repos from events', () => {
    const owned = makeRepo({
      name: 'mine',
      full_name: 'user/mine',
    });
    const contributed = makeRepo({
      name: 'theirs',
      full_name: 'org/theirs',
    });
    const activity = new Map([['org/theirs', 10]]);
    const result = pickDeepDiveRepos(
      [owned],
      [owned, contributed],
      activity,
      5,
    );
    expect(result.some(r => r.full_name === 'org/theirs')).toBe(true);
  });
});

// ---- pickInterestingFiles ----

describe('pickInterestingFiles', () => {
  it('returns empty array for empty tree', () => {
    expect(pickInterestingFiles([])).toEqual([]);
  });

  it('picks known interesting files', () => {
    const tree: TreeEntry[] = [
      { path: 'src/main.rs', type: 'blob' },
      { path: 'README.md', type: 'blob' },
      { path: 'src/utils.rs', type: 'blob' },
      { path: 'Cargo.toml', type: 'blob' },
    ];
    const result = pickInterestingFiles(tree);
    expect(result).toContain('src/main.rs');
    expect(result).toContain('README.md');
    expect(result).toContain('Cargo.toml');
    // utils.rs is not in the interesting files list
    expect(result).not.toContain('src/utils.rs');
  });

  it('picks CI workflow files', () => {
    const tree: TreeEntry[] = [
      { path: '.github/workflows/test.yml', type: 'blob' },
    ];
    const result = pickInterestingFiles(tree);
    expect(result).toContain('.github/workflows/test.yml');
  });

  it('prioritizes source files over config files', () => {
    const tree: TreeEntry[] = [
      { path: 'Cargo.toml', type: 'blob' },
      { path: 'src/lib.rs', type: 'blob' },
      { path: 'package.json', type: 'blob' },
      { path: 'src/main.rs', type: 'blob' },
    ];
    const result = pickInterestingFiles(tree);
    // Source files should come before config files
    const libIdx = result.indexOf('src/lib.rs');
    const mainIdx = result.indexOf('src/main.rs');
    const cargoIdx = result.indexOf('Cargo.toml');
    const pkgIdx = result.indexOf('package.json');
    expect(libIdx).toBeLessThan(cargoIdx);
    expect(mainIdx).toBeLessThan(pkgIdx);
  });

  it('deduplicates files', () => {
    const tree: TreeEntry[] = [
      { path: '.github/workflows/ci.yml', type: 'blob' },
    ];
    const result = pickInterestingFiles(tree);
    const ciCount = result.filter(f => f === '.github/workflows/ci.yml').length;
    expect(ciCount).toBe(1);
  });
});

// ---- defaultScope ----

describe('defaultScope', () => {
  it('has all options enabled by default', () => {
    expect(defaultScope.recentActivity).toBe(true);
    expect(defaultScope.sourceCode).toBe(true);
    expect(defaultScope.pullRequests).toBe(true);
    expect(defaultScope.issues).toBe(true);
    expect(defaultScope.commentsReviews).toBe(true);
    expect(defaultScope.crossRepoContributions).toBe(true);
    expect(defaultScope.commitMessages).toBe(true);
  });
});

// ---------------------------------------------------------------
// Temporal analysis for multi-platform developer activity.
// Buckets activity into time windows and detects patterns.
// ---------------------------------------------------------------

import type {
  MultiPlatformData,
  PlatformData,
  PlatformId,
  PlatformInput,
} from './types';

// ---- Types ----

export interface ActivityWindow {
  commits: number;
  prs: number;
  issues: number;
  comments: number;
}

export interface RepoTimeline {
  repoFullName: string;
  platform: PlatformId;
  firstCommitDate: string | null;
  lastCommitDate: string | null;
  totalCommits: number;
  totalPRs: number;
  daySpan: number;
  isRecentlyActive: boolean;
}

export type ActivityPattern =
  | 'consistent'
  | 'burst'
  | 'declining'
  | 'growing'
  | 'inactive';

export interface TemporalSummary {
  accountAgeDays: number;
  firstActivityDate: string | null;
  lastActivityDate: string | null;
  last30Days: ActivityWindow;
  last90Days: ActivityWindow;
  last365Days: ActivityWindow;
  olderThan365Days: ActivityWindow;
  repoTimelines: RepoTimeline[];
  pattern: ActivityPattern;
  patternDescription: string;
}

// ---- Helpers ----

const MS_PER_DAY = 86_400_000;

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  if (Number.isNaN(then)) return Infinity;
  return Math.max(0, Math.floor((now - then) / MS_PER_DAY));
}

function emptyWindow(): ActivityWindow {
  return { commits: 0, prs: 0, issues: 0, comments: 0 };
}

function windowTotal(w: ActivityWindow): number {
  return w.commits + w.prs + w.issues + w.comments;
}

function minDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function maxDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

type BucketKey = 'last30' | 'last90' | 'last365' | 'older';

function bucketForDate(dateStr: string): BucketKey {
  const days = daysSince(dateStr);
  if (days <= 30) return 'last30';
  if (days <= 90) return 'last90';
  if (days <= 365) return 'last365';
  return 'older';
}

// ---- Dated item collection ----

interface DatedItem {
  date: string;
  kind: 'commit' | 'pr' | 'issue' | 'comment' | 'event';
  repoFullName?: string;
}

function collectDatedItems(platformData: PlatformData): DatedItem[] {
  const items: DatedItem[] = [];

  // Events
  for (const ev of platformData.events) {
    items.push({
      date: ev.createdAt,
      kind: 'event',
      repoFullName: ev.repoName,
    });
  }

  // Per-repo details
  for (const detail of platformData.repoDetails) {
    const repoName = detail.repo.fullName;

    for (const c of detail.commits) {
      items.push({
        date: c.authorDate,
        kind: 'commit',
        repoFullName: repoName,
      });
    }
    for (const pr of detail.pullRequests) {
      items.push({ date: pr.createdAt, kind: 'pr', repoFullName: repoName });
    }
    for (const iss of detail.issues) {
      if (!iss.isPullRequest) {
        items.push({
          date: iss.createdAt,
          kind: 'issue',
          repoFullName: repoName,
        });
      }
    }
    for (const cm of detail.issueComments) {
      items.push({
        date: cm.createdAt,
        kind: 'comment',
        repoFullName: repoName,
      });
    }
    for (const cm of detail.prReviewComments) {
      items.push({
        date: cm.createdAt,
        kind: 'comment',
        repoFullName: repoName,
      });
    }
  }

  // Cross-repo PRs and issues
  for (const pr of platformData.crossRepoActivity.recentPRs) {
    items.push({
      date: pr.createdAt,
      kind: 'pr',
      repoFullName: pr.repoFullName,
    });
  }
  for (const iss of platformData.crossRepoActivity.recentIssues) {
    if (!iss.isPullRequest) {
      items.push({
        date: iss.createdAt,
        kind: 'issue',
        repoFullName: iss.repoFullName,
      });
    }
  }

  return items;
}

// ---- Pattern detection ----

function detectPattern(
  last30: ActivityWindow,
  last90: ActivityWindow,
  last365: ActivityWindow,
  older: ActivityWindow,
): { pattern: ActivityPattern; patternDescription: string } {
  const t30 = windowTotal(last30);
  const t90 = windowTotal(last90);
  const t365 = windowTotal(last365);
  const tOlder = windowTotal(older);
  const total = t30 + t90 + t365 + tOlder;

  if (total === 0) {
    return {
      pattern: 'inactive',
      patternDescription: 'No recorded activity across any time window',
    };
  }

  const recentTotal = t30 + t90;

  // Inactive: very little in last 90 days
  if (recentTotal <= 3 && total > 10) {
    return {
      pattern: 'inactive',
      patternDescription:
        'Very little recent activity despite historical contributions',
    };
  }
  if (total <= 3) {
    return {
      pattern: 'inactive',
      patternDescription: 'Minimal overall activity detected',
    };
  }

  // Normalize to per-day rates for fair comparison.
  // Each bucket covers only its own span, not cumulative.
  const rate30 = t30 / 30;
  const rate90 = t90 / 60; // days 31-90
  const rate365 = t365 / 275; // days 91-365
  const rateOlder = tOlder > 0 ? tOlder / 365 : 0; // rough estimate

  // Burst: last 30 days rate is much higher than the rest
  if (rate30 > 0 && rate90 + rate365 + rateOlder > 0) {
    const avgOther =
      (rate90 + rate365 + rateOlder) /
      [rate90, rate365, rateOlder].filter(r => r > 0).length;
    if (rate30 > avgOther * 3) {
      return {
        pattern: 'burst',
        patternDescription:
          'High burst of activity in the last 30 days compared to prior periods',
      };
    }
  }

  // Growing: recent rates consistently higher than older rates
  if (rate30 >= rate90 && rate90 >= rate365 && rate30 > rate365 * 1.5) {
    return {
      pattern: 'growing',
      patternDescription:
        'Activity has been increasing over time with recent periods more active',
    };
  }

  // Declining: older rates higher than recent rates
  if (
    rateOlder > 0 &&
    rate365 > rate90 &&
    rate90 > rate30 &&
    rateOlder > rate30 * 1.5
  ) {
    return {
      pattern: 'declining',
      patternDescription:
        'Activity has been decreasing over time with older periods more active',
    };
  }

  // Consistent: activity is spread fairly evenly
  return {
    pattern: 'consistent',
    patternDescription: 'Regular activity across all time periods',
  };
}

// ---- Per-repo timeline ----

function buildRepoTimelines(
  allItems: DatedItem[],
  platformId: PlatformId,
): RepoTimeline[] {
  const repoMap = new Map<
    string,
    {
      commits: string[];
      prs: number;
    }
  >();

  for (const item of allItems) {
    if (!item.repoFullName) continue;
    let entry = repoMap.get(item.repoFullName);
    if (!entry) {
      entry = { commits: [], prs: 0 };
      repoMap.set(item.repoFullName, entry);
    }
    if (item.kind === 'commit') {
      entry.commits.push(item.date);
    }
    if (item.kind === 'pr') {
      entry.prs += 1;
    }
  }

  const timelines: RepoTimeline[] = [];

  for (const [repoFullName, entry] of repoMap) {
    const sorted = entry.commits.slice().sort();
    const firstCommitDate = sorted.length > 0 ? sorted[0] : null;
    const lastCommitDate = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    let daySpan = 0;
    if (firstCommitDate && lastCommitDate) {
      const first = new Date(firstCommitDate).getTime();
      const last = new Date(lastCommitDate).getTime();
      daySpan = Math.max(0, Math.floor((last - first) / MS_PER_DAY));
    }

    const lastActivityDate = lastCommitDate;
    const isRecentlyActive = lastActivityDate
      ? daysSince(lastActivityDate) < 90
      : false;

    timelines.push({
      repoFullName,
      platform: platformId,
      firstCommitDate,
      lastCommitDate,
      totalCommits: entry.commits.length,
      totalPRs: entry.prs,
      daySpan,
      isRecentlyActive,
    });
  }

  // Sort by total commits descending
  timelines.sort((a, b) => b.totalCommits - a.totalCommits);

  return timelines;
}

// ---- Main computation ----

export function computeTemporalSummary(
  data: MultiPlatformData,
): TemporalSummary {
  const last30 = emptyWindow();
  const last90 = emptyWindow();
  const last365 = emptyWindow();
  const older = emptyWindow();

  const buckets: Record<BucketKey, ActivityWindow> = {
    last30,
    last90,
    last365,
    older,
  };

  let firstActivity: string | null = null;
  let lastActivity: string | null = null;
  let earliestAccountDate: string | null = null;
  const allTimelines: RepoTimeline[] = [];

  for (const platformData of data.platforms) {
    // Track account creation date
    if (platformData.user.createdAt) {
      earliestAccountDate = minDate(
        earliestAccountDate,
        platformData.user.createdAt,
      );
    }

    const items = collectDatedItems(platformData);

    for (const item of items) {
      firstActivity = minDate(firstActivity, item.date);
      lastActivity = maxDate(lastActivity, item.date);

      const bucket = buckets[bucketForDate(item.date)];
      switch (item.kind) {
        case 'commit':
          bucket.commits += 1;
          break;
        case 'pr':
          bucket.prs += 1;
          break;
        case 'issue':
          bucket.issues += 1;
          break;
        case 'comment':
          bucket.comments += 1;
          break;
        case 'event':
          // Events are not bucketed into a specific category;
          // they are used only for date range tracking.
          break;
      }
    }

    const timelines = buildRepoTimelines(items, platformData.platform);
    allTimelines.push(...timelines);
  }

  const accountAgeDays = earliestAccountDate
    ? daysSince(earliestAccountDate)
    : 0;

  const { pattern, patternDescription } = detectPattern(
    last30,
    last90,
    last365,
    older,
  );

  return {
    accountAgeDays,
    firstActivityDate: firstActivity,
    lastActivityDate: lastActivity,
    last30Days: last30,
    last90Days: last90,
    last365Days: last365,
    olderThan365Days: older,
    repoTimelines: allTimelines,
    pattern,
    patternDescription,
  };
}

// ---- Formatting helpers ----

function formatDuration(days: number): string {
  if (days < 1) return '0d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = Math.floor(days / 365);
  const remaining = Math.floor((days % 365) / 30);
  if (remaining === 0) return `${years}y`;
  return `${years}y ${remaining}mo`;
}

function formatAccountAge(days: number): string {
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const yStr = years === 1 ? '1 year' : `${years} years`;
  if (months === 0) return yStr;
  const mStr = months === 1 ? '1 month' : `${months} months`;
  return `${yStr}, ${mStr}`;
}

function formatWindow(label: string, w: ActivityWindow): string {
  return (
    `${label}: ${w.commits} commits, ${w.prs} PRs, ` +
    `${w.issues} issues, ${w.comments} comments`
  );
}

function formatRepoTimeline(t: RepoTimeline): string {
  const parts: string[] = [];
  parts.push(`${t.totalCommits} commits`);
  if (t.totalPRs > 0) {
    parts.push(`${t.totalPRs} PRs`);
  }
  if (t.daySpan > 0) {
    parts.push(`over ${formatDuration(t.daySpan)}`);
  }
  if (t.lastCommitDate) {
    const ago = daysSince(t.lastCommitDate);
    parts.push(`last active ${formatDuration(ago)} ago`);
    if (!t.isRecentlyActive) {
      parts.push('(STALE)');
    }
  }
  return `- ${t.platform}/${t.repoFullName}: ${parts.join(', ')}`;
}

// ---- Public formatting function ----

export function formatTemporalHeader(
  summary: TemporalSummary,
  platformInputs: PlatformInput[],
): string {
  const lines: string[] = [];

  // Header
  lines.push('# Temporal Context');

  const today = new Date().toISOString().slice(0, 10);
  lines.push(`Analysis date: ${today}`);

  // Platform list
  const platformList = platformInputs
    .map(
      p =>
        `${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)} (@${p.username})`,
    )
    .join(', ');
  lines.push(`Platforms: ${platformList}`);
  lines.push('');

  // Account age
  lines.push(`Account age: ${formatAccountAge(summary.accountAgeDays)}`);

  // Pattern
  lines.push(
    `Activity pattern: ${summary.pattern} - ${summary.patternDescription}`,
  );

  // Time windows
  lines.push(formatWindow('Last 30 days', summary.last30Days));
  lines.push(formatWindow('Last 90 days', summary.last90Days));
  lines.push(formatWindow('Last 365 days', summary.last365Days));
  lines.push(formatWindow('Older', summary.olderThan365Days));

  // Per-repo timelines
  if (summary.repoTimelines.length > 0) {
    lines.push('');
    lines.push('## Per-Repository Temporal Context');
    for (const t of summary.repoTimelines) {
      lines.push(formatRepoTimeline(t));
    }
  }

  return lines.join('\n');
}

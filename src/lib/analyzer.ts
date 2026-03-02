import {
  fetchGitHubData,
  type GitHubData,
  type GitHubEvent,
} from './github.ts';
import { anthropicProvider } from './providers/anthropic.ts';
import { openaiProvider } from './providers/openai.ts';
import { geminiProvider } from './providers/gemini.ts';
import type { LLMProvider, ProviderId } from './providers/types.ts';
import { tones, buildSystemPrompt, type Tone } from './prompts.ts';

export interface AnalysisCallbacks {
  onProgress: (msg: string) => void;
  onChunk: (text: string) => void;
  onError: (err: string) => void;
  onDone: () => void;
}

const providers: Record<ProviderId, LLMProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

function buildUserMessage(data: GitHubData): string {
  const parts: string[] = [];

  // ---- Profile ----
  const u = data.user;
  parts.push(`# GitHub Profile: ${u.login}`);
  parts.push(`Name: ${u.name ?? 'not set'}`);
  parts.push(`Bio: ${u.bio ?? 'not set'}`);
  parts.push(`Company: ${u.company ?? 'not set'}`);
  parts.push(`Location: ${u.location ?? 'not set'}`);
  parts.push(`Blog/Website: ${u.blog || 'not set'}`);
  parts.push(`Hireable: ${u.hireable ?? 'not specified'}`);
  parts.push(`Public repos: ${u.public_repos}`);
  parts.push(`Followers: ${u.followers}, Following: ${u.following}`);
  parts.push(`Account created: ${u.created_at}`);
  parts.push('');

  // ---- Organizations ----
  if (data.orgs.length > 0) {
    parts.push('# Organizations');
    for (const org of data.orgs) {
      parts.push(`- ${org.login}: ${org.description ?? 'no description'}`);
    }
    parts.push('');
  }

  // ---- Recent activity summary (events) ----
  if (data.recentEvents.length > 0) {
    parts.push('# Recent Activity (last 90 days, from events feed)');
    const summary = summarizeEvents(data.recentEvents);
    parts.push(summary);
    parts.push('');
  }

  // ---- Cross-repo contributions ----
  const xr = data.crossRepoActivity;

  if (xr.recentCommitRepos.length > 0) {
    parts.push('# Repos with recent commits (across all of GitHub)');
    for (const r of xr.recentCommitRepos) {
      parts.push(`- ${r}`);
    }
    parts.push('');
  }

  if (xr.recentPRs.length > 0) {
    parts.push('# Recent Pull Requests (across all repos)');
    for (const pr of xr.recentPRs) {
      const repo = pr.repository_url.replace(
        'https://api.github.com/repos/',
        '',
      );
      parts.push(`- [${pr.state}] ${repo}: ${pr.title} (${pr.created_at})`);
      if (pr.body) {
        parts.push(`  ${pr.body}`);
      }
    }
    parts.push('');
  }

  if (xr.recentIssues.length > 0) {
    parts.push('# Recent Issues (across all repos)');
    for (const issue of xr.recentIssues) {
      const repo = issue.repository_url.replace(
        'https://api.github.com/repos/',
        '',
      );
      const labels = issue.labels.map(l => l.name).join(', ');
      parts.push(
        `- [${issue.state}] ${repo}: ${issue.title}` +
          (labels ? ` (${labels})` : '') +
          ` - ${issue.comments} comments`,
      );
      if (issue.body) {
        parts.push(`  ${issue.body}`);
      }
    }
    parts.push('');
  }

  // ---- Owned repos overview ----
  parts.push('# Owned Repositories (sorted by recent activity)');
  for (const r of data.ownedRepos) {
    const lang = r.language ?? 'unknown';
    const stars = r.stargazers_count;
    const desc = r.description ?? 'no description';
    const pushed = r.pushed_at.slice(0, 10);
    const license = r.license?.spdx_id ?? 'no license';
    parts.push(
      `- ${r.name} [${lang}] ${stars} stars, ` +
        `last pushed ${pushed}, ${license}: ${desc}`,
    );
    if (r.topics.length > 0) {
      parts.push(`  Topics: ${r.topics.join(', ')}`);
    }
  }
  parts.push('');

  // ---- Deep dives ----
  for (const detail of data.repoDetails) {
    const r = detail.repo;
    parts.push(`# Deep Dive: ${r.full_name}`);
    parts.push(`Language: ${r.language ?? 'unknown'}`);
    parts.push(
      `Stars: ${r.stargazers_count}, Forks: ${r.forks_count}, ` +
        `Size: ${r.size}KB`,
    );
    parts.push(`Last pushed: ${r.pushed_at}`);
    parts.push('');

    // File tree
    if (detail.tree.length > 0) {
      parts.push('## File structure (first 60 files)');
      for (const entry of detail.tree.slice(0, 60)) {
        parts.push(`  ${entry.path}`);
      }
      if (detail.tree.length > 60) {
        parts.push(`  ... and ${detail.tree.length - 60} more files`);
      }
      parts.push('');
    }

    // Commits by this user
    if (detail.commits.length > 0) {
      parts.push('## Recent commits by this user');
      for (const c of detail.commits) {
        const msg = c.commit.message.split('\n')[0];
        const date = c.commit.author.date.slice(0, 10);
        parts.push(`  - [${date}] ${msg}`);
      }
      parts.push('');
    }

    // Source files
    if (detail.files.length > 0) {
      parts.push('## Source files');
      for (const f of detail.files) {
        parts.push(`### ${f.path}`);
        parts.push('```');
        parts.push(f.content);
        parts.push('```');
        parts.push('');
      }
    }

    // Pull requests
    if (detail.pullRequests.length > 0) {
      parts.push('## Pull Requests');
      for (const pr of detail.pullRequests) {
        const merged = pr.merged_at ? 'merged' : pr.state;
        parts.push(
          `- #${pr.number} [${merged}] ${pr.title}` +
            ` (+${pr.additions}/-${pr.deletions}, ` +
            `${pr.changed_files} files, ` +
            `${pr.review_comments} review comments)`,
        );
        if (pr.body) {
          const body =
            pr.body.length > 300 ? pr.body.slice(0, 300) + '...' : pr.body;
          parts.push(`  Description: ${body}`);
        }
      }
      parts.push('');
    }

    // Issues
    if (detail.issues.length > 0) {
      parts.push('## Issues');
      for (const issue of detail.issues) {
        const labels = issue.labels.map(l => l.name).join(', ');
        parts.push(
          `- #${issue.number} [${issue.state}] ${issue.title}` +
            (labels ? ` (${labels})` : '') +
            ` - ${issue.comments} comments`,
        );
        if (issue.body) {
          const body =
            issue.body.length > 300
              ? issue.body.slice(0, 300) + '...'
              : issue.body;
          parts.push(`  Body: ${body}`);
        }
      }
      parts.push('');
    }

    // Issue comments (communication style)
    if (detail.issueComments.length > 0) {
      parts.push('## Issue Comments (communication style)');
      for (const c of detail.issueComments) {
        const who = c.user?.login ?? 'unknown';
        parts.push(`- [${c.created_at}] @${who}: ${c.body}`);
      }
      parts.push('');
    }

    // PR review comments (code review depth)
    if (detail.prReviewComments.length > 0) {
      parts.push('## PR Review Comments (code review quality)');
      for (const c of detail.prReviewComments) {
        const who = c.user?.login ?? 'unknown';
        parts.push(`- [${c.created_at}] @${who}: ${c.body}`);
      }
      parts.push('');
    }
  }

  return parts.join('\n');
}

// ---- Summarize events into human-readable activity report ----

function summarizeEvents(events: GitHubEvent[]): string {
  const typeCounts = new Map<string, number>();
  const repoCounts = new Map<string, number>();
  const recentPushRepos: string[] = [];
  const recentPRActions: string[] = [];
  const recentIssueActions: string[] = [];
  const recentReviewActions: string[] = [];

  for (const e of events) {
    typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1);
    repoCounts.set(e.repo.name, (repoCounts.get(e.repo.name) ?? 0) + 1);

    const date = e.created_at.slice(0, 10);

    if (e.type === 'PushEvent' && recentPushRepos.length < 10) {
      const payload = e.payload as {
        commits?: { message: string }[];
      };
      const count = payload.commits?.length ?? 0;
      const msgs = (payload.commits ?? [])
        .slice(0, 3)
        .map(c => c.message.split('\n')[0]);
      recentPushRepos.push(
        `  [${date}] Pushed ${count} commit(s) to ${e.repo.name}: ${msgs.join('; ')}`,
      );
    }

    if (e.type === 'PullRequestEvent' && recentPRActions.length < 8) {
      const payload = e.payload as {
        action?: string;
        pull_request?: { title?: string };
      };
      recentPRActions.push(
        `  [${date}] ${payload.action} PR in ${e.repo.name}: ${payload.pull_request?.title ?? ''}`,
      );
    }

    if (e.type === 'IssuesEvent' && recentIssueActions.length < 8) {
      const payload = e.payload as {
        action?: string;
        issue?: { title?: string };
      };
      recentIssueActions.push(
        `  [${date}] ${payload.action} issue in ${e.repo.name}: ${payload.issue?.title ?? ''}`,
      );
    }

    if (e.type === 'PullRequestReviewEvent' && recentReviewActions.length < 8) {
      const payload = e.payload as {
        action?: string;
        review?: { state?: string };
        pull_request?: { title?: string };
      };
      recentReviewActions.push(
        `  [${date}] Reviewed PR in ${e.repo.name} (${payload.review?.state ?? ''}): ${payload.pull_request?.title ?? ''}`,
      );
    }

    if (e.type === 'IssueCommentEvent') {
      // counted in typeCounts
    }
  }

  const lines: string[] = [];

  // Activity breakdown
  lines.push('Event breakdown:');
  const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    lines.push(`  ${type}: ${count}`);
  }
  lines.push('');

  // Most active repos
  lines.push('Most active repos:');
  const topRepos = [...repoCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [repo, count] of topRepos) {
    lines.push(`  ${repo}: ${count} events`);
  }
  lines.push('');

  if (recentPushRepos.length > 0) {
    lines.push('Recent pushes:');
    lines.push(...recentPushRepos);
    lines.push('');
  }

  if (recentPRActions.length > 0) {
    lines.push('Recent PR activity:');
    lines.push(...recentPRActions);
    lines.push('');
  }

  if (recentReviewActions.length > 0) {
    lines.push('Recent code reviews:');
    lines.push(...recentReviewActions);
    lines.push('');
  }

  if (recentIssueActions.length > 0) {
    lines.push('Recent issue activity:');
    lines.push(...recentIssueActions);
    lines.push('');
  }

  return lines.join('\n');
}

// ---- Main analyze function ----

export async function analyze(
  username: string,
  toneId: string,
  providerId: ProviderId,
  apiKey: string,
  model: string,
  languageId: string,
  githubPat: string | undefined,
  callbacks: AnalysisCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const tone = tones.find((t: Tone) => t.id === toneId);
  if (!tone) {
    callbacks.onError('Invalid tone selected');
    return;
  }

  const provider = providers[providerId];
  if (!provider) {
    callbacks.onError('Invalid provider selected');
    return;
  }

  try {
    const data = await fetchGitHubData(
      username,
      githubPat || undefined,
      callbacks.onProgress,
    );

    callbacks.onProgress('Streaming analysis...');

    const userMessage = buildUserMessage(data);
    const systemPrompt = buildSystemPrompt(tone, languageId);

    await provider.stream(
      systemPrompt,
      userMessage,
      apiKey,
      model,
      callbacks.onChunk,
      signal,
    );

    callbacks.onDone();
  } catch (err) {
    if (signal?.aborted) return;
    const msg = err instanceof Error ? err.message : 'Unknown error occurred';
    callbacks.onError(msg);
  }
}

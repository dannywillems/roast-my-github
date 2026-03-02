import {
  type PlatformInput,
  type PlatformData,
  type MultiPlatformData,
  type AnalysisScope,
  type AnalysisMetadata,
  type AnalyzedItem,
  type PlatformProvider,
  type PlatformId,
  type FollowUpType,
  type FollowUpContext,
  type PlatformRepoDetail,
} from './platforms/types.ts';
import { githubProvider } from './platforms/github.ts';
import { gitlabProvider } from './platforms/gitlab.ts';
import { codebergProvider } from './platforms/codeberg.ts';
import { bitbucketProvider } from './platforms/bitbucket.ts';
import {
  computeTemporalSummary,
  formatTemporalHeader,
} from './platforms/temporal.ts';
import { anthropicProvider } from './providers/anthropic.ts';
import { openaiProvider } from './providers/openai.ts';
import { geminiProvider } from './providers/gemini.ts';
import type { LLMProvider, ProviderId } from './providers/types.ts';
import {
  tones,
  buildSystemPrompt,
  buildFollowUpSystemPrompt,
  type Tone,
} from './prompts.ts';

export interface AnalysisCallbacks {
  onProgress: (msg: string) => void;
  onChunk: (text: string) => void;
  onError: (err: string) => void;
  onDone: () => void;
  onLog: (msg: string) => void;
  onMetadata: (
    metadata: AnalysisMetadata,
    tokenEstimate: number,
    costEstimate: string,
  ) => void;
}

const llmProviders: Record<ProviderId, LLMProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

const platformProviders: Record<PlatformId, PlatformProvider> = {
  github: githubProvider,
  gitlab: gitlabProvider,
  codeberg: codebergProvider,
  bitbucket: bitbucketProvider,
};

// Max characters for PR/issue body in the deep-dive prompt section.
const MAX_DEEP_DIVE_BODY_LENGTH = 300;

// Max files to show in the file tree before truncating.
const MAX_FILE_TREE_ENTRIES = 60;

// Log a progress update every N streaming chunks.
const STREAM_LOG_INTERVAL = 50;

// Rough pricing per 1M input tokens (USD)
const INPUT_PRICING: Record<string, number> = {
  // Anthropic
  'claude-opus-4-20250514': 15.0,
  'claude-sonnet-4-20250514': 3.0,
  'claude-haiku-4-20250414': 0.8,
  // OpenAI
  'gpt-4o': 2.5,
  'gpt-4o-mini': 0.15,
  'gpt-4.1': 2.0,
  'gpt-4.1-mini': 0.4,
  // Gemini
  'gemini-2.5-flash': 0.15,
  'gemini-2.5-pro': 1.25,
  'gemini-2.0-flash': 0.1,
};

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateCost(tokens: number, model: string): string {
  const pricePerMillion = INPUT_PRICING[model];
  if (!pricePerMillion) return 'unknown';
  const cost = (tokens / 1_000_000) * pricePerMillion;
  if (cost < 0.001) return '<$0.001';
  return `~$${cost.toFixed(3)}`;
}

// ---- Build user message from multi-platform data ----

function buildUserMessage(
  multiData: MultiPlatformData,
  platformInputs: PlatformInput[],
): string {
  const parts: string[] = [];

  // Temporal context header
  const temporal = computeTemporalSummary(multiData);
  parts.push(formatTemporalHeader(temporal, platformInputs));
  parts.push('');

  // Per-platform sections
  for (const data of multiData.platforms) {
    const platformLabel =
      data.platform.charAt(0).toUpperCase() + data.platform.slice(1);

    // Profile
    const u = data.user;
    parts.push(`# ${platformLabel} Profile: ${u.login}`);
    parts.push(`Profile: ${u.profileUrl}`);
    parts.push(`Name: ${u.name ?? 'not set'}`);
    parts.push(`Bio: ${u.bio ?? 'not set'}`);
    parts.push(`Company: ${u.company ?? 'not set'}`);
    parts.push(`Location: ${u.location ?? 'not set'}`);
    parts.push(`Website: ${u.website || 'not set'}`);
    parts.push(`Public repos: ${u.publicRepos}`);
    parts.push(`Followers: ${u.followers}, Following: ${u.following}`);
    parts.push(`Account created: ${u.createdAt}`);
    parts.push('');

    // Organizations
    if (data.orgs.length > 0) {
      parts.push(`# ${platformLabel} Organizations`);
      for (const org of data.orgs) {
        parts.push(`- ${org.login}: ${org.description ?? 'no description'}`);
      }
      parts.push('');
    }

    // Recent activity
    if (data.events.length > 0) {
      parts.push(`# ${platformLabel} Recent Activity (from events feed)`);
      const summary = summarizeEvents(data.events);
      parts.push(summary);
      parts.push('');
    }

    // Cross-repo contributions
    const xr = data.crossRepoActivity;

    if (xr.recentCommitRepos.length > 0) {
      parts.push(
        `# ${platformLabel} Repos with recent commits (across platform)`,
      );
      for (const r of xr.recentCommitRepos) {
        parts.push(`- ${r}`);
      }
      parts.push('');
    }

    if (xr.recentPRs.length > 0) {
      parts.push(`# ${platformLabel} Recent Pull Requests (across all repos)`);
      for (const pr of xr.recentPRs) {
        parts.push(
          `- [${pr.state}] ${pr.repoFullName}: ` +
            `[${pr.title}](${pr.url}) (${pr.createdAt})`,
        );
        if (pr.body) {
          parts.push(`  ${pr.body}`);
        }
      }
      parts.push('');
    }

    if (xr.recentIssues.length > 0) {
      parts.push(`# ${platformLabel} Recent Issues (across all repos)`);
      for (const issue of xr.recentIssues) {
        const labels = issue.labels.join(', ');
        parts.push(
          `- [${issue.state}] ${issue.repoFullName}: ` +
            `[${issue.title}](${issue.url})` +
            (labels ? ` (${labels})` : '') +
            ` - ${issue.comments} comments`,
        );
        if (issue.body) {
          parts.push(`  ${issue.body}`);
        }
      }
      parts.push('');
    }

    // Owned repos overview
    parts.push(`# ${platformLabel} Owned Repositories (by recent activity)`);
    for (const r of data.ownedRepos) {
      const lang = r.language ?? 'unknown';
      const stars = r.stars;
      const desc = r.description ?? 'no description';
      const pushed = r.pushedAt.slice(0, 10);
      const license = r.license ?? 'no license';
      parts.push(
        `- [${r.name}](${r.url}) [${lang}] ${stars} stars, ` +
          `last pushed ${pushed}, ${license}: ${desc}`,
      );
      if (r.topics.length > 0) {
        parts.push(`  Topics: ${r.topics.join(', ')}`);
      }
    }
    parts.push('');

    // Forked repos
    if (data.forkedRepos.length > 0) {
      parts.push(`# ${platformLabel} Forked Repositories`);
      for (const r of data.forkedRepos) {
        const lang = r.language ?? 'unknown';
        const pushed = r.pushedAt.slice(0, 10);
        parts.push(
          `- [${r.fullName}](${r.url}) [${lang}] ` +
            `last pushed ${pushed}: ` +
            `${r.description ?? 'no description'}`,
        );
      }
      parts.push('');
    }

    // Contributed repos
    if (data.contributedRepoNames.length > 0) {
      parts.push(
        `# ${platformLabel} Contributed Repositories ` +
          '(active but not owned)',
      );
      for (const name of data.contributedRepoNames) {
        parts.push(`- ${name}`);
      }
      parts.push('');
    }

    // Deep dives
    for (const detail of data.repoDetails) {
      parts.push(formatRepoDetail(detail, platformLabel));
    }
  }

  return parts.join('\n');
}

function formatRepoDetail(
  detail: PlatformRepoDetail,
  platformLabel: string,
): string {
  const parts: string[] = [];
  const r = detail.repo;
  const relationLabel =
    detail.relation === 'forked'
      ? ' (FORK - contributing to upstream)'
      : detail.relation === 'contributed'
        ? ' (CONTRIBUTION - not owned by user)'
        : '';

  parts.push(`# ${platformLabel} Deep Dive: ${r.fullName}${relationLabel}`);
  parts.push(`URL: ${r.url}`);
  parts.push(`Language: ${r.language ?? 'unknown'}`);
  parts.push(`Stars: ${r.stars}, Forks: ${r.forks}, Size: ${r.size}KB`);
  parts.push(`Last pushed: ${r.pushedAt}`);
  parts.push('');

  // File tree
  if (detail.tree.length > 0) {
    parts.push(`## File structure (first ${MAX_FILE_TREE_ENTRIES} files)`);
    for (const entry of detail.tree.slice(0, MAX_FILE_TREE_ENTRIES)) {
      parts.push(`  ${entry.path}`);
    }
    if (detail.tree.length > MAX_FILE_TREE_ENTRIES) {
      parts.push(
        `  ... and ${detail.tree.length - MAX_FILE_TREE_ENTRIES} more files`,
      );
    }
    parts.push('');
  }

  // Commits
  if (detail.commits.length > 0) {
    parts.push('## Recent commits by this user');
    for (const c of detail.commits) {
      const msg = c.message.split('\n')[0];
      const date = c.authorDate.slice(0, 10);
      parts.push(`  - [${date}] [${msg}](${c.url})`);
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
      const merged = pr.mergedAt ? 'merged' : pr.state;
      parts.push(
        `- [#${pr.number} ${pr.title}](${pr.url})` +
          ` [${merged}]` +
          ` (+${pr.additions}/-${pr.deletions}, ` +
          `${pr.changedFiles} files, ` +
          `${pr.reviewComments} review comments)`,
      );
      if (pr.body) {
        const body =
          pr.body.length > MAX_DEEP_DIVE_BODY_LENGTH
            ? pr.body.slice(0, MAX_DEEP_DIVE_BODY_LENGTH) + '...'
            : pr.body;
        parts.push(`  Description: ${body}`);
      }
    }
    parts.push('');
  }

  // Issues
  if (detail.issues.length > 0) {
    parts.push('## Issues');
    for (const issue of detail.issues) {
      const labels = issue.labels.join(', ');
      parts.push(
        `- [#${issue.number} ${issue.title}](${issue.url})` +
          ` [${issue.state}]` +
          (labels ? ` (${labels})` : '') +
          ` - ${issue.comments} comments`,
      );
      if (issue.body) {
        const body =
          issue.body.length > MAX_DEEP_DIVE_BODY_LENGTH
            ? issue.body.slice(0, MAX_DEEP_DIVE_BODY_LENGTH) + '...'
            : issue.body;
        parts.push(`  Body: ${body}`);
      }
    }
    parts.push('');
  }

  // Issue comments
  if (detail.issueComments.length > 0) {
    parts.push('## Issue Comments (communication style)');
    for (const c of detail.issueComments) {
      parts.push(
        `- [${c.createdAt}] @${c.authorLogin}: ` + `[${c.body}](${c.url})`,
      );
    }
    parts.push('');
  }

  // PR review comments
  if (detail.prReviewComments.length > 0) {
    parts.push('## PR Review Comments (code review quality)');
    for (const c of detail.prReviewComments) {
      parts.push(
        `- [${c.createdAt}] @${c.authorLogin}: ` + `[${c.body}](${c.url})`,
      );
    }
    parts.push('');
  }

  return parts.join('\n');
}

// ---- Summarize events ----

import type { PlatformEvent } from './platforms/types.ts';

function summarizeEvents(events: PlatformEvent[]): string {
  const typeCounts = new Map<string, number>();
  const repoCounts = new Map<string, number>();
  const recentPushRepos: string[] = [];
  const recentPRActions: string[] = [];
  const recentIssueActions: string[] = [];
  const recentReviewActions: string[] = [];

  for (const e of events) {
    typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1);
    repoCounts.set(e.repoName, (repoCounts.get(e.repoName) ?? 0) + 1);

    const date = e.createdAt.slice(0, 10);

    if (e.type === 'PushEvent' && recentPushRepos.length < 10) {
      const payload = e.payload as {
        commits?: { message: string }[];
      };
      const count = payload.commits?.length ?? 0;
      const msgs = (payload.commits ?? [])
        .slice(0, 3)
        .map(c => c.message.split('\n')[0]);
      recentPushRepos.push(
        `  [${date}] Pushed ${count} commit(s) to ` +
          `${e.repoName}: ${msgs.join('; ')}`,
      );
    }

    if (e.type === 'PullRequestEvent' && recentPRActions.length < 8) {
      const payload = e.payload as {
        action?: string;
        pull_request?: { title?: string };
      };
      recentPRActions.push(
        `  [${date}] ${payload.action} PR in ${e.repoName}: ` +
          `${payload.pull_request?.title ?? ''}`,
      );
    }

    if (e.type === 'IssuesEvent' && recentIssueActions.length < 8) {
      const payload = e.payload as {
        action?: string;
        issue?: { title?: string };
      };
      recentIssueActions.push(
        `  [${date}] ${payload.action} issue in ` +
          `${e.repoName}: ${payload.issue?.title ?? ''}`,
      );
    }

    if (e.type === 'PullRequestReviewEvent' && recentReviewActions.length < 8) {
      const payload = e.payload as {
        action?: string;
        review?: { state?: string };
        pull_request?: { title?: string };
      };
      recentReviewActions.push(
        `  [${date}] Reviewed PR in ${e.repoName}` +
          ` (${payload.review?.state ?? ''}): ` +
          `${payload.pull_request?.title ?? ''}`,
      );
    }
  }

  const lines: string[] = [];

  lines.push('Event breakdown:');
  const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    lines.push(`  ${type}: ${count}`);
  }
  lines.push('');

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
  platformInputs: PlatformInput[],
  toneId: string,
  providerId: ProviderId,
  apiKey: string,
  model: string,
  languageId: string,
  scope: AnalysisScope,
  customPersonality: string | undefined,
  callbacks: AnalysisCallbacks,
  signal?: AbortSignal,
): Promise<MultiPlatformData | null> {
  const log = callbacks.onLog;

  const tone = tones.find((t: Tone) => t.id === toneId);
  if (!tone) {
    callbacks.onError('Invalid tone selected');
    return null;
  }

  const provider = llmProviders[providerId];
  if (!provider) {
    callbacks.onError('Invalid provider selected');
    return null;
  }

  if (platformInputs.length === 0) {
    callbacks.onError('No platforms selected');
    return null;
  }

  const platformNames = platformInputs
    .map(p => `${p.platform}/@${p.username}`)
    .join(', ');
  log(`Starting analysis for ${platformNames}`);
  log(`Provider: ${providerId}, Model: ${model}`);
  log(`Tone: ${tone.label}, Language: ${languageId}`);
  log(
    `Scope: ${Object.entries(scope)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ')}`,
  );

  try {
    // Fetch data from all platforms
    const allPlatformData: PlatformData[] = [];

    for (const input of platformInputs) {
      const pp = platformProviders[input.platform];
      if (!pp) {
        log(`Unknown platform: ${input.platform}, skipping`);
        continue;
      }

      log(`Fetching ${input.platform} data for ${input.username}...`);
      const data = await pp.fetchData(
        input.username,
        input.pat,
        (msg: string) => {
          callbacks.onProgress(`[${input.platform}] ${msg}`);
          log(`[${input.platform}] ${msg}`);
        },
        scope,
      );
      allPlatformData.push(data);

      const totalEvents = data.events.length;
      const totalRepos = data.ownedRepos.length;
      const totalDives = data.repoDetails.length;
      log(
        `[${input.platform}] Fetched: ${totalEvents} events, ` +
          `${totalRepos} repos, ${totalDives} deep dives`,
      );
    }

    const multiData: MultiPlatformData = {
      platforms: allPlatformData,
    };

    // Merge metadata from all platforms
    const mergedMetadata: AnalysisMetadata = {
      analyzedItems: allPlatformData.flatMap(d => d.metadata.analyzedItems),
      rateLimitRemaining: null,
      rateLimitTotal: null,
      rateLimitReset: null,
      apiCallsMade: allPlatformData.reduce(
        (sum, d) => sum + d.metadata.apiCallsMade,
        0,
      ),
    };

    // Use first platform's rate limit info for display
    for (const d of allPlatformData) {
      if (d.metadata.rateLimitRemaining !== null) {
        mergedMetadata.rateLimitRemaining = d.metadata.rateLimitRemaining;
        mergedMetadata.rateLimitTotal = d.metadata.rateLimitTotal;
        mergedMetadata.rateLimitReset = d.metadata.rateLimitReset;
        break;
      }
    }

    callbacks.onProgress('Streaming analysis...');
    log('Building LLM prompt...');

    const userMessage = buildUserMessage(multiData, platformInputs);
    const systemPrompt = buildSystemPrompt(tone, languageId, customPersonality);
    const totalText = systemPrompt + userMessage;
    const tokens = estimateTokens(totalText);
    const cost = estimateCost(tokens, model);

    log(
      `Prompt size: ${totalText.length} chars, ` +
        `~${tokens.toLocaleString()} tokens`,
    );
    log(`Estimated input cost: ${cost}`);

    // Context window limits
    const MODEL_LIMITS: Record<string, number> = {
      'claude-opus-4-20250514': 200000,
      'claude-sonnet-4-20250514': 200000,
      'claude-haiku-4-20250414': 200000,
      'gpt-4o': 128000,
      'gpt-4o-mini': 128000,
      'gpt-4.1': 1000000,
      'gpt-4.1-mini': 1000000,
      'gemini-2.5-flash': 1000000,
      'gemini-2.5-pro': 1000000,
      'gemini-2.0-flash': 1000000,
    };
    const limit = MODEL_LIMITS[model];
    if (limit && tokens > limit * 0.9) {
      const msg =
        `WARNING: Input is ~${tokens.toLocaleString()} tokens, ` +
        `close to the ${limit.toLocaleString()} token limit for ` +
        `${model}. The analysis may be truncated or fail. ` +
        `Try reducing the scope or number of platforms.`;
      log(msg);
      callbacks.onProgress(msg);
    } else if (tokens > 50000) {
      log(
        `Note: Large prompt (${tokens.toLocaleString()} tokens). ` +
          `Streaming may take a while.`,
      );
    }

    callbacks.onMetadata(mergedMetadata, tokens, cost);

    log(`Streaming from ${providerId} (${model})...`);

    let chunkCount = 0;
    let totalChars = 0;

    await provider.stream(
      systemPrompt,
      userMessage,
      apiKey,
      model,
      (text: string) => {
        chunkCount++;
        totalChars += text.length;
        if (chunkCount === 1) {
          log('Received first chunk from LLM.');
        }
        if (chunkCount % STREAM_LOG_INTERVAL === 0) {
          log(
            `Streaming: ${chunkCount} chunks, ` +
              `~${totalChars} chars received`,
          );
        }
        callbacks.onChunk(text);
      },
      signal,
    );

    log(
      `Analysis complete. Received ${chunkCount} chunks, ` +
        `${totalChars} chars total.`,
    );
    callbacks.onDone();
    return multiData;
  } catch (err) {
    if (signal?.aborted) {
      log('Analysis cancelled by user.');
      return null;
    }
    const msg = err instanceof Error ? err.message : 'Unknown error occurred';
    log(`ERROR: ${msg}`);
    callbacks.onError(msg);
    return null;
  }
}

// ---- Follow-up analyze function ----

export async function followUpAnalyze(
  followUpContext: FollowUpContext,
  platformInputs: PlatformInput[],
  previousResponse: string,
  previousData: MultiPlatformData,
  toneId: string,
  providerId: ProviderId,
  apiKey: string,
  model: string,
  languageId: string,
  scope: AnalysisScope,
  customPersonality: string | undefined,
  callbacks: AnalysisCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const log = callbacks.onLog;

  const tone = tones.find((t: Tone) => t.id === toneId);
  if (!tone) {
    callbacks.onError('Invalid tone selected');
    return;
  }

  const provider = llmProviders[providerId];
  if (!provider) {
    callbacks.onError('Invalid provider selected');
    return;
  }

  log(`Follow-up analysis: ${followUpContext.type}`);

  // Build a focused user message based on follow-up type
  let userMessage = '';

  switch (followUpContext.type) {
    case 'deep-dive-repo': {
      const repoName = followUpContext.repoFullName ?? '';
      log(`Deep dive into ${repoName}`);
      // Find the repo detail across all platforms
      let detail: PlatformRepoDetail | undefined;
      for (const pd of previousData.platforms) {
        detail = pd.repoDetails.find(d => d.repo.fullName === repoName);
        if (detail) break;
      }
      if (detail) {
        const platformLabel =
          detail.repo.platform.charAt(0).toUpperCase() +
          detail.repo.platform.slice(1);
        userMessage =
          `Focus your analysis specifically on this repository.\n\n` +
          formatRepoDetail(detail, platformLabel);
      } else {
        userMessage =
          `The user wants a deep dive into ${repoName} but ` +
          `detailed data is not available. Analyze based on ` +
          `what you know from the previous analysis.`;
      }
      break;
    }
    case 'time-frame': {
      const days = followUpContext.timeFrameDays ?? 90;
      log(`Time frame analysis: last ${days} days`);
      userMessage =
        `Focus your analysis ONLY on activity from the ` +
        `last ${days} days. Ignore older activity.\n\n` +
        buildUserMessage(previousData, platformInputs);
      break;
    }
    case 'code-review-style': {
      log('Code review style analysis');
      const commentSections: string[] = [];
      for (const pd of previousData.platforms) {
        for (const detail of pd.repoDetails) {
          if (
            detail.prReviewComments.length > 0 ||
            detail.issueComments.length > 0
          ) {
            const label =
              detail.repo.platform.charAt(0).toUpperCase() +
              detail.repo.platform.slice(1);
            if (detail.prReviewComments.length > 0) {
              commentSections.push(
                `## ${label} PR Review Comments in ` +
                  `${detail.repo.fullName}`,
              );
              for (const c of detail.prReviewComments) {
                commentSections.push(
                  `- [${c.createdAt}] @${c.authorLogin}: ` +
                    `[${c.body}](${c.url})`,
                );
              }
            }
            if (detail.issueComments.length > 0) {
              commentSections.push(
                `## ${label} Issue Comments in ` + `${detail.repo.fullName}`,
              );
              for (const c of detail.issueComments) {
                commentSections.push(
                  `- [${c.createdAt}] @${c.authorLogin}: ` +
                    `[${c.body}](${c.url})`,
                );
              }
            }
          }
        }
      }
      userMessage =
        `Analyze this developer's code review style, ` +
        `communication tone, and feedback quality. Focus ` +
        `exclusively on their comments and reviews.\n\n` +
        commentSections.join('\n');
      break;
    }
    case 'issue-communication': {
      log('Issue communication analysis');
      const issueSections: string[] = [];
      for (const pd of previousData.platforms) {
        for (const detail of pd.repoDetails) {
          if (detail.issues.length > 0) {
            const label =
              detail.repo.platform.charAt(0).toUpperCase() +
              detail.repo.platform.slice(1);
            issueSections.push(`## ${label} Issues in ${detail.repo.fullName}`);
            for (const issue of detail.issues) {
              issueSections.push(
                `- [#${issue.number} ${issue.title}]` +
                  `(${issue.url}) [${issue.state}] ` +
                  `- ${issue.comments} comments`,
              );
              if (issue.body) {
                issueSections.push(`  Body: ${issue.body}`);
              }
            }
          }
        }
      }
      userMessage =
        `Analyze how this developer communicates in issues. ` +
        `How do they report bugs, request features, and ` +
        `discuss problems?\n\n` +
        issueSections.join('\n');
      break;
    }
    case 'compare-platforms': {
      log('Cross-platform comparison');
      userMessage =
        `Compare this developer's activity, code quality, and ` +
        `engagement across the different platforms. Note ` +
        `differences in activity levels, project types, and ` +
        `communication styles.\n\n` +
        buildUserMessage(previousData, platformInputs);
      break;
    }
    case 'collaboration-patterns': {
      log('Collaboration patterns analysis');
      userMessage =
        `Analyze this developer's collaboration patterns: ` +
        `who they review, who reviews them, co-authorship, ` +
        `team dynamics visible from PRs and issues.\n\n` +
        buildUserMessage(previousData, platformInputs);
      break;
    }
    case 'custom': {
      const prompt = followUpContext.customPrompt ?? '';
      log(`Custom follow-up: ${prompt}`);
      userMessage =
        `The user asks: "${prompt}"\n\n` +
        `Answer based on the developer data below.\n\n` +
        buildUserMessage(previousData, platformInputs);
      break;
    }
    default: {
      userMessage = buildUserMessage(previousData, platformInputs);
    }
  }

  // Truncate previous response for context
  const prevSummary =
    previousResponse.length > 2000
      ? previousResponse.slice(0, 2000) + '\n... (truncated)'
      : previousResponse;

  const systemPrompt = buildFollowUpSystemPrompt(
    tone,
    languageId,
    prevSummary,
    customPersonality,
  );

  const totalText = systemPrompt + userMessage;
  const tokens = estimateTokens(totalText);
  const cost = estimateCost(tokens, model);

  log(
    `Follow-up prompt size: ${totalText.length} chars, ` +
      `~${tokens.toLocaleString()} tokens`,
  );

  // Merge metadata for display
  const mergedMetadata: AnalysisMetadata = {
    analyzedItems: previousData.platforms.flatMap(
      d => d.metadata.analyzedItems,
    ),
    rateLimitRemaining: null,
    rateLimitTotal: null,
    rateLimitReset: null,
    apiCallsMade: 0,
  };
  callbacks.onMetadata(mergedMetadata, tokens, cost);

  try {
    log(`Streaming follow-up from ${providerId} (${model})...`);

    let chunkCount = 0;
    let totalChars = 0;

    await provider.stream(
      systemPrompt,
      userMessage,
      apiKey,
      model,
      (text: string) => {
        chunkCount++;
        totalChars += text.length;
        if (chunkCount === 1) {
          log('Received first chunk from LLM.');
        }
        if (chunkCount % STREAM_LOG_INTERVAL === 0) {
          log(
            `Streaming: ${chunkCount} chunks, ` +
              `~${totalChars} chars received`,
          );
        }
        callbacks.onChunk(text);
      },
      signal,
    );

    log(
      `Follow-up complete. ${chunkCount} chunks, ` +
        `${totalChars} chars total.`,
    );
    callbacks.onDone();
  } catch (err) {
    if (signal?.aborted) {
      log('Follow-up cancelled by user.');
      return;
    }
    const msg = err instanceof Error ? err.message : 'Unknown error occurred';
    log(`ERROR: ${msg}`);
    callbacks.onError(msg);
  }
}

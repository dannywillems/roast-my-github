import { fetchGitHubData, type GitHubData } from './github.ts';
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

  // Profile summary
  const u = data.user;
  parts.push(`# GitHub Profile: ${u.login}`);
  parts.push(`Name: ${u.name ?? 'not set'}`);
  parts.push(`Bio: ${u.bio ?? 'not set'}`);
  parts.push(`Public repos: ${u.public_repos}`);
  parts.push(`Followers: ${u.followers}`);
  parts.push(`Account created: ${u.created_at}`);
  parts.push('');

  // Repo overview
  parts.push('# Repositories (top 10 by stars)');
  for (const r of data.repos) {
    const lang = r.language ?? 'unknown';
    const stars = r.stargazers_count;
    const desc = r.description ?? 'no description';
    parts.push(`- ${r.name} [${lang}] ${stars} stars: ${desc}`);
    if (r.topics.length > 0) {
      parts.push(`  Topics: ${r.topics.join(', ')}`);
    }
  }
  parts.push('');

  // Deep dive on top repos
  for (const detail of data.repoDetails) {
    const r = detail.repo;
    parts.push(`# Deep Dive: ${r.name}`);
    parts.push(`Language: ${r.language ?? 'unknown'}`);
    parts.push(`Stars: ${r.stargazers_count}, Forks: ${r.forks_count}`);
    parts.push('');

    // File tree summary
    if (detail.tree.length > 0) {
      parts.push('## File structure (showing first 50 files)');
      for (const entry of detail.tree.slice(0, 50)) {
        parts.push(`  ${entry.path}`);
      }
      if (detail.tree.length > 50) {
        parts.push(`  ... and ${detail.tree.length - 50} more files`);
      }
      parts.push('');
    }

    // Recent commits
    if (detail.commits.length > 0) {
      parts.push('## Recent commits');
      for (const c of detail.commits) {
        const msg = c.commit.message.split('\n')[0];
        parts.push(`  - ${msg}`);
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
            ` (+${pr.additions}/-${pr.deletions}, ${pr.changed_files} files)`,
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

    // Issue comments (shows communication style)
    if (detail.issueComments.length > 0) {
      parts.push('## Issue Comments (communication style)');
      for (const c of detail.issueComments) {
        parts.push(`- [${c.created_at}] ${c.body}`);
      }
      parts.push('');
    }

    // PR review comments (shows code review style)
    if (detail.prReviewComments.length > 0) {
      parts.push('## PR Review Comments (code review style)');
      for (const c of detail.prReviewComments) {
        parts.push(`- [${c.created_at}] ${c.body}`);
      }
      parts.push('');
    }
  }

  return parts.join('\n');
}

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
    // Phase 1: Fetch GitHub data
    const data = await fetchGitHubData(
      username,
      githubPat || undefined,
      callbacks.onProgress,
    );

    callbacks.onProgress('Building analysis...');

    // Phase 2: Stream LLM response
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

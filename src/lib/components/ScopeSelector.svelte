<script lang="ts">
  import type { AnalysisScope } from '$lib/platforms/types';
  import { t } from '$lib/i18n';

  let {
    scope = $bindable<AnalysisScope>({
      recentActivity: true,
      sourceCode: true,
      pullRequests: true,
      issues: true,
      commentsReviews: true,
      crossRepoContributions: true,
      commitMessages: true,
    }),
    language = 'en',
  }: {
    scope: AnalysisScope;
    language?: string;
  } = $props();

  let i = $derived(t(language));

  let options = $derived<{ key: keyof AnalysisScope; label: string }[]>([
    { key: 'recentActivity', label: i.scopeRecentActivity },
    { key: 'sourceCode', label: i.scopeSourceCode },
    { key: 'commitMessages', label: i.scopeCommitMessages },
    { key: 'pullRequests', label: i.scopePullRequests },
    { key: 'issues', label: i.scopeIssues },
    { key: 'commentsReviews', label: i.scopeCommentsReviews },
    { key: 'crossRepoContributions', label: i.scopeCrossRepo },
  ]);
</script>

<fieldset>
  <legend class="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
    {i.whatToAnalyze}
  </legend>
  <div class="flex flex-wrap gap-2">
    {#each options as opt (opt.key)}
      <label
        class="inline-flex cursor-pointer items-center gap-1.5
               rounded-full border px-3 py-1 text-xs transition-colors
               {scope[opt.key]
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-300'
          : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}"
      >
        <input type="checkbox" bind:checked={scope[opt.key]} class="sr-only" />
        <span
          class="inline-block h-3 w-3 rounded-sm border
                 {scope[opt.key]
            ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400'
            : 'border-zinc-300 dark:border-zinc-600'}"
        ></span>
        {opt.label}
      </label>
    {/each}
  </div>
</fieldset>

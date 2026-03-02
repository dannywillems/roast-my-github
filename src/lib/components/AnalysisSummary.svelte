<script lang="ts">
  import type { AnalysisMetadata } from '$lib/platforms/types';

  let {
    metadata,
    tokenEstimate = 0,
    costEstimate = '',
    logs = [],
  }: {
    metadata: AnalysisMetadata | null;
    tokenEstimate: number;
    costEstimate: string;
    logs: string[];
  } = $props();

  let showDetails = $state(false);
  let showLogs = $state(false);

  let groupedItems = $derived(() => {
    if (!metadata) return {};
    const groups: Record<string, typeof metadata.analyzedItems> = {};
    for (const item of metadata.analyzedItems) {
      const key = item.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  });

  const typeLabels: Record<string, string> = {
    profile: 'Profiles',
    repo: 'Repositories',
    file: 'Source files',
    commit: 'Commits',
    pr: 'Pull requests',
    issue: 'Issues',
    comment: 'Comments',
  };
</script>

{#if metadata}
  <div
    class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm
           dark:border-zinc-800 dark:bg-zinc-800/30"
  >
    <!-- Stats bar -->
    <div
      class="flex flex-wrap items-center gap-3 text-xs text-zinc-500
                dark:text-zinc-400"
    >
      <span>
        {metadata.apiCallsMade} API calls
      </span>
      {#if metadata.rateLimitRemaining !== null && metadata.rateLimitTotal !== null}
        <span>
          {metadata.rateLimitRemaining}/{metadata.rateLimitTotal} remaining
        </span>
      {/if}
      {#if metadata.rateLimitReset}
        <span>Resets at {metadata.rateLimitReset}</span>
      {/if}
      <span>{metadata.analyzedItems.length} items</span>
      {#if tokenEstimate > 0}
        <span>~{tokenEstimate.toLocaleString()} tokens</span>
      {/if}
      {#if costEstimate}
        <span>Est: {costEstimate}</span>
      {/if}
    </div>

    <!-- Expandable details -->
    <div class="mt-2 flex gap-3">
      <button
        type="button"
        onclick={() => (showDetails = !showDetails)}
        class="text-xs font-medium text-blue-600 hover:text-blue-700
               dark:text-blue-400 dark:hover:text-blue-300"
      >
        {showDetails ? 'Hide' : 'Show'} analyzed items
      </button>
      {#if logs.length > 0}
        <button
          type="button"
          onclick={() => (showLogs = !showLogs)}
          class="text-xs font-medium text-blue-600 hover:text-blue-700
                 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showLogs ? 'Hide' : 'Show'} logs ({logs.length})
        </button>
      {/if}
    </div>

    {#if showDetails}
      <div class="mt-3 space-y-2">
        {#each Object.entries(groupedItems()) as [type, items] (type)}
          <div>
            <h4
              class="text-xs font-semibold text-zinc-600
                       dark:text-zinc-300"
            >
              {typeLabels[type] ?? type}
              ({items.length})
            </h4>
            <ul class="mt-1 space-y-0.5">
              {#each items as item (item.url)}
                <li class="text-xs">
                  <span
                    class="mr-1 inline-block rounded bg-zinc-200
                           px-1 text-[9px] font-medium
                           text-zinc-500 dark:bg-zinc-700
                           dark:text-zinc-400"
                  >
                    {item.platform}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener"
                    class="text-blue-600 hover:underline
                           dark:text-blue-400"
                  >
                    {item.label}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    {/if}

    {#if showLogs}
      <div
        class="mt-3 max-h-60 overflow-y-auto rounded border
               border-zinc-200 bg-white p-2 font-mono text-xs
               text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900
               dark:text-zinc-400"
      >
        {#each logs as log, i (i)}
          <div class="py-0.5">{log}</div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

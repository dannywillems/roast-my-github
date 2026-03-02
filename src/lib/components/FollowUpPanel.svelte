<script lang="ts">
  import type {
    FollowUpAction,
    FollowUpType,
    PlatformRepoDetail,
  } from '$lib/platforms/types';

  let {
    repoDetails = [],
    platformCount = 1,
    onaction,
  }: {
    repoDetails: PlatformRepoDetail[];
    platformCount: number;
    onaction: (type: FollowUpType, context?: Record<string, unknown>) => void;
  } = $props();

  let customPrompt = $state('');

  let suggestions = $derived.by((): FollowUpAction[] => {
    const actions: FollowUpAction[] = [];

    for (const detail of repoDetails.slice(0, 3)) {
      actions.push({
        type: 'deep-dive-repo',
        label: `Deep dive: ${detail.repo.name}`,
        description: `Analyze ${detail.repo.fullName} in detail.`,
        context: { repoFullName: detail.repo.fullName },
      });
    }

    actions.push({
      type: 'time-frame',
      label: 'Last 30 days',
      description: 'Focus on recent activity only.',
      context: { timeFrameDays: 30 },
    });

    actions.push({
      type: 'time-frame',
      label: 'Last 90 days',
      description: 'Activity from the past quarter.',
      context: { timeFrameDays: 90 },
    });

    actions.push({
      type: 'code-review-style',
      label: 'Code review style',
      description: 'PR comments and review tone.',
    });

    actions.push({
      type: 'issue-communication',
      label: 'Issue communication',
      description: 'Issue reporting and discussion.',
    });

    if (platformCount > 1) {
      actions.push({
        type: 'compare-platforms',
        label: 'Compare platforms',
        description: 'Activity patterns across platforms.',
      });
    }

    actions.push({
      type: 'collaboration-patterns',
      label: 'Collaboration',
      description: 'Review relationships and co-authors.',
    });

    return actions;
  });

  function handleCustomSubmit(): void {
    if (!customPrompt.trim()) return;
    onaction('custom', { customPrompt: customPrompt.trim() });
    customPrompt = '';
  }
</script>

<div
  class="rounded-2xl border border-zinc-200 bg-white p-5
         dark:border-zinc-800 dark:bg-zinc-800/50"
>
  <h3
    class="mb-3 text-sm font-semibold text-zinc-700
           dark:text-zinc-300"
  >
    Go deeper
  </h3>

  <div class="flex flex-wrap gap-2">
    {#each suggestions as action (action.label)}
      <button
        type="button"
        onclick={() => onaction(action.type, action.context)}
        class="rounded-xl border border-zinc-200 bg-zinc-50
               px-3 py-2 text-left transition-all
               hover:border-amber-300 hover:bg-amber-50
               hover:shadow-sm
               dark:border-zinc-700 dark:bg-zinc-800
               dark:hover:border-amber-600 dark:hover:bg-amber-950"
        title={action.description}
      >
        <span
          class="text-xs font-medium text-zinc-700
                 dark:text-zinc-200"
        >
          {action.label}
        </span>
      </button>
    {/each}
  </div>

  <!-- Custom follow-up -->
  <div class="mt-3 flex gap-2">
    <input
      type="text"
      bind:value={customPrompt}
      placeholder="Ask a custom follow-up question..."
      onkeydown={(e: KeyboardEvent) => {
        if (e.key === 'Enter') handleCustomSubmit();
      }}
      class="flex-1 rounded-xl border border-zinc-200 bg-zinc-50
             px-3 py-2 text-sm text-zinc-900
             placeholder-zinc-400
             focus:border-blue-500 focus:outline-none
             focus:ring-2 focus:ring-blue-500/20
             dark:border-zinc-700 dark:bg-zinc-800
             dark:text-zinc-100 dark:placeholder-zinc-500
             dark:focus:border-blue-400
             dark:focus:ring-blue-400/20"
    />
    <button
      type="button"
      onclick={handleCustomSubmit}
      disabled={!customPrompt.trim()}
      class="rounded-xl bg-amber-600 px-4 py-2 text-sm
             font-medium text-white transition-colors
             hover:bg-amber-700
             disabled:cursor-not-allowed disabled:opacity-50
             dark:bg-amber-500 dark:hover:bg-amber-600"
    >
      Ask
    </button>
  </div>
</div>

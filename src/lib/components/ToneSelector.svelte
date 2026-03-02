<script lang="ts">
  import { tones, type Tone } from '$lib/prompts.ts';

  let {
    selected = $bindable('roast'),
  }: {
    selected: string;
  } = $props();
</script>

<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
  {#each tones as tone (tone.id)}
    <button
      type="button"
      onclick={() => (selected = tone.id)}
      class="rounded-lg border px-4 py-3 text-left transition-colors
             {selected === tone.id
        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
        : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600'}"
    >
      <div
        class="text-sm font-medium
               {selected === tone.id
          ? 'text-blue-700 dark:text-blue-300'
          : 'text-zinc-900 dark:text-zinc-100'}"
      >
        {tone.label}
      </div>
      <div class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {tone.description}
      </div>
    </button>
  {/each}
</div>

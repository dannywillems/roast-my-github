<script lang="ts">
  import { platformConfigs, type PlatformId } from '$lib/platforms/types';
  import PlatformIcon from './PlatformIcon.svelte';

  let {
    selectedPlatforms = $bindable<PlatformId[]>(['github']),
    usernames = $bindable<Record<PlatformId, string>>({
      github: '',
      gitlab: '',
      codeberg: '',
      bitbucket: '',
    }),
    disabled = false,
    onsubmit,
  }: {
    selectedPlatforms: PlatformId[];
    usernames: Record<PlatformId, string>;
    disabled?: boolean;
    onsubmit?: () => void;
  } = $props();

  function togglePlatform(id: PlatformId): void {
    if (disabled) return;
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length <= 1) return;
      selectedPlatforms = selectedPlatforms.filter(p => p !== id);
    } else {
      selectedPlatforms = [...selectedPlatforms, id];
    }
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && onsubmit) {
      onsubmit();
    }
  }

  const platformColors: Record<PlatformId, string> = {
    github: 'hover:border-zinc-500 dark:hover:border-zinc-300',
    gitlab: 'hover:border-orange-400 dark:hover:border-orange-400',
    codeberg: 'hover:border-green-500 dark:hover:border-green-400',
    bitbucket: 'hover:border-blue-500 dark:hover:border-blue-400',
  };

  const platformActiveColors: Record<PlatformId, string> = {
    github:
      'border-zinc-600 bg-zinc-50 text-zinc-900 ' +
      'dark:border-zinc-400 dark:bg-zinc-800 dark:text-zinc-100',
    gitlab:
      'border-orange-400 bg-orange-50 text-orange-800 ' +
      'dark:border-orange-500 dark:bg-orange-950 dark:text-orange-200',
    codeberg:
      'border-green-500 bg-green-50 text-green-800 ' +
      'dark:border-green-500 dark:bg-green-950 dark:text-green-200',
    bitbucket:
      'border-blue-500 bg-blue-50 text-blue-800 ' +
      'dark:border-blue-500 dark:bg-blue-950 dark:text-blue-200',
  };
</script>

<div class="space-y-4">
  <!-- Platform toggle buttons with real icons -->
  <div class="flex flex-wrap gap-2">
    {#each platformConfigs as cfg (cfg.id)}
      {@const active = selectedPlatforms.includes(cfg.id)}
      <button
        type="button"
        {disabled}
        onclick={() => togglePlatform(cfg.id)}
        class="inline-flex items-center gap-2 rounded-xl border-2
               px-4 py-2.5 text-sm font-medium transition-all
               {active
          ? platformActiveColors[cfg.id]
          : 'border-zinc-200 bg-white text-zinc-400 ' +
            platformColors[cfg.id] +
            ' ' +
            'dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-500'}
               disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlatformIcon
          platform={cfg.id}
          size={18}
          class={active ? '' : 'opacity-50'}
        />
        {cfg.name}
      </button>
    {/each}
  </div>

  <!-- Username inputs for selected platforms -->
  <div class="space-y-2">
    {#each platformConfigs as cfg (cfg.id)}
      {#if selectedPlatforms.includes(cfg.id)}
        <div class="flex items-center gap-3">
          <PlatformIcon
            platform={cfg.id}
            size={16}
            class="shrink-0 text-zinc-400 dark:text-zinc-500"
          />
          <input
            type="text"
            bind:value={usernames[cfg.id]}
            {disabled}
            onkeydown={handleKeydown}
            placeholder={cfg.placeholder}
            class="flex-1 rounded-xl border border-zinc-200 bg-white
                   px-4 py-2.5 text-zinc-900 placeholder-zinc-400
                   focus:border-blue-500 focus:outline-none
                   focus:ring-2 focus:ring-blue-500/20
                   disabled:opacity-50
                   dark:border-zinc-700 dark:bg-zinc-800
                   dark:text-zinc-100
                   dark:placeholder-zinc-500
                   dark:focus:border-blue-400
                   dark:focus:ring-blue-400/20"
          />
        </div>
      {/if}
    {/each}
  </div>

  {#if selectedPlatforms.length === 0}
    <p class="text-xs text-red-500">Select at least one platform.</p>
  {/if}
</div>

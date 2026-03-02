<script lang="ts">
  import ApiKeyInput from './ApiKeyInput.svelte';
  import { providerConfigs, type ProviderId } from '$lib/providers/types.ts';
  import { languages } from '$lib/prompts.ts';

  let {
    open = $bindable(false),
    provider = $bindable<ProviderId>('anthropic'),
    apiKeys = $bindable<Record<ProviderId, string>>({
      anthropic: '',
      openai: '',
      gemini: '',
    }),
    models = $bindable<Record<ProviderId, string>>({
      anthropic: 'claude-sonnet-4-20250514',
      openai: 'gpt-4o',
      gemini: 'gemini-2.5-flash',
    }),
    githubPat = $bindable(''),
    language = $bindable('en'),
  }: {
    open: boolean;
    provider: ProviderId;
    apiKeys: Record<ProviderId, string>;
    models: Record<ProviderId, string>;
    githubPat: string;
    language: string;
  } = $props();

  let activeConfig = $derived(
    providerConfigs.find(p => p.id === provider) ?? providerConfigs[0],
  );

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') open = false;
  }

  const selectClass =
    'w-full rounded-lg border border-zinc-300 bg-white px-4 ' +
    'py-2 text-sm text-zinc-900 ' +
    'focus:border-blue-500 focus:outline-none focus:ring-2 ' +
    'focus:ring-blue-500/20 ' +
    'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 ' +
    'dark:focus:border-blue-400 dark:focus:ring-blue-400/20';
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- backdrop -->
  <div
    class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
    role="button"
    tabindex="-1"
    onclick={() => (open = false)}
    onkeydown={handleKeydown}
  ></div>

  <!-- drawer -->
  <div
    class="fixed right-0 top-0 z-50 h-full w-80 overflow-y-auto
           border-l border-zinc-200 bg-white p-6 shadow-xl
           dark:border-zinc-700 dark:bg-zinc-900"
  >
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Settings
      </h2>
      <button
        type="button"
        onclick={() => (open = false)}
        class="rounded p-1 text-zinc-500 hover:text-zinc-700
               dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        Close
      </button>
    </div>

    <div class="space-y-5">
      <!-- Provider selector -->
      <label class="block">
        <span
          class="mb-1 block text-sm font-medium text-zinc-700
                 dark:text-zinc-300"
        >
          LLM Provider
        </span>
        <select bind:value={provider} class={selectClass}>
          {#each providerConfigs as cfg (cfg.id)}
            <option value={cfg.id}>{cfg.name}</option>
          {/each}
        </select>
      </label>

      <!-- API key for active provider -->
      <ApiKeyInput
        bind:value={apiKeys[provider]}
        label={activeConfig.keyLabel}
        placeholder={activeConfig.keyPlaceholder}
      />

      {#if activeConfig.corsNote}
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          {activeConfig.corsNote}
        </p>
      {/if}

      <!-- Model for active provider -->
      <label class="block">
        <span
          class="mb-1 block text-sm font-medium text-zinc-700
                 dark:text-zinc-300"
        >
          Model
        </span>
        <select bind:value={models[provider]} class={selectClass}>
          {#each activeConfig.models as m (m.id)}
            <option value={m.id}>{m.label}</option>
          {/each}
        </select>
      </label>

      <!-- Language -->
      <label class="block">
        <span
          class="mb-1 block text-sm font-medium text-zinc-700
                 dark:text-zinc-300"
        >
          Response Language
        </span>
        <select bind:value={language} class={selectClass}>
          {#each languages as lang (lang.id)}
            <option value={lang.id}>
              {lang.label} ({lang.nativeName})
            </option>
          {/each}
        </select>
      </label>

      <hr class="border-zinc-200 dark:border-zinc-700" />

      <!-- GitHub PAT -->
      <ApiKeyInput
        bind:value={githubPat}
        label="GitHub PAT (optional, recommended)"
        placeholder="ghp_..."
      />

      <details
        class="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2
               text-xs text-zinc-600
               dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
      >
        <summary class="cursor-pointer font-medium">
          Why a PAT? How to create one?
        </summary>
        <div class="mt-2 space-y-2">
          <p>
            Without a PAT, GitHub limits you to 60 API requests per hour. With
            one, you get 5,000/hr, enabling deeper analysis (PRs, issues,
            comments, cross-repo contributions).
          </p>
          <p class="font-medium">How to create a PAT:</p>
          <ol class="list-decimal pl-4 space-y-1">
            <li>
              Go to
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener"
                class="text-blue-600 underline dark:text-blue-400"
              >
                github.com/settings/tokens
              </a>
            </li>
            <li>Click "Generate new token" (Fine-grained)</li>
            <li>Give it a name like "roast-my-github"</li>
            <li>Set expiration to 7 days</li>
            <li>
              Under "Repository access", select "Public Repositories
              (read-only)"
            </li>
            <li>No extra permissions needed. Click "Generate token"</li>
            <li>Copy and paste it here</li>
          </ol>
          <p>
            The token only needs read access to public repos. It never leaves
            your browser.
          </p>
        </div>
      </details>

      <p class="text-xs text-zinc-500 dark:text-zinc-400">
        Keys are stored in your browser's localStorage and never sent to any
        server except the respective API endpoints.
      </p>
    </div>
  </div>
{/if}

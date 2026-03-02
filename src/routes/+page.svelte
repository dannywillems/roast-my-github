<script lang="ts">
  import UsernameInput from '$lib/components/UsernameInput.svelte';
  import ToneSelector from '$lib/components/ToneSelector.svelte';
  import ScopeSelector from '$lib/components/ScopeSelector.svelte';
  import SettingsDrawer from '$lib/components/SettingsDrawer.svelte';
  import ResultsPanel from '$lib/components/ResultsPanel.svelte';
  import AnalysisSummary from '$lib/components/AnalysisSummary.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';
  import { analyze } from '$lib/analyzer.ts';
  import { defaultScope, type AnalysisScope } from '$lib/github.ts';
  import type { AnalysisMetadata } from '$lib/github.ts';
  import type { ProviderId } from '$lib/providers/types.ts';
  import { providerConfigs } from '$lib/providers/types.ts';
  import {
    getProvider,
    setProvider,
    getApiKey,
    setApiKey,
    getModel,
    setModel,
    getGithubPat,
    setGithubPat,
    getLanguage,
    setLanguage,
    getCustomPersonality,
    setCustomPersonality,
  } from '$lib/storage.ts';

  let username = $state('');
  let selectedTone = $state('recruiter');
  let settingsOpen = $state(false);

  let provider = $state<ProviderId>(getProvider());
  let language = $state(getLanguage());
  let customPersonality = $state(getCustomPersonality());

  let scope = $state<AnalysisScope>({ ...defaultScope });

  // Load saved keys/models for all providers
  let apiKeys = $state<Record<ProviderId, string>>({
    anthropic: getApiKey('anthropic'),
    openai: getApiKey('openai'),
    gemini: getApiKey('gemini'),
  });
  let models = $state<Record<ProviderId, string>>({
    anthropic: getModel('anthropic') || 'claude-sonnet-4-20250514',
    openai: getModel('openai') || 'gpt-4o',
    gemini: getModel('gemini') || 'gemini-2.5-flash',
  });
  let githubPat = $state(getGithubPat());

  let loading = $state(false);
  let progress = $state('');
  let content = $state('');
  let error = $state('');
  let resultsVisible = $state(false);

  // Analysis metadata
  let metadata = $state<AnalysisMetadata | null>(null);
  let tokenEstimate = $state(0);
  let costEstimate = $state('');
  let logs = $state<string[]>([]);

  let abortController: AbortController | null = null;

  // Persist all settings
  $effect(() => setProvider(provider));
  $effect(() => setLanguage(language));
  $effect(() => setGithubPat(githubPat));
  $effect(() => setCustomPersonality(customPersonality));
  $effect(() => {
    for (const id of ['anthropic', 'openai', 'gemini'] as const) {
      setApiKey(id, apiKeys[id]);
      setModel(id, models[id]);
    }
  });

  let activeProviderName = $derived(
    providerConfigs.find(p => p.id === provider)?.name ?? provider,
  );

  let currentApiKey = $derived(apiKeys[provider]);

  async function handleAnalyze(): Promise<void> {
    if (!username.trim()) return;
    if (!currentApiKey.trim()) {
      settingsOpen = true;
      return;
    }

    loading = true;
    progress = '';
    content = '';
    error = '';
    resultsVisible = true;
    metadata = null;
    tokenEstimate = 0;
    costEstimate = '';
    logs = [];

    abortController = new AbortController();

    await analyze(
      username.trim(),
      selectedTone,
      provider,
      currentApiKey,
      models[provider],
      language,
      githubPat || undefined,
      scope,
      customPersonality || undefined,
      {
        onProgress: (msg: string) => {
          progress = msg;
        },
        onChunk: (text: string) => {
          progress = '';
          content += text;
        },
        onError: (err: string) => {
          error = err;
          loading = false;
        },
        onDone: () => {
          loading = false;
        },
        onLog: (msg: string) => {
          logs = [...logs, `[${new Date().toLocaleTimeString()}] ${msg}`];
        },
        onMetadata: (m: AnalysisMetadata, tokens: number, cost: string) => {
          metadata = m;
          tokenEstimate = tokens;
          costEstimate = cost;
        },
      },
      abortController.signal,
    );
  }

  function handleCancel(): void {
    abortController?.abort();
    loading = false;
  }

  let showPersonality = $state(false);
</script>

<div class="mx-auto max-w-3xl px-4 py-12">
  <!-- Header -->
  <header class="mb-10 flex items-start justify-between">
    <div>
      <h1
        class="text-3xl font-bold tracking-tight text-zinc-900
               dark:text-zinc-100"
      >
        Roast My GitHub
      </h1>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        AI-powered developer profiling. Reads actual code, PRs, issues, and
        commit messages.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <ThemeToggle />
      <button
        type="button"
        onclick={() => (settingsOpen = true)}
        class="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs
               font-medium text-zinc-600 transition-colors
               hover:border-zinc-400 hover:text-zinc-800
               dark:border-zinc-600 dark:text-zinc-400
               dark:hover:border-zinc-500 dark:hover:text-zinc-200"
      >
        Settings
      </button>
    </div>
  </header>

  <!-- Input section -->
  <section class="space-y-5">
    <UsernameInput
      bind:value={username}
      disabled={loading}
      onsubmit={handleAnalyze}
    />

    <ToneSelector bind:selected={selectedTone} />

    <LanguageSelector bind:selected={language} />

    <ScopeSelector bind:scope />

    <!-- Custom personality -->
    <div>
      <button
        type="button"
        onclick={() => (showPersonality = !showPersonality)}
        class="text-xs font-medium text-blue-600 hover:text-blue-700
               dark:text-blue-400 dark:hover:text-blue-300"
      >
        {showPersonality ? 'Hide' : 'Add'} custom personality instructions
      </button>
      {#if showPersonality}
        <div class="mt-2">
          <textarea
            bind:value={customPersonality}
            placeholder="e.g. 'You are a pirate captain who speaks in nautical terms' or 'Focus especially on security practices and test coverage' or 'Be extremely sarcastic about JavaScript frameworks'"
            rows="3"
            class="w-full rounded-lg border border-zinc-300 bg-white
                   px-4 py-2 text-sm text-zinc-900
                   placeholder:text-zinc-400
                   focus:border-blue-500 focus:outline-none
                   focus:ring-2 focus:ring-blue-500/20
                   dark:border-zinc-700 dark:bg-zinc-800
                   dark:text-zinc-100
                   dark:placeholder:text-zinc-500
                   dark:focus:border-blue-400
                   dark:focus:ring-blue-400/20"
          ></textarea>
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Add any custom instructions for the AI. This will be appended to the
            selected tone's personality.
          </p>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        onclick={handleAnalyze}
        disabled={loading || !username.trim()}
        class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm
               font-medium text-white transition-colors
               hover:bg-blue-700
               disabled:cursor-not-allowed disabled:opacity-50
               dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {#if loading}
        <button
          type="button"
          onclick={handleCancel}
          class="rounded-lg border border-zinc-300 px-4 py-2.5
                 text-sm text-zinc-600 transition-colors
                 hover:border-zinc-400 dark:border-zinc-600
                 dark:text-zinc-400 dark:hover:border-zinc-500"
        >
          Cancel
        </button>
      {/if}

      {#if !loading}
        <span class="text-xs text-zinc-400 dark:text-zinc-500">
          via {activeProviderName}
        </span>
      {/if}
    </div>
  </section>

  <!-- Analysis metadata / summary -->
  {#if metadata || logs.length > 0}
    <section class="mt-6">
      <AnalysisSummary {metadata} {tokenEstimate} {costEstimate} {logs} />
    </section>
  {/if}

  <!-- Results -->
  <section class="mt-4">
    <ResultsPanel
      {content}
      {progress}
      {error}
      {loading}
      visible={resultsVisible}
    />
  </section>
</div>

<!-- Settings drawer -->
<SettingsDrawer
  bind:open={settingsOpen}
  bind:provider
  bind:apiKeys
  bind:models
  bind:githubPat
  bind:language
/>

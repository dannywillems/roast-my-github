<script lang="ts">
  import PlatformSelector from '$lib/components/PlatformSelector.svelte';
  import ToneSelector from '$lib/components/ToneSelector.svelte';
  import ScopeSelector from '$lib/components/ScopeSelector.svelte';
  import SettingsDrawer from '$lib/components/SettingsDrawer.svelte';
  import ResultsPanel from '$lib/components/ResultsPanel.svelte';
  import AnalysisSummary from '$lib/components/AnalysisSummary.svelte';
  import FollowUpPanel from '$lib/components/FollowUpPanel.svelte';
  import ConversationHistory from '$lib/components/ConversationHistory.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';
  import PlatformIcon from '$lib/components/PlatformIcon.svelte';
  import { t } from '$lib/i18n';
  import { languages } from '$lib/prompts';
  import { analyze, followUpAnalyze } from '$lib/analyzer';
  import {
    defaultScope,
    type AnalysisScope,
    type AnalysisMetadata,
    type PlatformId,
    type PlatformInput,
    type MultiPlatformData,
    type FollowUpType,
    type ConversationEntry,
  } from '$lib/platforms/types';
  import type { ProviderId } from '$lib/providers/types';
  import { providerConfigs } from '$lib/providers/types';
  import {
    getProvider,
    setProvider,
    getApiKey,
    setApiKey,
    getModel,
    setModel,
    getSelectedPlatforms,
    setSelectedPlatforms,
    getPlatformUsername,
    setPlatformUsername,
    getPlatformPat,
    setPlatformPat,
    getLanguage,
    setLanguage,
    getCustomPersonality,
    setCustomPersonality,
    getConversation,
    addConversationEntry,
    clearConversation,
  } from '$lib/storage';

  let selectedTone = $state('recruiter');
  let settingsOpen = $state(false);

  let provider = $state<ProviderId>(getProvider());
  let language = $state(getLanguage());
  let customPersonality = $state(getCustomPersonality());

  // i18n: reactive translations based on selected language
  let i = $derived(t(language));

  let scope = $state<AnalysisScope>({ ...defaultScope });

  // Multi-platform state
  let selectedPlatforms = $state<PlatformId[]>(getSelectedPlatforms());
  let usernames = $state<Record<PlatformId, string>>({
    github: getPlatformUsername('github'),
    gitlab: getPlatformUsername('gitlab'),
    codeberg: getPlatformUsername('codeberg'),
    bitbucket: getPlatformUsername('bitbucket'),
  });
  let platformPats = $state<Record<PlatformId, string>>({
    github: getPlatformPat('github'),
    gitlab: getPlatformPat('gitlab'),
    codeberg: getPlatformPat('codeberg'),
    bitbucket: getPlatformPat('bitbucket'),
  });

  // Load saved keys/models for all LLM providers
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

  // Multi-platform data (retained for follow-ups)
  let lastMultiData = $state<MultiPlatformData | null>(null);

  // Conversation history
  let conversation = $state<ConversationEntry[]>(getConversation());

  let abortController: AbortController | null = null;

  // Advanced options toggle
  let showAdvanced = $state(false);

  // Language switcher dropdown
  let showLangMenu = $state(false);
  let allLanguages = languages;
  let currentLangLabel = $derived(
    languages.find(l => l.id === language)?.nativeName ?? 'English',
  );

  // Persist all settings
  $effect(() => setProvider(provider));
  $effect(() => setLanguage(language));
  $effect(() => setCustomPersonality(customPersonality));
  $effect(() => setSelectedPlatforms(selectedPlatforms));
  $effect(() => {
    for (const id of ['anthropic', 'openai', 'gemini'] as const) {
      setApiKey(id, apiKeys[id]);
      setModel(id, models[id]);
    }
  });
  $effect(() => {
    for (const id of ['github', 'gitlab', 'codeberg', 'bitbucket'] as const) {
      setPlatformUsername(id, usernames[id]);
      setPlatformPat(id, platformPats[id]);
    }
  });

  let activeProviderName = $derived(
    providerConfigs.find(p => p.id === provider)?.name ?? provider,
  );

  let currentApiKey = $derived(apiKeys[provider]);

  // Build platform inputs from current state
  function buildPlatformInputs(): PlatformInput[] {
    return selectedPlatforms
      .filter(p => usernames[p].trim() !== '')
      .map(p => ({
        platform: p,
        username: usernames[p].trim(),
        pat: platformPats[p] || undefined,
      }));
  }

  let hasValidInput = $derived(
    selectedPlatforms.some(p => usernames[p].trim() !== ''),
  );

  async function handleAnalyze(): Promise<void> {
    const inputs = buildPlatformInputs();
    if (inputs.length === 0) return;
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
    lastMultiData = null;

    abortController = new AbortController();

    const result = await analyze(
      inputs,
      selectedTone,
      provider,
      currentApiKey,
      models[provider],
      language,
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
          if (content) {
            const entry: ConversationEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              type: 'initial',
              platformInputs: inputs,
              scope: { ...scope },
              toneId: selectedTone,
              prompt: '',
              response: content,
              metadata: {
                tokenEstimate,
                costEstimate,
              },
            };
            addConversationEntry(entry);
            conversation = getConversation();
          }
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

    if (result) {
      lastMultiData = result;
    }
  }

  async function handleFollowUp(
    type: FollowUpType,
    context?: Record<string, unknown>,
  ): Promise<void> {
    if (!lastMultiData || !content) return;
    if (!currentApiKey.trim()) {
      settingsOpen = true;
      return;
    }

    const previousResponse = content;
    const inputs = buildPlatformInputs();

    loading = true;
    progress = '';
    content = '';
    error = '';
    metadata = null;
    logs = [];

    abortController = new AbortController();

    await followUpAnalyze(
      {
        type,
        repoFullName: context?.repoFullName as string | undefined,
        timeFrameDays: context?.timeFrameDays as number | undefined,
        customPrompt: context?.customPrompt as string | undefined,
      },
      inputs,
      previousResponse,
      lastMultiData,
      selectedTone,
      provider,
      currentApiKey,
      models[provider],
      language,
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
          if (content) {
            const entry: ConversationEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              type: 'follow-up',
              platformInputs: inputs,
              scope: { ...scope },
              toneId: selectedTone,
              prompt: '',
              response: content,
              metadata: {
                tokenEstimate,
                costEstimate,
                followUpType: type,
              },
            };
            addConversationEntry(entry);
            conversation = getConversation();
          }
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

  function handleClearConversation(): void {
    clearConversation();
    conversation = [];
  }

  // Collect all repo details from last analysis for follow-up
  let allRepoDetails = $derived(
    lastMultiData?.platforms.flatMap(p => p.repoDetails) ?? [],
  );
</script>

<div class="min-h-screen bg-zinc-50 dark:bg-zinc-900">
  <!-- Top bar -->
  <nav
    class="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80
           backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80"
  >
    <div
      class="mx-auto flex max-w-4xl items-center justify-between
             px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span class="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {i.appName}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <!-- Language switcher -->
        <div class="relative">
          <button
            type="button"
            onclick={() => (showLangMenu = !showLangMenu)}
            class="rounded-lg border border-zinc-200 px-2.5 py-1.5
                   text-xs font-medium text-zinc-600 transition-colors
                   hover:border-zinc-300 hover:text-zinc-800
                   dark:border-zinc-700 dark:text-zinc-400
                   dark:hover:border-zinc-600 dark:hover:text-zinc-200"
            title={i.responseLang}
          >
            {currentLangLabel}
          </button>
          {#if showLangMenu}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="fixed inset-0 z-40"
              onclick={() => (showLangMenu = false)}
              onkeydown={() => {}}
            ></div>
            <div
              class="absolute right-0 top-full z-50 mt-1 w-44
                     rounded-lg border border-zinc-200 bg-white
                     py-1 shadow-lg
                     dark:border-zinc-700 dark:bg-zinc-800"
            >
              {#each allLanguages as lang (lang.id)}
                <button
                  type="button"
                  onclick={() => {
                    language = lang.id;
                    showLangMenu = false;
                  }}
                  class="flex w-full items-center justify-between
                         px-3 py-1.5 text-left text-xs
                         transition-colors
                         {language === lang.id
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700'}"
                >
                  <span>{lang.label}</span>
                  <span class="text-zinc-400 dark:text-zinc-500">
                    {lang.nativeName}
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        <ThemeToggle />
        <button
          type="button"
          onclick={() => (settingsOpen = true)}
          class="rounded-lg border border-zinc-200 px-3 py-1.5
                 text-xs font-medium text-zinc-600 transition-colors
                 hover:border-zinc-300 hover:text-zinc-800
                 dark:border-zinc-700 dark:text-zinc-400
                 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
        >
          {i.settings}
        </button>
      </div>
    </div>
  </nav>

  <main class="mx-auto max-w-4xl px-4 py-8 sm:py-12">
    <!-- Hero section -->
    {#if !resultsVisible}
      <div class="mb-10 text-center sm:mb-14">
        <!-- Platform icons row with brand colors -->
        <div class="mb-6 flex items-center justify-center gap-5">
          <PlatformIcon
            platform="github"
            size={28}
            class="text-zinc-800 dark:text-zinc-200"
          />
          <PlatformIcon platform="gitlab" size={28} class="text-orange-500" />
          <PlatformIcon
            platform="codeberg"
            size={28}
            class="text-green-600 dark:text-green-400"
          />
          <PlatformIcon
            platform="bitbucket"
            size={28}
            class="text-blue-600 dark:text-blue-400"
          />
        </div>

        <h1
          class="text-3xl font-bold tracking-tight text-zinc-900
                 sm:text-4xl dark:text-zinc-100"
        >
          {i.heroTitle}
        </h1>
        <p
          class="mx-auto mt-3 max-w-lg text-base text-zinc-500
                 sm:text-lg dark:text-zinc-400"
        >
          {i.heroSubtitle}
        </p>
      </div>
    {/if}

    <!-- Input section -->
    <section
      class="rounded-2xl border border-zinc-200 bg-white p-5
             shadow-sm sm:p-6
             dark:border-zinc-800 dark:bg-zinc-800/50"
    >
      <div class="space-y-5">
        <PlatformSelector
          bind:selectedPlatforms
          bind:usernames
          disabled={loading}
          onsubmit={handleAnalyze}
        />

        <!-- Tone picker -->
        <div>
          <h2
            class="mb-3 text-sm font-semibold text-zinc-700
                   dark:text-zinc-300"
          >
            {i.chooseTone}
          </h2>
          <ToneSelector bind:selected={selectedTone} {language} />
        </div>

        <!-- Advanced options (collapsed by default) -->
        <div>
          <button
            type="button"
            onclick={() => (showAdvanced = !showAdvanced)}
            class="flex items-center gap-1.5 text-xs font-medium
                   text-zinc-500 transition-colors
                   hover:text-zinc-700
                   dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg
              class="h-3 w-3 transition-transform
                     {showAdvanced ? 'rotate-90' : ''}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            {i.advancedOptions}
          </button>

          {#if showAdvanced}
            <div
              class="mt-3 space-y-4 rounded-xl border border-zinc-200
                     bg-zinc-50 p-4
                     dark:border-zinc-700 dark:bg-zinc-800/30"
            >
              <LanguageSelector bind:selected={language} />

              <ScopeSelector bind:scope {language} />

              <!-- Custom personality -->
              <div>
                <label class="block">
                  <span
                    class="mb-1 block text-sm font-medium
                           text-zinc-700 dark:text-zinc-300"
                  >
                    {i.customPersonality}
                  </span>
                  <textarea
                    bind:value={customPersonality}
                    placeholder={i.customPersonalityPlaceholder}
                    rows="2"
                    class="w-full rounded-xl border border-zinc-200
                           bg-white px-4 py-2.5 text-sm text-zinc-900
                           placeholder:text-zinc-400
                           focus:border-blue-500 focus:outline-none
                           focus:ring-2 focus:ring-blue-500/20
                           dark:border-zinc-700 dark:bg-zinc-800
                           dark:text-zinc-100
                           dark:placeholder:text-zinc-500
                           dark:focus:border-blue-400
                           dark:focus:ring-blue-400/20"
                  ></textarea>
                </label>
              </div>
            </div>
          {/if}
        </div>

        <!-- Action row -->
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onclick={handleAnalyze}
            disabled={loading || !hasValidInput}
            class="rounded-xl bg-amber-600 px-6 py-2.5 text-sm
                   font-semibold text-white shadow-sm
                   transition-all hover:bg-amber-700
                   hover:shadow-md
                   disabled:cursor-not-allowed disabled:opacity-50
                   dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            {loading ? i.analyzing : i.analyze}
          </button>

          {#if loading}
            <button
              type="button"
              onclick={handleCancel}
              class="rounded-xl border border-zinc-200 px-4 py-2.5
                     text-sm text-zinc-600 transition-colors
                     hover:border-zinc-300
                     dark:border-zinc-700 dark:text-zinc-400
                     dark:hover:border-zinc-600"
            >
              {i.cancel}
            </button>
          {/if}

          {#if !loading}
            <span class="text-xs text-zinc-400 dark:text-zinc-500">
              {i.via}
              {activeProviderName}
            </span>
          {/if}
        </div>
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

    <!-- Follow-up panel (after analysis completes) -->
    {#if !loading && content && lastMultiData}
      <section class="mt-4">
        <FollowUpPanel
          repoDetails={allRepoDetails}
          platformCount={lastMultiData.platforms.length}
          onaction={handleFollowUp}
        />
      </section>
    {/if}

    <!-- Conversation history -->
    {#if conversation.length > 0}
      <section class="mt-6">
        <ConversationHistory
          entries={conversation}
          onclear={handleClearConversation}
        />
      </section>
    {/if}
  </main>

  <!-- Footer -->
  <footer
    class="border-t border-zinc-200 py-8
           dark:border-zinc-800"
  >
    <div class="mx-auto max-w-4xl px-4">
      <div
        class="flex flex-col items-center gap-4 sm:flex-row
               sm:justify-between"
      >
        <!-- Author info -->
        <div class="text-center sm:text-left">
          <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Built by
            <a
              href="https://github.com/dannywillems"
              target="_blank"
              rel="noopener noreferrer"
              class="text-amber-600 hover:underline dark:text-amber-400"
              >Danny Willems</a
            >
          </p>
          <p
            class="mt-1 max-w-sm text-xs text-zinc-400
                   dark:text-zinc-500"
          >
            Cryptographer, security researcher, and open-source contributor.
            Building tools to make developer assessment transparent and fun.
          </p>
        </div>

        <!-- Social links -->
        <div class="flex items-center gap-4">
          <a
            href="https://github.com/dannywillems"
            target="_blank"
            rel="noopener noreferrer"
            class="text-zinc-400 transition-colors hover:text-zinc-700
                   dark:text-zinc-500 dark:hover:text-zinc-300"
            title="GitHub"
          >
            <PlatformIcon platform="github" size={20} />
          </a>
          <a
            href="https://x.com/dwillems42"
            target="_blank"
            rel="noopener noreferrer"
            class="text-zinc-400 transition-colors hover:text-zinc-700
                   dark:text-zinc-500 dark:hover:text-zinc-300"
            title="X (Twitter)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M18.244 2.25h3.308l-7.227 8.26
                   8.502 11.24H16.17l-5.214-6.817L4.99
                   21.75H1.68l7.73-8.835L1.254
                   2.25H8.08l4.713 6.231zm-1.161
                   17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
          </a>
          <a
            href="https://dannywillems.github.io"
            target="_blank"
            rel="noopener noreferrer"
            class="text-zinc-400 transition-colors hover:text-zinc-700
                   dark:text-zinc-500 dark:hover:text-zinc-300"
            title="Website"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path
                d="M12 2a15.3 15.3 0 014 10
                   15.3 15.3 0 01-4 10
                   15.3 15.3 0 01-4-10
                   15.3 15.3 0 014-10z"
              />
            </svg>
          </a>
        </div>
      </div>

      <p
        class="mt-4 text-center text-[11px] text-zinc-400
               dark:text-zinc-600"
      >
        {i.footerPrivacy}
      </p>
    </div>
  </footer>
</div>

<!-- Settings drawer -->
<SettingsDrawer
  bind:open={settingsOpen}
  bind:provider
  bind:apiKeys
  bind:models
  bind:platformPats
  {selectedPlatforms}
  bind:language
/>

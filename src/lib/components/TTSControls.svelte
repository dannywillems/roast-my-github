<script lang="ts">
  import { browserTTS } from '$lib/tts/browser';
  import { openaiTTS } from '$lib/tts/openai';
  import { elevenlabsTTS } from '$lib/tts/elevenlabs';
  import {
    ttsConfigs,
    type TTSProvider,
    type TTSProviderId,
    type TTSControl,
    type TTSVoice,
  } from '$lib/tts/types';
  import {
    getTTSProvider,
    setTTSProvider,
    getTTSKey,
    setTTSKey,
    getTTSVoice,
    setTTSVoice,
  } from '$lib/storage';

  let { text = '' }: { text: string } = $props();

  const providerMap: Record<TTSProviderId, TTSProvider> = {
    browser: browserTTS,
    openai: openaiTTS,
    elevenlabs: elevenlabsTTS,
  };

  let selectedProvider = $state<TTSProviderId>(
    getTTSProvider() as TTSProviderId,
  );
  let apiKey = $state(getTTSKey(selectedProvider));
  let selectedVoice = $state(getTTSVoice(selectedProvider));
  let showSettings = $state(false);

  let playing = $state(false);
  let paused = $state(false);
  let error = $state('');
  let control: TTSControl | null = null;

  let voices = $state<TTSVoice[]>([]);

  // Load voices when provider changes
  $effect(() => {
    const provider = providerMap[selectedProvider];
    voices = provider.getVoices();
    apiKey = getTTSKey(selectedProvider);
    selectedVoice = getTTSVoice(selectedProvider) || voices[0]?.id || '';
  });

  // For browser TTS, voices load async
  $effect(() => {
    if (selectedProvider !== 'browser') return;
    if (typeof window === 'undefined') return;
    const handler = (): void => {
      voices = browserTTS.getVoices();
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0].id;
      }
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Try loading immediately too
    handler();
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    };
  });

  // Persist settings
  $effect(() => setTTSProvider(selectedProvider));
  $effect(() => setTTSKey(selectedProvider, apiKey));
  $effect(() => setTTSVoice(selectedProvider, selectedVoice));

  let activeConfig = $derived(
    ttsConfigs.find(c => c.id === selectedProvider) ?? ttsConfigs[0],
  );

  function handlePlay(): void {
    if (!text.trim()) return;
    const provider = providerMap[selectedProvider];
    if (provider.needsKey && !apiKey.trim()) {
      error = `Please enter an API key for ${provider.name}`;
      showSettings = true;
      return;
    }

    error = '';
    control = provider.speak(
      text,
      selectedVoice,
      apiKey,
      () => {
        playing = true;
        paused = false;
      },
      () => {
        playing = false;
        paused = false;
        control = null;
      },
      (err: string) => {
        error = err;
        playing = false;
        paused = false;
        control = null;
      },
    );
  }

  function handlePause(): void {
    if (control) {
      control.pause();
      paused = true;
    }
  }

  function handleResume(): void {
    if (control) {
      control.resume();
      paused = false;
    }
  }

  function handleStop(): void {
    if (control) {
      control.stop();
      control = null;
    }
    playing = false;
    paused = false;
  }

  const btnClass =
    'rounded-lg border border-zinc-300 px-3 py-1.5 text-xs ' +
    'font-medium text-zinc-600 transition-colors ' +
    'hover:border-zinc-400 hover:text-zinc-800 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 ' +
    'dark:border-zinc-600 dark:text-zinc-400 ' +
    'dark:hover:border-zinc-500 dark:hover:text-zinc-200';

  const selectClass =
    'rounded-lg border border-zinc-300 bg-white px-3 py-1.5 ' +
    'text-xs text-zinc-900 ' +
    'focus:border-blue-500 focus:outline-none ' +
    'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';

  const inputClass =
    'w-full rounded-lg border border-zinc-300 bg-white px-3 ' +
    'py-1.5 text-xs text-zinc-900 ' +
    'focus:border-blue-500 focus:outline-none ' +
    'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100';
</script>

<div class="flex flex-col gap-2">
  <div class="flex flex-wrap items-center gap-2">
    <!-- Play/Pause/Stop buttons -->
    {#if !playing}
      <button
        type="button"
        onclick={handlePlay}
        disabled={!text.trim()}
        class={btnClass}
      >
        Play
      </button>
    {:else if paused}
      <button type="button" onclick={handleResume} class={btnClass}>
        Resume
      </button>
      <button type="button" onclick={handleStop} class={btnClass}>
        Stop
      </button>
    {:else}
      <button type="button" onclick={handlePause} class={btnClass}>
        Pause
      </button>
      <button type="button" onclick={handleStop} class={btnClass}>
        Stop
      </button>
    {/if}

    <!-- Provider selector -->
    <select bind:value={selectedProvider} class={selectClass}>
      {#each ttsConfigs as cfg (cfg.id)}
        <option value={cfg.id}>{cfg.name}</option>
      {/each}
    </select>

    <!-- Voice selector -->
    {#if voices.length > 1}
      <select bind:value={selectedVoice} class={selectClass}>
        {#each voices as v (v.id)}
          <option value={v.id}>{v.label}</option>
        {/each}
      </select>
    {/if}

    <!-- Settings toggle for API key providers -->
    {#if activeConfig.needsKey}
      <button
        type="button"
        onclick={() => (showSettings = !showSettings)}
        class="{btnClass} {!apiKey.trim()
          ? 'border-amber-400 text-amber-600 dark:border-amber-500 dark:text-amber-400'
          : ''}"
      >
        {showSettings ? 'Hide' : 'Key'}
      </button>
    {/if}
  </div>

  <!-- API key input (collapsible) -->
  {#if showSettings && activeConfig.needsKey}
    <div class="flex items-center gap-2">
      <input
        type="password"
        bind:value={apiKey}
        placeholder={activeConfig.keyPlaceholder}
        class={inputClass}
      />
    </div>
    {#if activeConfig.corsNote}
      <p class="text-xs text-amber-600 dark:text-amber-400">
        {activeConfig.corsNote}
      </p>
    {/if}
  {/if}

  <!-- Error -->
  {#if error}
    <p class="text-xs text-red-600 dark:text-red-400">{error}</p>
  {/if}
</div>

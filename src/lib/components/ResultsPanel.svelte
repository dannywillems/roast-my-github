<script lang="ts">
  import { marked } from 'marked';
  import TTSControls from './TTSControls.svelte';

  let {
    content = '',
    progress = '',
    error = '',
    loading = false,
    visible = false,
  }: {
    content: string;
    progress: string;
    error: string;
    loading: boolean;
    visible: boolean;
  } = $props();

  type TabId = 'rendered' | 'markdown';
  let activeTab: TabId = $state('rendered');

  let renderedHtml = $derived.by(() => {
    if (!content) return '';
    return marked.parse(content, { async: false }) as string;
  });
</script>

{#if visible}
  <div
    class="rounded-lg border border-zinc-200 bg-white p-6
           dark:border-zinc-700 dark:bg-zinc-800"
  >
    {#if error}
      <div
        class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm
               text-red-700 dark:border-red-800 dark:bg-red-950
               dark:text-red-300"
      >
        {error}
      </div>
    {/if}

    {#if loading && progress}
      <div
        class="flex items-center gap-2 text-sm text-zinc-500
                  dark:text-zinc-400"
      >
        <div
          class="h-4 w-4 animate-spin rounded-full border-2
                 border-zinc-300 border-t-blue-500
                 dark:border-zinc-600 dark:border-t-blue-400"
        ></div>
        {progress}
      </div>
    {/if}

    {#if content}
      <!-- TTS controls -->
      {#if !loading}
        <div class="mb-4">
          <TTSControls text={content} />
        </div>
      {/if}

      <!-- Tab switcher -->
      <div
        class="mb-4 flex gap-1 border-b border-zinc-200
                  dark:border-zinc-700"
      >
        <button
          class="px-4 py-2 text-sm font-medium transition-colors
                 {activeTab === 'rendered'
            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}"
          onclick={() => (activeTab = 'rendered')}
        >
          Rendered
        </button>
        <button
          class="px-4 py-2 text-sm font-medium transition-colors
                 {activeTab === 'markdown'
            ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}"
          onclick={() => (activeTab = 'markdown')}
        >
          Markdown
        </button>
      </div>

      <!-- Tab content -->
      {#if activeTab === 'rendered'}
        <div
          class="prose prose-zinc max-w-none dark:prose-invert
                 prose-a:text-blue-600 prose-a:underline
                 dark:prose-a:text-blue-400
                 prose-headings:mt-6 prose-headings:mb-2
                 prose-p:my-2 prose-li:my-0.5
                 prose-code:rounded prose-code:bg-zinc-100
                 prose-code:px-1 prose-code:py-0.5
                 dark:prose-code:bg-zinc-700
                 prose-pre:bg-zinc-50 dark:prose-pre:bg-zinc-900
                 text-sm leading-relaxed"
        >
          {@html renderedHtml}
        </div>
      {:else}
        <div
          class="whitespace-pre-wrap text-sm leading-relaxed
                    font-mono text-zinc-700 dark:text-zinc-300
                    bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4
                    overflow-x-auto"
        >
          {content}
        </div>
      {/if}
    {/if}

    {#if loading && content}
      <span class="mt-1 inline-block h-4 w-1 animate-pulse bg-blue-500"></span>
    {/if}
  </div>
{/if}

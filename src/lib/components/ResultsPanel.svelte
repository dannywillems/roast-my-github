<script lang="ts">
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
      <div class="prose prose-zinc max-w-none dark:prose-invert">
        <!-- Render as preformatted text with whitespace preserved -->
        <div class="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </div>
      </div>
    {/if}

    {#if loading && content}
      <span class="mt-1 inline-block h-4 w-1 animate-pulse bg-blue-500"></span>
    {/if}
  </div>
{/if}

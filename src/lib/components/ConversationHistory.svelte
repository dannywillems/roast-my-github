<script lang="ts">
  import { Marked } from 'marked';
  import type { ConversationEntry } from '$lib/platforms/types';
  import {
    exportConversationAsMarkdown,
    exportConversationAsText,
    exportConversationAsHtml,
    downloadFile,
  } from '$lib/storage';

  let {
    entries = [],
    onclear,
  }: {
    entries: ConversationEntry[];
    onclear: () => void;
  } = $props();

  let expandedId = $state<string | null>(null);
  let showExportMenu = $state(false);

  // Custom marked instance
  const renderer = {
    link({ href, text }: { href: string; text: string }): string {
      const safeHref = href ?? '#';
      return (
        `<a href="${safeHref}" target="_blank" ` +
        `rel="noopener noreferrer">${text}</a>`
      );
    },
  };
  const md = new Marked({ renderer, breaks: true, gfm: true });

  function toggle(id: string): void {
    expandedId = expandedId === id ? null : id;
  }

  function datePrefix(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function handleExportMarkdown(): void {
    const text = exportConversationAsMarkdown(entries);
    downloadFile(text, `analysis-${datePrefix()}.md`, 'text/markdown');
    showExportMenu = false;
  }

  function handleExportText(): void {
    const text = exportConversationAsText(entries);
    downloadFile(text, `analysis-${datePrefix()}.txt`, 'text/plain');
    showExportMenu = false;
  }

  function handleExportHtml(): void {
    const htmls = entries.map(
      e => md.parse(e.response, { async: false }) as string,
    );
    const html = exportConversationAsHtml(entries, htmls);
    downloadFile(html, `analysis-${datePrefix()}.html`, 'text/html');
    showExportMenu = false;
  }

  function handlePrint(): void {
    // Open a print-friendly HTML version in a new tab
    const htmls = entries.map(
      e => md.parse(e.response, { async: false }) as string,
    );
    const html = exportConversationAsHtml(entries, htmls);
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      // Slight delay so the browser renders before print dialog
      setTimeout(() => w.print(), 300);
    }
    showExportMenu = false;
  }

  function formatTime(ts: string): string {
    return ts.slice(0, 19).replace('T', ' ');
  }

  const btnClass =
    'rounded border border-zinc-300 px-2 py-1 text-xs ' +
    'text-zinc-600 transition-colors hover:border-zinc-400 ' +
    'hover:text-zinc-800 dark:border-zinc-600 dark:text-zinc-400 ' +
    'dark:hover:border-zinc-500 dark:hover:text-zinc-200';
</script>

{#if entries.length > 0}
  <div
    class="rounded-2xl border border-zinc-200 bg-white p-5
           dark:border-zinc-800 dark:bg-zinc-800/50"
  >
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3
        class="text-sm font-semibold text-zinc-700
               dark:text-zinc-300"
      >
        Conversation ({entries.length})
      </h3>
      <div class="flex flex-wrap gap-2">
        <!-- Export dropdown -->
        <div class="relative">
          <button
            type="button"
            onclick={() => (showExportMenu = !showExportMenu)}
            class={btnClass}
          >
            Export
          </button>
          {#if showExportMenu}
            <div
              class="absolute right-0 top-full z-10 mt-1 w-40
                     rounded-lg border border-zinc-200 bg-white
                     py-1 shadow-lg
                     dark:border-zinc-700 dark:bg-zinc-800"
            >
              <button
                type="button"
                onclick={handleExportMarkdown}
                class="block w-full px-3 py-1.5 text-left text-xs
                       text-zinc-700 hover:bg-zinc-50
                       dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Markdown (.md)
              </button>
              <button
                type="button"
                onclick={handleExportText}
                class="block w-full px-3 py-1.5 text-left text-xs
                       text-zinc-700 hover:bg-zinc-50
                       dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Plain text (.txt)
              </button>
              <button
                type="button"
                onclick={handleExportHtml}
                class="block w-full px-3 py-1.5 text-left text-xs
                       text-zinc-700 hover:bg-zinc-50
                       dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                HTML (.html)
              </button>
              <button
                type="button"
                onclick={handlePrint}
                class="block w-full px-3 py-1.5 text-left text-xs
                       text-zinc-700 hover:bg-zinc-50
                       dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Print / PDF
              </button>
            </div>
          {/if}
        </div>
        <button
          type="button"
          onclick={onclear}
          class="rounded border border-red-300 px-2 py-1
                 text-xs text-red-600 transition-colors
                 hover:border-red-400 hover:bg-red-50
                 dark:border-red-700 dark:text-red-400
                 dark:hover:border-red-600
                 dark:hover:bg-red-950"
        >
          Clear
        </button>
      </div>
    </div>

    <div class="space-y-2">
      {#each entries as entry (entry.id)}
        <div
          class="rounded-lg border border-zinc-100
                 dark:border-zinc-700"
        >
          <!-- Header (always visible) -->
          <button
            type="button"
            onclick={() => toggle(entry.id)}
            class="flex w-full flex-wrap items-center
                   justify-between gap-1 px-3 py-2
                   text-left text-xs hover:bg-zinc-50
                   dark:hover:bg-zinc-700/50"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded px-1.5 py-0.5 text-[10px]
                       font-medium
                       {entry.type === 'initial'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'}"
              >
                {entry.type === 'initial' ? 'Initial' : 'Follow-up'}
              </span>
              <span class="text-zinc-600 dark:text-zinc-400">
                {entry.platformInputs
                  .map(p => `${p.platform}/@${p.username}`)
                  .join(', ')}
              </span>
              {#if entry.metadata.followUpType}
                <span class="text-zinc-400 dark:text-zinc-500">
                  ({entry.metadata.followUpType})
                </span>
              {/if}
            </div>
            <span class="text-zinc-400 dark:text-zinc-500">
              {formatTime(entry.timestamp)}
            </span>
          </button>

          <!-- Expanded content -->
          {#if expandedId === entry.id}
            <div
              class="border-t border-zinc-100 px-3 py-3
                     dark:border-zinc-700"
            >
              <div
                class="mb-2 flex flex-wrap gap-3 text-[11px]
                       text-zinc-400 dark:text-zinc-500"
              >
                <span>Tone: {entry.toneId}</span>
                <span>
                  ~{entry.metadata.tokenEstimate.toLocaleString()} tokens
                </span>
                <span>Cost: {entry.metadata.costEstimate}</span>
              </div>
              <article
                class="prose prose-sm prose-zinc max-w-none
                       dark:prose-invert
                       prose-a:text-blue-600
                       dark:prose-a:text-blue-400"
              >
                {@html md.parse(entry.response, { async: false })}
              </article>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

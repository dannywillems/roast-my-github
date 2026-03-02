<script lang="ts">
  import { languages } from '$lib/prompts';
  import { t } from '$lib/i18n';

  let {
    selected = $bindable('en'),
  }: {
    selected: string;
  } = $props();

  let i = $derived(t(selected));
</script>

<label class="block">
  <span
    class="mb-1 block text-sm font-medium text-zinc-700
           dark:text-zinc-300"
  >
    {i.responseLang}
  </span>
  <select
    bind:value={selected}
    class="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2
           text-sm text-zinc-900
           focus:border-blue-500 focus:outline-none focus:ring-2
           focus:ring-blue-500/20
           dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100
           dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
  >
    {#each languages as lang (lang.id)}
      <option value={lang.id}>
        {lang.label} ({lang.nativeName})
      </option>
    {/each}
  </select>
</label>

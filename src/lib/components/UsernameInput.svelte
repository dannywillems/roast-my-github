<script lang="ts">
  let {
    value = $bindable(''),
    disabled = false,
    onsubmit,
  }: {
    value: string;
    disabled?: boolean;
    onsubmit?: () => void;
  } = $props();

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && onsubmit) {
      onsubmit();
    }
  }
</script>

<div class="flex gap-2">
  <input
    type="text"
    bind:value
    {disabled}
    onkeydown={handleKeydown}
    placeholder="GitHub username"
    class="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5
           text-zinc-900 placeholder-zinc-400
           focus:border-blue-500 focus:outline-none focus:ring-2
           focus:ring-blue-500/20
           disabled:opacity-50
           dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100
           dark:placeholder-zinc-500 dark:focus:border-blue-400
           dark:focus:ring-blue-400/20"
  />
</div>

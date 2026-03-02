<script lang="ts">
  let {
    value = $bindable(''),
    label = 'API Key',
    placeholder = 'sk-...',
  }: {
    value: string;
    label?: string;
    placeholder?: string;
  } = $props();

  let visible = $state(false);
</script>

<label class="block">
  <span
    class="mb-1 block text-sm font-medium text-zinc-700
               dark:text-zinc-300"
  >
    {label}
  </span>
  <div class="relative">
    <input
      type={visible ? 'text' : 'password'}
      bind:value
      {placeholder}
      class="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2
             pr-16 text-sm text-zinc-900
             focus:border-blue-500 focus:outline-none focus:ring-2
             focus:ring-blue-500/20
             dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100
             dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
    />
    <button
      type="button"
      onclick={() => (visible = !visible)}
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2
             py-1 text-xs text-zinc-500 hover:text-zinc-700
             dark:text-zinc-400 dark:hover:text-zinc-200"
    >
      {visible ? 'Hide' : 'Show'}
    </button>
  </div>
</label>

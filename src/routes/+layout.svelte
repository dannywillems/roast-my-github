<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<svelte:head>
  <title>Roast My GitHub</title>
</svelte:head>

<div
  class="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased
            dark:bg-zinc-950 dark:text-zinc-100"
>
  {@render children()}
</div>

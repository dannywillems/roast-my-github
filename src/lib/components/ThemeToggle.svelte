<script lang="ts">
  type Theme = 'light' | 'dark' | 'system';

  let theme = $state<Theme>(
    (typeof localStorage !== 'undefined'
      ? (localStorage.getItem('roast_theme') as Theme)
      : null) ?? 'system',
  );

  function applyTheme(t: Theme): void {
    const root = document.documentElement;
    if (t === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', t === 'dark');
    }
  }

  function cycle(): void {
    const order: Theme[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(theme);
    theme = order[(idx + 1) % order.length];
    localStorage.setItem('roast_theme', theme);
    applyTheme(theme);
  }

  $effect(() => {
    applyTheme(theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  let label = $derived(
    theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto',
  );
</script>

<button
  type="button"
  onclick={cycle}
  class="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs
         font-medium text-zinc-600 transition-colors
         hover:border-zinc-400 hover:text-zinc-800
         dark:border-zinc-600 dark:text-zinc-400
         dark:hover:border-zinc-500 dark:hover:text-zinc-200"
  title="Toggle theme: {label}"
>
  {label}
</button>

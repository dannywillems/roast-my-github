<script lang="ts">
  import type { PlatformId } from '$lib/platforms/types';
  import { siGithub, siGitlab, siCodeberg, siBitbucket } from 'simple-icons';

  let {
    platform,
    size = 20,
    class: className = '',
  }: {
    platform: PlatformId;
    size?: number;
    class?: string;
  } = $props();

  const icons: Record<PlatformId, { path: string; hex: string }> = {
    github: { path: siGithub.path, hex: siGithub.hex },
    gitlab: { path: siGitlab.path, hex: siGitlab.hex },
    codeberg: { path: siCodeberg.path, hex: siCodeberg.hex },
    bitbucket: { path: siBitbucket.path, hex: siBitbucket.hex },
  };

  let icon = $derived(icons[platform]);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="currentColor"
  class={className}
  role="img"
  aria-label={platform}
>
  <path d={icon.path} />
</svg>

import type { ProviderId } from './providers/types.ts';
import type {
  PlatformId,
  PlatformInput,
  AnalysisScope,
  MultiPlatformData,
  ConversationEntry,
} from './platforms/types.ts';

function get(key: string): string {
  return localStorage.getItem(key) ?? '';
}

function set(key: string, value: string): void {
  if (value) {
    localStorage.setItem(key, value);
  } else {
    localStorage.removeItem(key);
  }
}

// Provider selection
export function getProvider(): ProviderId {
  return (localStorage.getItem('roast_provider') as ProviderId) ?? 'anthropic';
}

export function setProvider(id: ProviderId): void {
  localStorage.setItem('roast_provider', id);
}

// API keys per provider
export function getApiKey(provider: ProviderId): string {
  return get(`roast_key_${provider}`);
}

export function setApiKey(provider: ProviderId, key: string): void {
  set(`roast_key_${provider}`, key);
}

// Model per provider
export function getModel(provider: ProviderId): string {
  return get(`roast_model_${provider}`);
}

export function setModel(provider: ProviderId, model: string): void {
  set(`roast_model_${provider}`, model);
}

// GitHub PAT (kept for backward compatibility)
export function getGithubPat(): string {
  return get('roast_github_pat');
}

export function setGithubPat(pat: string): void {
  set('roast_github_pat', pat);
}

// Per-platform PATs
export function getPlatformPat(platform: PlatformId): string {
  // Migrate old GitHub PAT
  if (platform === 'github') {
    const legacy = get('roast_github_pat');
    const current = get('roast_pat_github');
    if (legacy && !current) {
      set('roast_pat_github', legacy);
      return legacy;
    }
  }
  return get(`roast_pat_${platform}`);
}

export function setPlatformPat(platform: PlatformId, pat: string): void {
  set(`roast_pat_${platform}`, pat);
  // Keep legacy key in sync for GitHub
  if (platform === 'github') {
    set('roast_github_pat', pat);
  }
}

// Per-platform usernames
export function getPlatformUsername(platform: PlatformId): string {
  return get(`roast_username_${platform}`);
}

export function setPlatformUsername(
  platform: PlatformId,
  username: string,
): void {
  set(`roast_username_${platform}`, username);
}

// Selected platforms
export function getSelectedPlatforms(): PlatformId[] {
  const stored = get('roast_selected_platforms');
  if (!stored) return ['github'];
  try {
    const parsed = JSON.parse(stored) as PlatformId[];
    return parsed.length > 0 ? parsed : ['github'];
  } catch {
    return ['github'];
  }
}

export function setSelectedPlatforms(platforms: PlatformId[]): void {
  localStorage.setItem('roast_selected_platforms', JSON.stringify(platforms));
}

// Build PlatformInput array from stored settings
export function getPlatformInputs(): PlatformInput[] {
  const platforms = getSelectedPlatforms();
  return platforms
    .map(p => ({
      platform: p,
      username: getPlatformUsername(p),
      pat: getPlatformPat(p) || undefined,
    }))
    .filter(p => p.username.trim() !== '');
}

// Language
export function getLanguage(): string {
  return get('roast_language') || 'en';
}

export function setLanguage(lang: string): void {
  set('roast_language', lang);
}

// TTS provider
export function getTTSProvider(): string {
  return get('roast_tts_provider') || 'browser';
}

export function setTTSProvider(id: string): void {
  set('roast_tts_provider', id);
}

// TTS API keys
export function getTTSKey(provider: string): string {
  return get(`roast_tts_key_${provider}`);
}

export function setTTSKey(provider: string, key: string): void {
  set(`roast_tts_key_${provider}`, key);
}

// TTS voice
export function getTTSVoice(provider: string): string {
  return get(`roast_tts_voice_${provider}`);
}

export function setTTSVoice(provider: string, voice: string): void {
  set(`roast_tts_voice_${provider}`, voice);
}

// Custom personality
export function getCustomPersonality(): string {
  return get('roast_custom_personality');
}

export function setCustomPersonality(personality: string): void {
  set('roast_custom_personality', personality);
}

// ---- Platform data cache ----
// Caches fetched platform data so changing tone/model/language
// does not re-fetch from GitHub/GitLab/etc.

const DATA_CACHE_KEY = 'roast_data_cache';
const DATA_CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

interface DataCacheEntry {
  key: string;
  timestamp: number;
  data: MultiPlatformData;
}

function dataCacheKey(inputs: PlatformInput[], scope: AnalysisScope): string {
  const normalized = inputs
    .map(i => `${i.platform}:${i.username.toLowerCase().trim()}`)
    .sort()
    .join('|');
  const scopeKey = Object.entries(scope)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .sort()
    .join(',');
  return `${normalized}@${scopeKey}`;
}

export function getCachedPlatformData(
  inputs: PlatformInput[],
  scope: AnalysisScope,
): MultiPlatformData | null {
  const stored = get(DATA_CACHE_KEY);
  if (!stored) return null;
  try {
    const entry = JSON.parse(stored) as DataCacheEntry;
    const key = dataCacheKey(inputs, scope);
    if (entry.key !== key) return null;
    if (Date.now() - entry.timestamp > DATA_CACHE_MAX_AGE_MS) {
      localStorage.removeItem(DATA_CACHE_KEY);
      return null;
    }
    return entry.data;
  } catch {
    localStorage.removeItem(DATA_CACHE_KEY);
    return null;
  }
}

export function setCachedPlatformData(
  inputs: PlatformInput[],
  scope: AnalysisScope,
  data: MultiPlatformData,
): void {
  const entry: DataCacheEntry = {
    key: dataCacheKey(inputs, scope),
    timestamp: Date.now(),
    data,
  };
  try {
    localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage full, silently ignore
  }
}

export function clearPlatformDataCache(): void {
  localStorage.removeItem(DATA_CACHE_KEY);
}

// ---- Conversation history ----

const CONVERSATION_KEY = 'roast_conversation';
const MAX_CONVERSATION_ENTRIES = 50;

export function getConversation(): ConversationEntry[] {
  const stored = get(CONVERSATION_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as ConversationEntry[];
  } catch {
    return [];
  }
}

export function addConversationEntry(entry: ConversationEntry): void {
  const entries = getConversation();
  entries.push(entry);
  // Keep only recent entries to avoid localStorage limits
  const trimmed = entries.slice(-MAX_CONVERSATION_ENTRIES);
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify(trimmed));
}

export function clearConversation(): void {
  localStorage.removeItem(CONVERSATION_KEY);
}

export function exportConversationAsMarkdown(
  entries: ConversationEntry[],
): string {
  const lines: string[] = [];
  lines.push('# Developer Analysis Conversation');
  lines.push('');
  lines.push(
    `Exported: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
  );
  lines.push('');

  for (const entry of entries) {
    lines.push('---');
    lines.push('');
    const timestamp = entry.timestamp.slice(0, 19).replace('T', ' ');
    const typeLabel =
      entry.type === 'initial' ? 'Initial Analysis' : 'Follow-up';
    lines.push(`## ${typeLabel} - ${timestamp}`);
    lines.push('');

    const platforms = entry.platformInputs
      .map(p => `${p.platform}/@${p.username}`)
      .join(', ');
    lines.push(`**Platforms:** ${platforms}`);
    lines.push(`**Tone:** ${entry.toneId}`);
    if (entry.metadata.followUpType) {
      lines.push(`**Follow-up type:** ${entry.metadata.followUpType}`);
    }
    lines.push(`**Tokens:** ~${entry.metadata.tokenEstimate.toLocaleString()}`);
    lines.push(`**Cost:** ${entry.metadata.costEstimate}`);
    lines.push('');
    lines.push(entry.response);
    lines.push('');
  }

  return lines.join('\n');
}

export function exportConversationAsText(entries: ConversationEntry[]): string {
  const lines: string[] = [];
  lines.push('DEVELOPER ANALYSIS CONVERSATION');
  lines.push(
    `Exported: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
  );
  lines.push('='.repeat(60));
  lines.push('');

  for (const entry of entries) {
    const timestamp = entry.timestamp.slice(0, 19).replace('T', ' ');
    const typeLabel =
      entry.type === 'initial' ? 'Initial Analysis' : 'Follow-up';
    lines.push(`${typeLabel} - ${timestamp}`);
    lines.push('-'.repeat(40));

    const platforms = entry.platformInputs
      .map(p => `${p.platform}/@${p.username}`)
      .join(', ');
    lines.push(`Platforms: ${platforms}`);
    lines.push(`Tone: ${entry.toneId}`);
    if (entry.metadata.followUpType) {
      lines.push(`Follow-up type: ${entry.metadata.followUpType}`);
    }
    lines.push(`Tokens: ~${entry.metadata.tokenEstimate.toLocaleString()}`);
    lines.push(`Cost: ${entry.metadata.costEstimate}`);
    lines.push('');
    // Strip markdown formatting for plain text
    lines.push(
      entry.response
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
    );
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('');
  }

  return lines.join('\n');
}

export function exportConversationAsHtml(
  entries: ConversationEntry[],
  renderedHtmls: string[],
): string {
  const parts: string[] = [];
  parts.push('<!DOCTYPE html>');
  parts.push('<html lang="en">');
  parts.push('<head>');
  parts.push('<meta charset="UTF-8">');
  parts.push(
    '<meta name="viewport" ' +
      'content="width=device-width, initial-scale=1.0">',
  );
  parts.push('<title>Developer Analysis Report</title>');
  parts.push('<style>');
  parts.push(
    'body { font-family: system-ui, sans-serif; ' +
      'max-width: 800px; margin: 0 auto; padding: 20px; ' +
      'line-height: 1.6; color: #1a1a1a; }',
  );
  parts.push(
    'h1 { border-bottom: 2px solid #e5e7eb; ' + 'padding-bottom: 8px; }',
  );
  parts.push(
    'h2 { border-bottom: 1px solid #e5e7eb; ' +
      'padding-bottom: 6px; margin-top: 2em; }',
  );
  parts.push('.meta { color: #6b7280; font-size: 0.875em; }');
  parts.push('.entry { margin-bottom: 3em; }');
  parts.push(
    'hr { border: none; border-top: 1px solid #e5e7eb; ' + 'margin: 2em 0; }',
  );
  parts.push('a { color: #2563eb; }');
  parts.push(
    'code { background: #f3f4f6; padding: 2px 6px; ' +
      'border-radius: 4px; font-size: 0.9em; }',
  );
  parts.push(
    'pre { background: #f3f4f6; padding: 16px; ' +
      'border-radius: 8px; overflow-x: auto; }',
  );
  parts.push('@media print { body { max-width: 100%; } }');
  parts.push('</style>');
  parts.push('</head>');
  parts.push('<body>');
  parts.push('<h1>Developer Analysis Report</h1>');
  parts.push(
    `<p class="meta">Exported: ` +
      `${new Date().toISOString().slice(0, 19).replace('T', ' ')}` +
      `</p>`,
  );

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const html = renderedHtmls[i] ?? entry.response;
    const timestamp = entry.timestamp.slice(0, 19).replace('T', ' ');
    const typeLabel =
      entry.type === 'initial' ? 'Initial Analysis' : 'Follow-up';
    const platforms = entry.platformInputs
      .map(p => `${p.platform}/@${p.username}`)
      .join(', ');

    parts.push('<hr>');
    parts.push('<div class="entry">');
    parts.push(`<h2>${typeLabel} - ${timestamp}</h2>`);
    parts.push('<div class="meta">');
    parts.push(`<p>Platforms: ${platforms}</p>`);
    parts.push(`<p>Tone: ${entry.toneId}</p>`);
    if (entry.metadata.followUpType) {
      parts.push(`<p>Follow-up: ${entry.metadata.followUpType}</p>`);
    }
    parts.push('</div>');
    parts.push('<div class="content">');
    parts.push(html);
    parts.push('</div>');
    parts.push('</div>');
  }

  parts.push('</body>');
  parts.push('</html>');
  return parts.join('\n');
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

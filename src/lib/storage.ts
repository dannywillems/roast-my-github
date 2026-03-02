import type { ProviderId } from './providers/types.ts';

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

// GitHub PAT
export function getGithubPat(): string {
  return get('roast_github_pat');
}

export function setGithubPat(pat: string): void {
  set('roast_github_pat', pat);
}

// Language
export function getLanguage(): string {
  return get('roast_language') || 'en';
}

export function setLanguage(lang: string): void {
  set('roast_language', lang);
}

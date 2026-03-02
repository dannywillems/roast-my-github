import { describe, it, expect, beforeEach } from 'vitest';
import {
  getProvider,
  setProvider,
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  getGithubPat,
  setGithubPat,
  getLanguage,
  setLanguage,
  getTTSProvider,
  setTTSProvider,
  getTTSKey,
  setTTSKey,
  getTTSVoice,
  setTTSVoice,
  getCustomPersonality,
  setCustomPersonality,
} from '../storage.ts';

// jsdom provides localStorage
beforeEach(() => {
  localStorage.clear();
});

describe('provider', () => {
  it('defaults to anthropic', () => {
    expect(getProvider()).toBe('anthropic');
  });

  it('persists provider selection', () => {
    setProvider('openai');
    expect(getProvider()).toBe('openai');
  });
});

describe('apiKey', () => {
  it('defaults to empty string', () => {
    expect(getApiKey('anthropic')).toBe('');
  });

  it('stores and retrieves per-provider keys', () => {
    setApiKey('anthropic', 'sk-ant-test');
    setApiKey('openai', 'sk-test');
    expect(getApiKey('anthropic')).toBe('sk-ant-test');
    expect(getApiKey('openai')).toBe('sk-test');
    expect(getApiKey('gemini')).toBe('');
  });

  it('removes key when set to empty', () => {
    setApiKey('anthropic', 'sk-ant-test');
    setApiKey('anthropic', '');
    expect(getApiKey('anthropic')).toBe('');
  });
});

describe('model', () => {
  it('defaults to empty string', () => {
    expect(getModel('anthropic')).toBe('');
  });

  it('stores and retrieves per-provider models', () => {
    setModel('anthropic', 'claude-sonnet-4-20250514');
    expect(getModel('anthropic')).toBe('claude-sonnet-4-20250514');
  });
});

describe('githubPat', () => {
  it('defaults to empty string', () => {
    expect(getGithubPat()).toBe('');
  });

  it('stores and retrieves PAT', () => {
    setGithubPat('ghp_test123');
    expect(getGithubPat()).toBe('ghp_test123');
  });
});

describe('language', () => {
  it('defaults to en', () => {
    expect(getLanguage()).toBe('en');
  });

  it('stores and retrieves language', () => {
    setLanguage('fr');
    expect(getLanguage()).toBe('fr');
  });
});

describe('TTS settings', () => {
  it('ttsProvider defaults to browser', () => {
    expect(getTTSProvider()).toBe('browser');
  });

  it('stores TTS provider', () => {
    setTTSProvider('elevenlabs');
    expect(getTTSProvider()).toBe('elevenlabs');
  });

  it('stores TTS keys per provider', () => {
    setTTSKey('elevenlabs', 'xi_test');
    expect(getTTSKey('elevenlabs')).toBe('xi_test');
    expect(getTTSKey('openai')).toBe('');
  });

  it('stores TTS voice per provider', () => {
    setTTSVoice('openai', 'nova');
    expect(getTTSVoice('openai')).toBe('nova');
    expect(getTTSVoice('browser')).toBe('');
  });
});

describe('customPersonality', () => {
  it('defaults to empty string', () => {
    expect(getCustomPersonality()).toBe('');
  });

  it('stores and retrieves personality', () => {
    setCustomPersonality('You are a pirate');
    expect(getCustomPersonality()).toBe('You are a pirate');
  });

  it('clears personality when set to empty', () => {
    setCustomPersonality('test');
    setCustomPersonality('');
    expect(getCustomPersonality()).toBe('');
  });
});

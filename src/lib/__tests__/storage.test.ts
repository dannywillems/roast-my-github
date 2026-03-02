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
  getPlatformPat,
  setPlatformPat,
  getPlatformUsername,
  setPlatformUsername,
  getSelectedPlatforms,
  setSelectedPlatforms,
  getPlatformInputs,
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
  getConversation,
  addConversationEntry,
  clearConversation,
  exportConversationAsMarkdown,
  exportConversationAsText,
  exportConversationAsHtml,
} from '../storage.ts';
import type { ConversationEntry } from '../platforms/types.ts';

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

describe('platformPat', () => {
  it('defaults to empty string', () => {
    expect(getPlatformPat('gitlab')).toBe('');
  });

  it('stores per-platform PATs', () => {
    setPlatformPat('gitlab', 'glpat-test');
    setPlatformPat('codeberg', 'cb-token');
    expect(getPlatformPat('gitlab')).toBe('glpat-test');
    expect(getPlatformPat('codeberg')).toBe('cb-token');
    expect(getPlatformPat('bitbucket')).toBe('');
  });

  it('migrates legacy github PAT', () => {
    // Set the old-style PAT
    localStorage.setItem('roast_github_pat', 'ghp_legacy');
    expect(getPlatformPat('github')).toBe('ghp_legacy');
  });

  it('keeps github legacy key in sync', () => {
    setPlatformPat('github', 'ghp_new');
    expect(getGithubPat()).toBe('ghp_new');
  });
});

describe('platformUsername', () => {
  it('defaults to empty string', () => {
    expect(getPlatformUsername('github')).toBe('');
  });

  it('stores per-platform usernames', () => {
    setPlatformUsername('github', 'octocat');
    setPlatformUsername('gitlab', 'gitlabuser');
    expect(getPlatformUsername('github')).toBe('octocat');
    expect(getPlatformUsername('gitlab')).toBe('gitlabuser');
  });
});

describe('selectedPlatforms', () => {
  it('defaults to github', () => {
    expect(getSelectedPlatforms()).toEqual(['github']);
  });

  it('stores and retrieves platforms', () => {
    setSelectedPlatforms(['github', 'gitlab']);
    expect(getSelectedPlatforms()).toEqual(['github', 'gitlab']);
  });

  it('falls back to github for empty array', () => {
    setSelectedPlatforms([]);
    expect(getSelectedPlatforms()).toEqual(['github']);
  });
});

describe('getPlatformInputs', () => {
  it('returns empty array when no usernames set', () => {
    expect(getPlatformInputs()).toEqual([]);
  });

  it('returns inputs for selected platforms with usernames', () => {
    setSelectedPlatforms(['github', 'gitlab']);
    setPlatformUsername('github', 'user1');
    setPlatformUsername('gitlab', 'user2');
    const inputs = getPlatformInputs();
    expect(inputs.length).toBe(2);
    expect(inputs[0].platform).toBe('github');
    expect(inputs[0].username).toBe('user1');
    expect(inputs[1].platform).toBe('gitlab');
    expect(inputs[1].username).toBe('user2');
  });

  it('excludes platforms with empty usernames', () => {
    setSelectedPlatforms(['github', 'gitlab']);
    setPlatformUsername('github', 'user1');
    // gitlab username is empty
    const inputs = getPlatformInputs();
    expect(inputs.length).toBe(1);
    expect(inputs[0].platform).toBe('github');
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

// ---- Conversation history ----

function makeEntry(overrides?: Partial<ConversationEntry>): ConversationEntry {
  return {
    id: 'test-id',
    timestamp: '2026-03-02T12:00:00.000Z',
    type: 'initial',
    platformInputs: [{ platform: 'github', username: 'octocat' }],
    scope: {
      recentActivity: true,
      sourceCode: true,
      pullRequests: true,
      issues: true,
      commentsReviews: true,
      crossRepoContributions: true,
      commitMessages: true,
    },
    toneId: 'recruiter',
    prompt: '',
    response: '# Analysis result\nSome **markdown** content.',
    metadata: {
      tokenEstimate: 5000,
      costEstimate: '~$0.015',
    },
    ...overrides,
  };
}

describe('conversation history', () => {
  it('defaults to empty array', () => {
    expect(getConversation()).toEqual([]);
  });

  it('adds and retrieves entries', () => {
    addConversationEntry(makeEntry({ id: '1' }));
    addConversationEntry(makeEntry({ id: '2' }));
    const entries = getConversation();
    expect(entries.length).toBe(2);
    expect(entries[0].id).toBe('1');
    expect(entries[1].id).toBe('2');
  });

  it('clears conversation', () => {
    addConversationEntry(makeEntry());
    clearConversation();
    expect(getConversation()).toEqual([]);
  });
});

describe('exportConversationAsMarkdown', () => {
  it('produces markdown with headers', () => {
    const entries = [makeEntry()];
    const md = exportConversationAsMarkdown(entries);
    expect(md).toContain('# Developer Analysis Conversation');
    expect(md).toContain('## Initial Analysis');
    expect(md).toContain('github/@octocat');
    expect(md).toContain('**Tone:** recruiter');
    expect(md).toContain('# Analysis result');
  });

  it('includes follow-up type for follow-up entries', () => {
    const entries = [
      makeEntry({
        type: 'follow-up',
        metadata: {
          tokenEstimate: 1000,
          costEstimate: '<$0.001',
          followUpType: 'deep-dive-repo',
        },
      }),
    ];
    const md = exportConversationAsMarkdown(entries);
    expect(md).toContain('## Follow-up');
    expect(md).toContain('deep-dive-repo');
  });
});

describe('exportConversationAsText', () => {
  it('produces plain text without markdown formatting', () => {
    const entries = [makeEntry()];
    const txt = exportConversationAsText(entries);
    expect(txt).toContain('DEVELOPER ANALYSIS CONVERSATION');
    expect(txt).toContain('Initial Analysis');
    expect(txt).toContain('github/@octocat');
    // Markdown bold should be stripped
    expect(txt).toContain('Some markdown content.');
    expect(txt).not.toContain('**');
  });
});

describe('exportConversationAsHtml', () => {
  it('produces valid HTML document', () => {
    const entries = [makeEntry()];
    const htmls = ['<p>Rendered HTML</p>'];
    const html = exportConversationAsHtml(entries, htmls);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Developer Analysis Report</title>');
    expect(html).toContain('Initial Analysis');
    expect(html).toContain('github/@octocat');
    expect(html).toContain('<p>Rendered HTML</p>');
    expect(html).toContain('</html>');
  });

  it('includes viewport meta tag for mobile', () => {
    const entries = [makeEntry()];
    const html = exportConversationAsHtml(entries, ['<p>test</p>']);
    expect(html).toContain('viewport');
    expect(html).toContain('width=device-width');
  });
});

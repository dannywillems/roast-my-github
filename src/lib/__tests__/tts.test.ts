import { describe, it, expect } from 'vitest';
import { ttsConfigs } from '../tts/types.ts';
import type { TTSProviderId } from '../tts/types.ts';

describe('ttsConfigs', () => {
  it('has 3 TTS providers', () => {
    expect(ttsConfigs.length).toBe(3);
  });

  it('includes browser, openai, and elevenlabs', () => {
    const ids = ttsConfigs.map(c => c.id);
    expect(ids).toContain('browser');
    expect(ids).toContain('openai');
    expect(ids).toContain('elevenlabs');
  });

  it('browser provider does not need a key', () => {
    const browser = ttsConfigs.find(c => c.id === 'browser');
    expect(browser).toBeDefined();
    expect(browser!.needsKey).toBe(false);
  });

  it('openai and elevenlabs need keys', () => {
    const openai = ttsConfigs.find(c => c.id === 'openai');
    const elevenlabs = ttsConfigs.find(c => c.id === 'elevenlabs');
    expect(openai!.needsKey).toBe(true);
    expect(elevenlabs!.needsKey).toBe(true);
  });

  it('key-based providers have key labels and placeholders', () => {
    for (const cfg of ttsConfigs) {
      if (cfg.needsKey) {
        expect(cfg.keyLabel).toBeTruthy();
        expect(cfg.keyPlaceholder).toBeTruthy();
      }
    }
  });

  it('key-based providers have CORS notes', () => {
    for (const cfg of ttsConfigs) {
      if (cfg.needsKey) {
        expect(cfg.corsNote).toBeTruthy();
      }
    }
  });
});

describe('openai TTS voices', () => {
  it('exports provider with getVoices', async () => {
    const { openaiTTS } = await import('../tts/openai.ts');
    const voices = openaiTTS.getVoices();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices.some(v => v.id === 'alloy')).toBe(true);
    expect(voices.some(v => v.id === 'nova')).toBe(true);
  });
});

describe('elevenlabs TTS voices', () => {
  it('exports provider with getVoices', async () => {
    const { elevenlabsTTS } = await import('../tts/elevenlabs.ts');
    const voices = elevenlabsTTS.getVoices();
    expect(voices.length).toBeGreaterThan(0);
  });
});

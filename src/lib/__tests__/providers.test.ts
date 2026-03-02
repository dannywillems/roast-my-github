import { describe, it, expect } from 'vitest';
import { providerConfigs } from '../providers/types.ts';
import type { ProviderId, ProviderConfig } from '../providers/types.ts';

describe('providerConfigs', () => {
  it('has 3 providers', () => {
    expect(providerConfigs.length).toBe(3);
  });

  it('includes anthropic, openai, and gemini', () => {
    const ids = providerConfigs.map(p => p.id);
    expect(ids).toContain('anthropic');
    expect(ids).toContain('openai');
    expect(ids).toContain('gemini');
  });

  it('each provider has required fields', () => {
    for (const cfg of providerConfigs) {
      expect(cfg.id).toBeTruthy();
      expect(cfg.name).toBeTruthy();
      expect(cfg.models.length).toBeGreaterThan(0);
      expect(cfg.defaultModel).toBeTruthy();
      expect(cfg.keyPlaceholder).toBeTruthy();
      expect(cfg.keyLabel).toBeTruthy();
    }
  });

  it('each provider has a valid default model', () => {
    for (const cfg of providerConfigs) {
      const modelIds = cfg.models.map(m => m.id);
      expect(modelIds).toContain(cfg.defaultModel);
    }
  });

  it('each model has id and label', () => {
    for (const cfg of providerConfigs) {
      for (const model of cfg.models) {
        expect(model.id).toBeTruthy();
        expect(model.label).toBeTruthy();
      }
    }
  });

  it('model ids are unique within each provider', () => {
    for (const cfg of providerConfigs) {
      const ids = cfg.models.map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('ProviderId type coverage', () => {
  it('all config ids are valid ProviderId values', () => {
    const validIds: ProviderId[] = ['anthropic', 'openai', 'gemini'];
    for (const cfg of providerConfigs) {
      expect(validIds).toContain(cfg.id);
    }
  });
});

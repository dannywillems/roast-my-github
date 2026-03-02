import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateCost } from '../analyzer.ts';

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates roughly 1 token per 4 characters', () => {
    const text = 'a'.repeat(400);
    expect(estimateTokens(text)).toBe(100);
  });

  it('rounds up partial tokens', () => {
    expect(estimateTokens('abc')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
  });

  it('handles large texts', () => {
    const text = 'x'.repeat(100000);
    expect(estimateTokens(text)).toBe(25000);
  });
});

describe('estimateCost', () => {
  it('returns unknown for unrecognized model', () => {
    expect(estimateCost(1000, 'fake-model')).toBe('unknown');
  });

  it('returns <$0.001 for very small token counts', () => {
    expect(estimateCost(100, 'gemini-2.5-flash')).toBe('<$0.001');
  });

  it('calculates cost for claude sonnet', () => {
    // 1M tokens at $3/M = $3.00
    const result = estimateCost(1_000_000, 'claude-sonnet-4-20250514');
    expect(result).toBe('~$3.000');
  });

  it('calculates cost for gpt-4o', () => {
    // 1M tokens at $2.5/M = $2.50
    const result = estimateCost(1_000_000, 'gpt-4o');
    expect(result).toBe('~$2.500');
  });

  it('calculates cost for claude opus', () => {
    // 10k tokens at $15/M = $0.15
    const result = estimateCost(10_000, 'claude-opus-4-20250514');
    expect(result).toBe('~$0.150');
  });

  it('calculates cost for gemini flash', () => {
    // 100k tokens at $0.15/M = $0.015
    const result = estimateCost(100_000, 'gemini-2.5-flash');
    expect(result).toBe('~$0.015');
  });
});

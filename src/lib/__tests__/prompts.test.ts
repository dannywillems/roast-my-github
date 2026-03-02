import { describe, it, expect } from 'vitest';
import {
  tones,
  toneCategories,
  languages,
  buildSystemPrompt,
  buildFollowUpSystemPrompt,
} from '../prompts.ts';

describe('tones', () => {
  it('has at least 10 tones', () => {
    expect(tones.length).toBeGreaterThanOrEqual(10);
  });

  it('each tone has required fields', () => {
    for (const tone of tones) {
      expect(tone.id).toBeTruthy();
      expect(tone.label).toBeTruthy();
      expect(tone.description).toBeTruthy();
      expect(tone.emoji).toBeTruthy();
      expect(tone.category).toBeTruthy();
      expect(tone.systemPrompt).toBeTruthy();
    }
  });

  it('every tone belongs to a valid category', () => {
    const validCategories = toneCategories.map(c => c.id);
    for (const tone of tones) {
      expect(validCategories).toContain(tone.category);
    }
  });

  it('has both professional and fun tones', () => {
    const pro = tones.filter(t => t.category === 'professional');
    const fun = tones.filter(t => t.category === 'fun');
    expect(pro.length).toBeGreaterThanOrEqual(3);
    expect(fun.length).toBeGreaterThanOrEqual(3);
  });

  it('has unique ids', () => {
    const ids = tones.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes recruiter as default tone', () => {
    const recruiter = tones.find(t => t.id === 'recruiter');
    expect(recruiter).toBeDefined();
  });

  it('includes comedy roast tone', () => {
    const roast = tones.find(t => t.id === 'roast');
    expect(roast).toBeDefined();
  });
});

describe('languages', () => {
  it('has at least 5 languages', () => {
    expect(languages.length).toBeGreaterThanOrEqual(5);
  });

  it('includes English as first language', () => {
    expect(languages[0].id).toBe('en');
    expect(languages[0].label).toBe('English');
  });

  it('each language has required fields', () => {
    for (const lang of languages) {
      expect(lang.id).toBeTruthy();
      expect(lang.label).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
    }
  });

  it('has unique ids', () => {
    const ids = languages.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildSystemPrompt', () => {
  const recruiter = tones.find(t => t.id === 'recruiter')!;

  it('returns the tone system prompt with evidence instruction for English', () => {
    const result = buildSystemPrompt(recruiter, 'en');
    expect(result).toContain(recruiter.systemPrompt);
    expect(result).toContain('EVIDENCE AND LINKS');
  });

  it('appends language instruction for non-English', () => {
    const result = buildSystemPrompt(recruiter, 'fr');
    expect(result).toContain(recruiter.systemPrompt);
    expect(result).toContain('French');
    expect(result).toContain('Francais');
  });

  it('does not append language instruction for English', () => {
    const result = buildSystemPrompt(recruiter, 'en');
    expect(result).not.toContain('IMPORTANT: Write your entire');
  });

  it('appends custom personality when provided', () => {
    const result = buildSystemPrompt(
      recruiter,
      'en',
      'You are a pirate captain',
    );
    expect(result).toContain(recruiter.systemPrompt);
    expect(result).toContain('You are a pirate captain');
    expect(result).toContain('ADDITIONAL PERSONALITY INSTRUCTIONS');
  });

  it('ignores empty custom personality', () => {
    const result = buildSystemPrompt(recruiter, 'en', '');
    expect(result).not.toContain('ADDITIONAL PERSONALITY INSTRUCTIONS');
    expect(result).toContain(recruiter.systemPrompt);
  });

  it('ignores whitespace-only custom personality', () => {
    const result = buildSystemPrompt(recruiter, 'en', '   ');
    expect(result).not.toContain('ADDITIONAL PERSONALITY INSTRUCTIONS');
    expect(result).toContain(recruiter.systemPrompt);
  });

  it('combines language and personality', () => {
    const result = buildSystemPrompt(recruiter, 'de', 'Focus on Rust code');
    expect(result).toContain('German');
    expect(result).toContain('Focus on Rust code');
  });

  it('handles unknown language gracefully', () => {
    const result = buildSystemPrompt(recruiter, 'xx');
    expect(result).toContain(recruiter.systemPrompt);
    expect(result).not.toContain('Write your entire response in');
  });

  it('includes temporal instruction', () => {
    const result = buildSystemPrompt(recruiter, 'en');
    expect(result).toContain('TEMPORAL AWARENESS');
    expect(result).toContain('Weight the last 90 days');
  });
});

describe('buildFollowUpSystemPrompt', () => {
  const recruiter = tones.find(t => t.id === 'recruiter')!;

  it('includes previous analysis context', () => {
    const result = buildFollowUpSystemPrompt(
      recruiter,
      'en',
      'Previous analysis: this dev is senior.',
    );
    expect(result).toContain('PREVIOUS ANALYSIS');
    expect(result).toContain('Previous analysis: this dev is senior.');
  });

  it('includes tone and evidence instructions', () => {
    const result = buildFollowUpSystemPrompt(recruiter, 'en', 'summary');
    expect(result).toContain(recruiter.systemPrompt);
    expect(result).toContain('EVIDENCE AND LINKS');
  });
});

describe('creative tones', () => {
  it('includes detective tone', () => {
    expect(tones.find(t => t.id === 'detective')).toBeDefined();
  });

  it('includes sportscaster tone', () => {
    expect(tones.find(t => t.id === 'sportscaster')).toBeDefined();
  });

  it('includes therapist tone', () => {
    expect(tones.find(t => t.id === 'therapist')).toBeDefined();
  });

  it('includes pirate tone', () => {
    expect(tones.find(t => t.id === 'pirate')).toBeDefined();
  });

  it('includes investor tone', () => {
    expect(tones.find(t => t.id === 'investor')).toBeDefined();
  });

  it('includes dungeon master tone', () => {
    expect(tones.find(t => t.id === 'dungeon_master')).toBeDefined();
  });

  it('includes food critic tone', () => {
    expect(tones.find(t => t.id === 'foodcritic')).toBeDefined();
  });
});

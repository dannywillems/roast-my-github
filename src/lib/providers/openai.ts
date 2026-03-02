import type { LLMProvider } from './types.ts';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const openaiProvider: LLMProvider = {
  name: 'OpenAI',

  async stream(systemPrompt, userMessage, apiKey, model, onChunk, signal) {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response.text();
      const truncated = body.slice(0, 200);
      throw new Error(`OpenAI API error ${response.status}: ${truncated}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const event = JSON.parse(data);
          const delta = event.choices?.[0]?.delta?.content;
          if (delta) {
            onChunk(delta);
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }
  },
};

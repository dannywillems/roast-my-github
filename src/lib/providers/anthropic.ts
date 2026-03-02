import type { LLMProvider } from './types.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export const anthropicProvider: LLMProvider = {
  name: 'Anthropic',

  async stream(systemPrompt, userMessage, apiKey, model, onChunk, signal) {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 16384,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response.text();
      const truncated = body.slice(0, 200);
      throw new Error(`Anthropic API error ${response.status}: ${truncated}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const event = JSON.parse(data);
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              onChunk(event.delta.text);
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } catch (err) {
      // Re-throw unless it was an abort
      if (signal?.aborted) return;
      const msg = err instanceof Error ? err.message : 'Connection error';
      if (msg.includes('NetworkError') || msg.includes('network')) {
        throw new Error(
          'Connection lost during streaming. ' +
            'This can happen with very large analyses. ' +
            'Try reducing the analysis scope or using a ' +
            'different network.',
        );
      }
      throw err;
    }
  },
};

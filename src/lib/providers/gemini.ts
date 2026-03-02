import type { LLMProvider } from './types.ts';

export const geminiProvider: LLMProvider = {
  name: 'Google Gemini',

  async stream(systemPrompt, userMessage, apiKey, model, onChunk, signal) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response.text();
      const truncated = body.slice(0, 200);
      throw new Error(`Gemini API error ${response.status}: ${truncated}`);
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
        if (!data) continue;

        try {
          const event = JSON.parse(data);
          const parts = event.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.text) {
                onChunk(part.text);
              }
            }
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }
  },
};

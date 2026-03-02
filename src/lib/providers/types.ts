export interface LLMProvider {
  name: string;
  stream(
    systemPrompt: string,
    userMessage: string,
    apiKey: string,
    model: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<void>;
}

export type ProviderId = 'anthropic' | 'openai' | 'gemini';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  models: { id: string; label: string }[];
  defaultModel: string;
  keyPlaceholder: string;
  keyLabel: string;
  corsNote: string;
}

export const providerConfigs: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-opus-4-6-20250610', label: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6-20250610', label: 'Claude Sonnet 4.6' },
      { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    ],
    defaultModel: 'claude-sonnet-4-6-20250610',
    keyPlaceholder: 'sk-ant-...',
    keyLabel: 'Anthropic API Key',
    corsNote: 'Works directly from the browser.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'o3', label: 'o3' },
      { id: 'o4-mini', label: 'o4-mini' },
      { id: 'gpt-4.1', label: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    ],
    defaultModel: 'gpt-4.1',
    keyPlaceholder: 'sk-...',
    keyLabel: 'OpenAI API Key',
    corsNote:
      'OpenAI does not allow browser CORS. You need a proxy or browser extension to bypass CORS.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
      { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (preview)' },
    ],
    defaultModel: 'gemini-2.5-flash',
    keyPlaceholder: 'AIza...',
    keyLabel: 'Google AI API Key',
    corsNote: 'Works directly from the browser.',
  },
];

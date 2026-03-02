export interface TTSProvider {
  id: string;
  name: string;
  /** Whether this provider needs an API key */
  needsKey: boolean;
  /** CORS note for browser usage */
  corsNote: string;
  /** Speak the given text. Returns an abort function. */
  speak(
    text: string,
    voice: string,
    apiKey: string,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: string) => void,
  ): TTSControl;
  /** List available voices */
  getVoices(): TTSVoice[];
}

export interface TTSVoice {
  id: string;
  label: string;
}

export interface TTSControl {
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export type TTSProviderId = 'browser' | 'openai' | 'elevenlabs';

export interface TTSConfig {
  id: TTSProviderId;
  name: string;
  needsKey: boolean;
  corsNote: string;
  keyLabel: string;
  keyPlaceholder: string;
}

export const ttsConfigs: TTSConfig[] = [
  {
    id: 'browser',
    name: 'Browser (free)',
    needsKey: false,
    corsNote: '',
    keyLabel: '',
    keyPlaceholder: '',
  },
  {
    id: 'openai',
    name: 'OpenAI TTS',
    needsKey: true,
    corsNote:
      'OpenAI TTS does not support browser CORS. ' +
      'Needs a proxy or CORS browser extension.',
    keyLabel: 'OpenAI API Key',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    needsKey: true,
    corsNote:
      'ElevenLabs may not support browser CORS. ' +
      'Needs a proxy or CORS browser extension.',
    keyLabel: 'ElevenLabs API Key',
    keyPlaceholder: 'xi_...',
  },
];

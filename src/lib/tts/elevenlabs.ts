import type { TTSProvider, TTSVoice, TTSControl } from './types.ts';

const VOICES: TTSVoice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (female)' },
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (male)' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice (female, British)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel (male, British)' },
  { id: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie (male, Australian)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah (female)' },
  { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni (male)' },
  { id: 'XB0fDUnXU5powFXDhCwa', label: 'Charlotte (female)' },
];

// ElevenLabs free tier: 2500 chars per generation
const MAX_CHARS = 2500;

export const elevenlabsTTS: TTSProvider = {
  id: 'elevenlabs',
  name: 'ElevenLabs',
  needsKey: true,
  corsNote:
    'ElevenLabs may not support browser CORS. ' +
    'Needs a proxy or CORS browser extension.',

  getVoices(): TTSVoice[] {
    return VOICES;
  },

  speak(
    text: string,
    voiceId: string,
    apiKey: string,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: string) => void,
  ): TTSControl {
    let stopped = false;
    let audio: HTMLAudioElement | null = null;

    const voice = voiceId || '21m00Tcm4TlvDq8ikWAM';
    const chunks = splitIntoChunks(text, MAX_CHARS);
    let currentChunk = 0;

    async function playNext(): Promise<void> {
      if (stopped || currentChunk >= chunks.length) {
        if (!stopped) onEnd();
        return;
      }

      try {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: chunks[currentChunk],
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true,
              },
            }),
          },
        );

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          onError(`ElevenLabs error ${res.status}: ` + `${body.slice(0, 200)}`);
          return;
        }

        const blob = await res.blob();
        if (stopped) return;

        const url = URL.createObjectURL(blob);
        audio = new Audio(url);

        if (currentChunk === 0) onStart();

        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentChunk++;
          if (!stopped) playNext();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          onError('Audio playback error');
        };

        await audio.play();
      } catch (err) {
        if (stopped) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        onError(`ElevenLabs TTS: ${msg}`);
      }
    }

    playNext();

    return {
      pause() {
        audio?.pause();
      },
      resume() {
        audio?.play();
      },
      stop() {
        stopped = true;
        if (audio) {
          audio.pause();
          audio.src = '';
          audio = null;
        }
        onEnd();
      },
    };
  },
};

function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let cutoff = remaining.lastIndexOf('. ', maxLen);
    if (cutoff < maxLen / 2) {
      cutoff = remaining.lastIndexOf('\n', maxLen);
    }
    if (cutoff < maxLen / 2) {
      cutoff = remaining.lastIndexOf(' ', maxLen);
    }
    if (cutoff < 1) cutoff = maxLen;
    chunks.push(remaining.slice(0, cutoff + 1));
    remaining = remaining.slice(cutoff + 1);
  }
  return chunks;
}

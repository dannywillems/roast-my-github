import type { TTSProvider, TTSVoice, TTSControl } from './types.ts';

const VOICES: TTSVoice[] = [
  { id: 'alloy', label: 'Alloy (neutral)' },
  { id: 'echo', label: 'Echo (deep)' },
  { id: 'fable', label: 'Fable (warm)' },
  { id: 'nova', label: 'Nova (bright)' },
  { id: 'onyx', label: 'Onyx (authoritative)' },
  { id: 'shimmer', label: 'Shimmer (energetic)' },
];

// Max 4096 chars per request
const MAX_CHARS = 4096;

export const openaiTTS: TTSProvider = {
  id: 'openai',
  name: 'OpenAI TTS',
  needsKey: true,
  corsNote:
    'OpenAI TTS does not support browser CORS. ' +
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

    const chunks = splitIntoChunks(text, MAX_CHARS);
    let currentChunk = 0;

    async function playNext(): Promise<void> {
      if (stopped || currentChunk >= chunks.length) {
        if (!stopped) onEnd();
        return;
      }

      try {
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: chunks[currentChunk],
            voice: voiceId || 'alloy',
            response_format: 'mp3',
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          onError(`OpenAI TTS error ${res.status}: ${body.slice(0, 200)}`);
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
        onError(`OpenAI TTS: ${msg}`);
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
    // Find a sentence or paragraph break near the limit
    let cutoff = remaining.lastIndexOf('. ', maxLen);
    if (cutoff < maxLen / 2) cutoff = remaining.lastIndexOf('\n', maxLen);
    if (cutoff < maxLen / 2) cutoff = remaining.lastIndexOf(' ', maxLen);
    if (cutoff < 1) cutoff = maxLen;
    chunks.push(remaining.slice(0, cutoff + 1));
    remaining = remaining.slice(cutoff + 1);
  }
  return chunks;
}

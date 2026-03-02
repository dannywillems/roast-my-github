import type { TTSProvider, TTSVoice, TTSControl } from './types.ts';

export const browserTTS: TTSProvider = {
  id: 'browser',
  name: 'Browser (free)',
  needsKey: false,
  corsNote: '',

  getVoices(): TTSVoice[] {
    if (typeof window === 'undefined') return [];
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length === 0) {
      // Voices may not be loaded yet; return defaults
      return [{ id: 'default', label: 'Default' }];
    }
    return voices.map(v => ({
      id: v.voiceURI,
      label: `${v.name} (${v.lang})`,
    }));
  },

  speak(
    text: string,
    voiceId: string,
    _apiKey: string,
    onStart: () => void,
    onEnd: () => void,
    onError: (err: string) => void,
  ): TTSControl {
    if (typeof window === 'undefined') {
      onError('Speech synthesis not available');
      return { pause() {}, resume() {}, stop() {} };
    }

    const synth = window.speechSynthesis;
    // Cancel any ongoing speech
    synth.cancel();

    // Split into chunks to avoid the ~15s cutoff in some browsers
    const chunks = splitText(text, 200);
    let currentIndex = 0;
    let stopped = false;
    let paused = false;

    function speakNext(): void {
      if (stopped || currentIndex >= chunks.length) {
        if (!stopped) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);

      // Try to match the requested voice
      if (voiceId && voiceId !== 'default') {
        const voices = synth.getVoices();
        const match = voices.find(v => v.voiceURI === voiceId);
        if (match) utterance.voice = match;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        if (currentIndex === 0) onStart();
      };

      utterance.onend = () => {
        currentIndex++;
        if (!stopped && !paused) {
          speakNext();
        }
      };

      utterance.onerror = ev => {
        if (ev.error === 'canceled' || stopped) return;
        onError(`Speech error: ${ev.error}`);
      };

      synth.speak(utterance);
    }

    speakNext();

    return {
      pause() {
        paused = true;
        synth.pause();
      },
      resume() {
        paused = false;
        synth.resume();
        // If the utterance ended while paused, continue
        if (!synth.speaking && currentIndex < chunks.length) {
          speakNext();
        }
      },
      stop() {
        stopped = true;
        synth.cancel();
        onEnd();
      },
    };
  },
};

function splitText(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}

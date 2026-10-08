import { Participant } from '../types/gd';

class SpeechSynthesisService {
  private isSupported: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupported = true;
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.isSupported) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length && this.isSupported) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private selectBestVoice(participant: Participant): SpeechSynthesisVoice | null {
    const all = this.getVoices();
    if (!all.length) return null;

    const isFemale = participant.voiceGender === 'female';
    const isModerator = participant.role === 'moderator';

    // Try finding Indian English voices first if available (en-IN)
    const indianVoices = all.filter((v) => v.lang.includes('IN') || v.name.toLowerCase().includes('india'));
    const englishVoices = all.filter((v) => v.lang.startsWith('en'));

    // Preference list
    if (isModerator) {
      const matureVoice = englishVoices.find((v) =>
        (v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('rishi') || v.name.toLowerCase().includes('male'))
      );
      if (matureVoice) return matureVoice;
    }

    if (isFemale) {
      const femaleIndian = indianVoices.find((v) =>
        v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('female')
      );
      if (femaleIndian) return femaleIndian;

      const genericFemale = englishVoices.find((v) =>
        v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria') || v.name.toLowerCase().includes('karen')
      );
      if (genericFemale) return genericFemale;
    } else {
      const maleIndian = indianVoices.find((v) =>
        v.name.toLowerCase().includes('ravi') || v.name.toLowerCase().includes('prabhat') || v.name.toLowerCase().includes('male')
      );
      if (maleIndian) return maleIndian;

      const genericMale = englishVoices.find((v) =>
        v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('guy')
      );
      if (genericMale) return genericMale;
    }

    // Default to matching gender if possible, else first english, else first available
    return englishVoices[0] || all[0];
  }

  /**
   * Speak out loud with specific participant persona characteristics
   */
  public speak(
    participant: Participant,
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSupported || this.isMuted) {
        options?.onStart?.();
        // Simulate speech duration if muted or unsupported: roughly 150 words per minute = 2.5 words/sec
        const words = text.split(/\s+/).length;
        const simulatedMs = Math.max(1200, Math.min(6000, (words / 2.5) * 1000));
        setTimeout(() => {
          options?.onEnd?.();
          resolve();
        }, simulatedMs);
        return;
      }

      this.stop(); // Stop any pending utterance

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      const voice = this.selectBestVoice(participant);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.pitch = participant.voicePitch || 1.0;
      utterance.rate = participant.voiceRate || 1.0;

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        options?.onError?.(e);
        resolve();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis speak error:', err);
        options?.onEnd?.();
        resolve();
      }
    });
  }

  /**
   * Instant interruption: yields floor immediately
   */
  public stop() {
    if (this.isSupported && typeof window !== 'undefined') {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('Speech cancel error:', err);
      }
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    if (!this.isSupported) return false;
    return window.speechSynthesis.speaking;
  }
}

export const speechSynthesisService = new SpeechSynthesisService();

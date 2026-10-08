type SpeechCallback = (text: string) => void;
type ErrorCallback = (error: string) => void;
type VoidCallback = () => void;

class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onInterim: SpeechCallback | null = null;
  private onFinal: SpeechCallback | null = null;
  private onStartSpeaking: VoidCallback | null = null;
  private onStopSpeaking: VoidCallback | null = null;
  private onErrorCb: ErrorCallback | null = null;
  private shouldKeepListening: boolean = false;
  private permissionDenied: boolean = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // defaults to Indian English, versatile for English & Hinglish

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onspeechstart = () => {
        this.onStartSpeaking?.();
      };

      this.recognition.onspeechend = () => {
        this.onStopSpeaking?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (interimText.trim() && this.onInterim) {
          this.onInterim(interimText.trim());
        }

        if (finalText.trim() && this.onFinal) {
          this.onFinal(finalText.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.permissionDenied = true;
          this.shouldKeepListening = false;
          this.onErrorCb?.('Microphone permission denied. Please allow microphone in browser or use the text voice-in box.');
        } else if (event.error === 'no-speech') {
          // ignore silent pause
        } else {
          this.onErrorCb?.(`Audio input note: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Auto-restart if student still has mic active
        if (this.shouldKeepListening && !this.permissionDenied) {
          try {
            this.recognition.start();
          } catch (e) {
            // ignore rapid start error
          }
        }
      };
    } catch (e) {
      console.warn('Failed to initialize SpeechRecognition:', e);
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public isDenied(): boolean {
    return this.permissionDenied;
  }

  public setLanguage(lang: 'en-IN' | 'en-US' | 'hi-IN') {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(handlers: {
    onInterim?: SpeechCallback;
    onFinal?: SpeechCallback;
    onSpeechStart?: VoidCallback;
    onSpeechEnd?: VoidCallback;
    onError?: ErrorCallback;
  }) {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        handlers.onError?.('Speech recognition is not supported in this browser environment. You can use the typed speech input.');
        return;
      }
    }

    this.onInterim = handlers.onInterim || null;
    this.onFinal = handlers.onFinal || null;
    this.onStartSpeaking = handlers.onSpeechStart || null;
    this.onStopSpeaking = handlers.onSpeechEnd || null;
    this.onErrorCb = handlers.onError || null;

    this.shouldKeepListening = true;
    this.permissionDenied = false;

    if (!this.isListening) {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn('Recognition start caught:', err);
      }
    }
  }

  public stopListening() {
    this.shouldKeepListening = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();

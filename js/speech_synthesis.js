/**
 * SANSKRITI AI - Speech Synthesis Manager (TTS)
 * Natural female voice modulation, multilingual selection, and instant interruption
 * Graceful fallback when SpeechSynthesis is unsupported
 */

class SpeechSynthesisManager {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isSupported = !!this.synth;
    this.voices = [];
    this.currentVoice = null;
    this.rate = 1.0;
    this.pitch = 1.05;
    this.volume = 1.0;
    this.isSpeaking = false;
    this.onVoicesLoaded = null;

    if (this.isSupported) {
      this.initVoices();
    }
  }

  initVoices() {
    if (!this.synth) return;

    const load = () => {
      try {
        this.voices = this.synth.getVoices() || [];
        this.selectBestVoice("hi-IN");
        if (typeof this.onVoicesLoaded === 'function') {
          this.onVoicesLoaded(this.voices);
        }
      } catch (e) {
        console.warn("Voices load notice:", e);
      }
    };

    load();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = load;
    }
  }

  selectBestVoice(targetLang = "hi-IN") {
    if (!this.voices || this.voices.length === 0) return null;

    const femaleKeywords = ["female", "swara", "heera", "neerja", "kalpana", "aditi", "zira", "priya", "kavya", "samantha", "siri", "geeta", "anjali"];

    // 1. Language matching female voice
    let candidate = this.voices.find(v => {
      const name = (v.name || '').toLowerCase();
      const lang = (v.lang || '').toLowerCase();
      const isTarget = targetLang ? lang.startsWith(targetLang.slice(0, 2).toLowerCase()) : true;
      const isFemale = femaleKeywords.some(k => name.includes(k));
      return isTarget && isFemale;
    });

    // 2. Any voice matching language
    if (!candidate && targetLang) {
      candidate = this.voices.find(v => (v.lang || '').toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase()));
    }

    // 3. Any female voice in system
    if (!candidate) {
      candidate = this.voices.find(v => femaleKeywords.some(k => (v.name || '').toLowerCase().includes(k)));
    }

    // 4. Default system voice
    if (!candidate) {
      candidate = this.voices[0];
    }

    this.currentVoice = candidate;
    return candidate;
  }

  speak(text, lang = "hi-IN", callbacks = {}) {
    if (!this.isSupported || !this.synth) {
      // Graceful fallback: text is displayed without voice failure blocking execution
      if (callbacks.onStart) callbacks.onStart();
      if (callbacks.onEnd) {
        // Approximate reading delay for natural feel
        const delay = Math.min(3000, Math.max(1000, text.length * 50));
        setTimeout(callbacks.onEnd, delay);
      }
      return;
    }

    // Cancel any ongoing utterance for instant interruption
    this.cancel();

    const voice = this.selectBestVoice(lang);
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = lang || "hi-IN";
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn("Speech synthesis notice:", event.error);
        if (callbacks.onError) callbacks.onError(event);
      }
      if (callbacks.onEnd) callbacks.onEnd();
    };

    // Chrome garbage collection workaround
    setTimeout(() => {
      try {
        this.synth.speak(utterance);
      } catch (err) {
        console.warn("Synthesis speak error:", err);
        this.isSpeaking = false;
        if (callbacks.onEnd) callbacks.onEnd();
      }
    }, 50);
  }

  cancel() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
      this.isSpeaking = false;
    }
  }
}

window.SpeechSynthesisManager = SpeechSynthesisManager;

/**
 * SANSKRITI AI - Voice Input & Speech Recognition Engine
 * Handles microphone capture, Web Speech API transcription, and audio level metering
 * Robust unsupported-browser handling and explicit error states
 */

class VoiceInputManager {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognition;
    this.recognition = this.isSupported ? new SpeechRecognition() : null;

    this.isListening = false;
    this.language = "hi-IN";
    this.interimResults = true;
    this.continuous = false;

    // Web Audio API for live frequency metering
    this.audioCtx = null;
    this.analyser = null;
    this.microphoneStream = null;
    this.meteringRaf = null;

    // Callbacks
    this.onResult = null;
    this.onStateChange = null;
    this.onAudioLevel = null;
    this.onError = null;

    if (this.isSupported) {
      this.initRecognition();
    }
  }

  getSupportStatus() {
    return {
      speechRecognition: this.isSupported,
      audioContext: !!(window.AudioContext || window.webkitAudioContext),
      mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
  }

  initRecognition() {
    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.lang = this.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStateChange) this.onStateChange("listening");
      this.startAudioMetering();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (this.onResult) {
        this.onResult({
          final: finalTranscript.trim(),
          interim: interimTranscript.trim()
        });
      }
    };

    this.recognition.onerror = (event) => {
      const errType = event.error;

      // Routine / expected interruptions
      if (errType === 'no-speech' || errType === 'aborted') {
        this.stopAudioMetering();
        this.isListening = false;
        if (this.onStateChange) this.onStateChange("idle");
        return;
      }

      console.warn("Speech recognition error:", errType);
      this.stopAudioMetering();
      this.isListening = false;

      let userFriendlyMessage = "Microphone error. Tap to retry.";
      if (errType === 'not-allowed' || errType === 'service-not-allowed') {
        userFriendlyMessage = "Microphone access was denied. Please allow microphone permissions.";
      } else if (errType === 'network') {
        userFriendlyMessage = "Speech service network error. Please check your connection.";
      } else if (errType === 'audio-capture') {
        userFriendlyMessage = "No microphone hardware detected on this device.";
      }

      if (this.onError) {
        this.onError({
          type: errType,
          message: userFriendlyMessage
        });
      }

      if (this.onStateChange) {
        this.onStateChange("error", { type: errType, message: userFriendlyMessage });
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.stopAudioMetering();
      if (this.onStateChange) this.onStateChange("idle");
    };
  }

  setLanguage(langCode) {
    this.language = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  start() {
    if (!this.isSupported) {
      const msg = "Speech recognition is not supported in this browser. Chrome or Edge is recommended. Keyboard input is available below.";
      if (this.onError) {
        this.onError({ type: "unsupported", message: msg });
      }
      if (this.onStateChange) {
        this.onStateChange("error", { type: "unsupported", message: msg });
      }
      return false;
    }

    if (this.isListening) return true;

    try {
      this.recognition.lang = this.language;
      this.recognition.start();
      return true;
    } catch (err) {
      console.warn("Recognition start notice:", err);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    this.stopAudioMetering();
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
    this.isListening = false;
    this.stopAudioMetering();
  }

  // Audio Level Metering via Web Audio API
  async startAudioMetering() {
    try {
      if (!this.microphoneStream && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (this.audioCtx && this.microphoneStream) {
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        const source = this.audioCtx.createMediaStreamSource(this.microphoneStream);
        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateMeter = () => {
          if (!this.isListening) return;
          this.analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const normalized = Math.min(1.0, average / 128.0);

          if (this.onAudioLevel) {
            this.onAudioLevel(normalized);
          }
          this.meteringRaf = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      }
    } catch (err) {
      // Proceed gracefully even if AudioContext is blocked
    }
  }

  stopAudioMetering() {
    if (this.meteringRaf) {
      cancelAnimationFrame(this.meteringRaf);
      this.meteringRaf = null;
    }
  }
}

window.VoiceInputManager = VoiceInputManager;

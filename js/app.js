/**
 * SANSKRITI AI - Master App Controller
 * Orchestrates voice-first loop, state machine, UI reactivity & settings
 * Strict error handling, session persistence & multi-device compatibility
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const masterMicBtn = document.getElementById('btn-master-mic');
  const micActionLabel = document.getElementById('mic-action-label');
  const speechBubble = document.getElementById('speech-bubble');
  const speechText = document.getElementById('speech-text');

  // Status Cards
  const cardVoiceMode = document.getElementById('card-voice-mode');
  const cardThinking = document.getElementById('card-thinking');
  const cardListening = document.getElementById('card-listening');
  const cardSpeaking = document.getElementById('card-speaking');
  const cardError = document.getElementById('card-error');
  const cardErrorSub = document.getElementById('card-error-sub');

  // System Alert Banner
  const systemAlertBanner = document.getElementById('system-alert-banner');
  const alertText = document.getElementById('alert-text');
  const btnAlertDismiss = document.getElementById('btn-alert-dismiss');

  // Visualizer Bars
  const vizBarsLeft = document.querySelectorAll('#visualizer-left .viz-bar');
  const vizBarsRight = document.querySelectorAll('#visualizer-right .viz-bar');

  // Drawer, Quick Input & Settings
  const btnTranscriptToggle = document.getElementById('btn-transcript-toggle');
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const transcriptDrawer = document.getElementById('transcript-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const settingsModal = document.getElementById('settings-modal');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const drawerMessagesList = document.getElementById('drawer-messages-list');
  const manualTextInput = document.getElementById('manual-text-input');
  const btnManualSend = document.getElementById('btn-manual-send');
  const quickTextInput = document.getElementById('quick-text-input');
  const btnQuickSend = document.getElementById('btn-quick-send');

  // Form Controls
  const selectVoice = document.getElementById('select-voice');
  const selectLang = document.getElementById('select-lang');
  const chkAutoResume = document.getElementById('chk-auto-resume');
  const chkPersistHistory = document.getElementById('chk-persist-history');
  const rangeRate = document.getElementById('range-rate');
  const rangePitch = document.getElementById('range-pitch');

  // Initialize Engines
  const conversation = new ConversationEngine();
  const speechSynth = new SpeechSynthesisManager();
  const voiceInput = new VoiceInputManager();

  // App State: 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
  let currentState = 'idle';
  let autoResumeEnabled = true;

  // Show In-UI Alert Banner
  function showAlert(message) {
    if (systemAlertBanner && alertText) {
      alertText.textContent = message;
      systemAlertBanner.style.display = 'flex';
    }
  }

  function hideAlert() {
    if (systemAlertBanner) {
      systemAlertBanner.style.display = 'none';
    }
  }

  if (btnAlertDismiss) {
    btnAlertDismiss.addEventListener('click', hideAlert);
  }

  // Set State (5 explicit states: idle, listening, thinking, speaking, error)
  function setState(state, errorInfo = null) {
    currentState = state;
    body.className = `state-${state}`;

    // Update Left Status Cards
    cardThinking.classList.toggle('active', state === 'thinking');
    cardListening.classList.toggle('active', state === 'listening');
    cardSpeaking.classList.toggle('active', state === 'speaking');
    cardVoiceMode.classList.toggle('active', state === 'listening' || state === 'speaking');

    if (state === 'error') {
      cardError.style.display = 'flex';
      cardError.classList.add('active');
      if (errorInfo && errorInfo.message) {
        cardErrorSub.textContent = errorInfo.message;
        showAlert(errorInfo.message);
      }
    } else {
      cardError.classList.remove('active');
      cardError.style.display = 'none';
      if (state === 'listening' || state === 'speaking') {
        hideAlert();
      }
    }

    // Update Master Mic Action Label
    switch (state) {
      case 'listening':
        micActionLabel.textContent = 'Listening...';
        break;
      case 'thinking':
        micActionLabel.textContent = 'Thinking...';
        break;
      case 'speaking':
        micActionLabel.textContent = 'Tap to Interrupt';
        break;
      case 'error':
        micActionLabel.textContent = 'Error - Tap to Retry';
        break;
      case 'idle':
      default:
        micActionLabel.textContent = 'Tap to Talk';
        break;
    }
  }

  // Populate Voice Options
  speechSynth.onVoicesLoaded = (voices) => {
    selectVoice.innerHTML = '<option value="auto">Auto (Best Natural Female Voice)</option>';
    voices.forEach((v, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = `${v.name} (${v.lang})`;
      selectVoice.appendChild(opt);
    });
  };

  // Render & Restore Messages in Drawer
  function renderAllMessages() {
    drawerMessagesList.innerHTML = '';
    const history = conversation.conversationHistory;

    if (!history || history.length === 0) {
      appendMessageToTranscript('assistant', "Hello Ashmit! 💙 Main hoon Sanskriti... Aapki AI Saathi! Aap mujhse Hindi, Punjabi ya English mein baat kar sakte hain.", false);
      return;
    }

    history.forEach(msg => {
      appendMessageToTranscript(msg.role, msg.text, false, msg.timestamp);
    });

    // Update speech bubble with last assistant message
    const lastAssistant = [...history].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      speechText.innerHTML = lastAssistant.text.replace(/\n/g, '<br>');
    }
  }

  // Add Message to Transcript Drawer
  function appendMessageToTranscript(role, text, shouldScroll = true, timestamp = null) {
    const item = document.createElement('div');
    item.className = `msg-item ${role}`;

    const author = document.createElement('div');
    author.className = 'msg-author';
    author.textContent = role === 'assistant' ? 'Sanskriti AI' : 'Ashmit';

    const bodyText = document.createElement('div');
    bodyText.className = 'msg-text';
    bodyText.textContent = text;

    const time = document.createElement('div');
    time.className = 'msg-time';
    const dateObj = timestamp ? new Date(timestamp) : new Date();
    time.textContent = `${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

    item.appendChild(author);
    item.appendChild(bodyText);
    item.appendChild(time);

    drawerMessagesList.appendChild(item);
    if (shouldScroll) {
      drawerMessagesList.scrollTop = drawerMessagesList.scrollHeight;
    }
  }

  // Handle Spoken or Typed Input
  async function handleUserInput(text) {
    if (!text || text.trim() === '') return;

    appendMessageToTranscript('user', text);
    setState('thinking');

    // Display thinking indicator in bubble
    speechText.innerHTML = `<em>Main soch rahi hoon, Ashmit...</em>`;

    try {
      const response = await conversation.processInput(text);

      // Display response
      speechText.innerHTML = response.text.replace(/\n/g, '<br>');
      appendMessageToTranscript('assistant', response.text);

      // Speak response
      setState('speaking');
      speechSynth.speak(response.text, response.lang || selectLang.value, {
        onStart: () => {
          setState('speaking');
        },
        onEnd: () => {
          setState('idle');
          // Auto-Resume listening loop
          if (autoResumeEnabled && chkAutoResume.checked) {
            setTimeout(() => {
              if (currentState === 'idle') {
                startListening();
              }
            }, 600);
          }
        },
        onError: () => {
          setState('idle');
        }
      });

    } catch (err) {
      console.error("Conversation processing error:", err);
      setState('error', { type: 'process_err', message: 'Kshama kijiye, ek takneeki samasya aayi.' });
      speechText.textContent = "Kshama kijiye, ek technical samasya aayi. Kripya punah koshish karein.";
    }
  }

  // Voice Input Events & State Transitions
  function startListening() {
    // If currently speaking, interrupt immediately!
    if (speechSynth.isSpeaking) {
      speechSynth.cancel();
    }
    voiceInput.setLanguage(selectLang.value);
    const success = voiceInput.start();
    if (!success && !voiceInput.isSupported) {
      setState('error', { type: 'unsupported', message: 'Speech recognition is unavailable. Keyboard mode is ready.' });
    }
  }

  function stopListening() {
    voiceInput.stop();
  }

  voiceInput.onStateChange = (state, details) => {
    if (state === 'listening') {
      setState('listening');
    } else if (state === 'error') {
      setState('error', details);
    } else if (state === 'idle' && currentState === 'listening') {
      setState('idle');
    }
  };

  voiceInput.onResult = ({ final, interim }) => {
    if (interim) {
      speechText.innerHTML = `<span style="opacity:0.8">Sun rahi hoon: "${interim}"...</span>`;
    }
    if (final) {
      handleUserInput(final);
    }
  };

  // Audio Frequency Metering Visualization
  voiceInput.onAudioLevel = (level) => {
    const bars = [...vizBarsLeft, ...vizBarsRight];
    bars.forEach((bar, i) => {
      const height = Math.max(6, Math.min(34, (level * 40) + ((i % 3) * 4)));
      bar.style.height = `${height}px`;
    });
  };

  // Master Mic Button Click Handler (Interaction, Interruption & Error Recovery)
  masterMicBtn.addEventListener('click', () => {
    if (currentState === 'speaking') {
      // 1. INSTANT INTERRUPTION
      speechSynth.cancel();
      setState('idle');
      startListening();
    } else if (currentState === 'listening') {
      // 2. Stop listening manually
      stopListening();
      setState('idle');
    } else if (currentState === 'error') {
      // 3. Error recovery
      setState('idle');
      hideAlert();
      startListening();
    } else {
      // 4. Start listening
      startListening();
    }
  });

  // Settings & Controls
  selectLang.addEventListener('change', (e) => {
    const lang = e.target.value;
    voiceInput.setLanguage(lang);
    conversation.setLanguage(lang);
    speechSynth.selectBestVoice(lang);
  });

  selectVoice.addEventListener('change', (e) => {
    if (e.target.value === 'auto') {
      speechSynth.selectBestVoice(selectLang.value);
    } else {
      const idx = parseInt(e.target.value, 10);
      speechSynth.currentVoice = speechSynth.voices[idx];
    }
  });

  chkAutoResume.addEventListener('change', (e) => {
    autoResumeEnabled = e.target.checked;
  });

  if (chkPersistHistory) {
    chkPersistHistory.checked = conversation.persistenceEnabled;
    chkPersistHistory.addEventListener('change', (e) => {
      conversation.setPersistence(e.target.checked);
    });
  }

  rangeRate.addEventListener('input', (e) => {
    speechSynth.rate = parseFloat(e.target.value);
  });

  rangePitch.addEventListener('input', (e) => {
    speechSynth.pitch = parseFloat(e.target.value);
  });

  // Quick Text Input (Accessible directly)
  if (btnQuickSend && quickTextInput) {
    btnQuickSend.addEventListener('click', () => {
      const text = quickTextInput.value.trim();
      if (text) {
        quickTextInput.value = '';
        handleUserInput(text);
      }
    });

    quickTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        btnQuickSend.click();
      }
    });
  }

  // Drawer Fallback Input
  btnManualSend.addEventListener('click', () => {
    const text = manualTextInput.value.trim();
    if (text) {
      manualTextInput.value = '';
      handleUserInput(text);
    }
  });

  manualTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnManualSend.click();
    }
  });

  // Clear Conversation History
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (confirm("Are you sure you want to clear conversation history?")) {
        conversation.clearHistory();
        renderAllMessages();
        speechText.innerHTML = "Hello Ashmit! &#128153;<br>Main hoon Sanskriti... Aapki AI Saathi!";
      }
    });
  }

  // Drawer Toggle
  btnTranscriptToggle.addEventListener('click', () => {
    transcriptDrawer.classList.toggle('open');
  });

  btnCloseDrawer.addEventListener('click', () => {
    transcriptDrawer.classList.remove('open');
  });

  // Settings Modal Toggle
  btnSettingsToggle.addEventListener('click', () => {
    settingsModal.classList.add('open');
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('open');
    }
  });

  // Check Browser Capability Support on Startup
  const support = voiceInput.getSupportStatus();
  if (!support.speechRecognition) {
    showAlert("Speech recognition is not supported in this browser. Chrome or Edge is recommended for voice input. Keyboard mode is enabled.");
  }

  // Restore Persisted History
  renderAllMessages();

  // Initialize Default State
  setState('idle');
});

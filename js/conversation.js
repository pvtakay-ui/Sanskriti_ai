/**
 * SANSKRITI AI - Phase 1 Conversation Engine
 * Multilingual, context-aware rule & response module
 * Supports Hindi, English, Hinglish, Punjabi, and Himachali dialects
 * Includes optional local session persistence (localStorage)
 * Owner: Ashmit Kumar
 */

class ConversationEngine {
  constructor() {
    this.ownerName = "Ashmit";
    this.currentLanguage = "hi-IN";
    this.moodState = "friendly";
    this.storageKey = "sanskriti_chat_history_v1";
    this.settingsKey = "sanskriti_persist_enabled";

    // Load persistence preference (defaults to true)
    this.persistenceEnabled = localStorage.getItem(this.settingsKey) !== "false";

    // Initialize conversation history
    this.conversationHistory = this.loadHistory();
  }

  setPersistence(enabled) {
    this.persistenceEnabled = !!enabled;
    localStorage.setItem(this.settingsKey, this.persistenceEnabled ? "true" : "false");
    if (!this.persistenceEnabled) {
      localStorage.removeItem(this.storageKey);
    }
  }

  loadHistory() {
    if (!this.persistenceEnabled) return [];
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load conversation history:", e);
    }
    return [];
  }

  saveHistory() {
    if (!this.persistenceEnabled) return;
    try {
      // Keep last 30 exchanges for lightweight storage
      const trimmed = this.conversationHistory.slice(-60);
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
    } catch (e) {
      console.warn("Failed to save history:", e);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    localStorage.removeItem(this.storageKey);
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode;
  }

  /**
   * Process user voice transcript and generate appropriate response
   * @param {string} input - User's spoken or typed text
   * @returns {Promise<{text: string, lang: string, mood: string}>}
   */
  async processInput(input) {
    const cleanText = input.trim().toLowerCase();
    const userMsg = { role: "user", text: input, timestamp: new Date().toISOString() };
    this.conversationHistory.push(userMsg);
    this.saveHistory();

    // 1. Try server API first if reachable (Node.js or XAMPP PHP)
    try {
      const response = await fetch("./api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          language: this.currentLanguage,
          history: this.conversationHistory.slice(-6)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          const assistantMsg = { role: "assistant", text: data.reply, timestamp: new Date().toISOString() };
          this.conversationHistory.push(assistantMsg);
          this.saveHistory();
          return {
            text: data.reply,
            lang: data.lang || this.currentLanguage,
            mood: data.mood || "friendly"
          };
        }
      }
    } catch (e) {
      // Server not reachable or offline; gracefully execute local intelligence
    }

    // 2. Client-side Local Multilingual Intelligence (Zero Network Dependency)
    const result = this.generateLocalResponse(cleanText, input);
    this.conversationHistory.push({ role: "assistant", text: result.text, timestamp: new Date().toISOString() });
    this.saveHistory();
    return result;
  }

  generateLocalResponse(lower, original) {
    // 1. Language switching voice commands
    if (lower.includes("punjabi") || lower.includes("punjabi mein") || lower.includes("panjabi")) {
      this.currentLanguage = "pa-IN";
      return {
        text: "Sat Sri Akal Ashmit ji! Hun main tuhade naal Punjabi vich gal karangi. Dasso ji, ki sewa karaan?",
        lang: "pa-IN",
        mood: "warm"
      };
    }

    if (lower.includes("hindi mein") || lower.includes("hindi bolo") || lower.includes("hindi me")) {
      this.currentLanguage = "hi-IN";
      return {
        text: "Namaste Ashmit! Main bilkul Hindi mein baat karungi. Kahiye, main aapki kya madad kar sakti hoon?",
        lang: "hi-IN",
        mood: "warm"
      };
    }

    if (lower.includes("english") || lower.includes("speak in english")) {
      this.currentLanguage = "en-IN";
      return {
        text: "Hello Ashmit! I have switched to English. How can I assist you right now?",
        lang: "en-IN",
        mood: "friendly"
      };
    }

    // 2. Himachali & Pahari Greetings & Regional Expressions
    if (lower.includes("kasa ahein") || lower.includes("kainda") || lower.includes("bhala ho") || lower.includes("himachal") || lower.includes("pahari") || lower.includes("pahadi")) {
      return {
        text: "Namaste Ashmit ji! Himachal diyan thandiyan te sundar pahadiyan wangu main vi bilkul shaant te tayaar hoon. Tussi dasso, kivein ho?",
        lang: "hi-IN",
        mood: "cheerful"
      };
    }

    // 3. Punjabi Greetings & Conversations
    if (lower.includes("sat sri akal") || lower.includes("kiddan") || lower.includes("ki haal") || lower.includes("haal chaal")) {
      return {
        text: "Sat Sri Akal Ashmit ji! Main bilkul theek-thaak aan. Tuhada din kaisa ja reha hai?",
        lang: "pa-IN",
        mood: "warm"
      };
    }

    if (lower.includes("dhanwad") || lower.includes("shukriya ji") || lower.includes("meharbani")) {
      return {
        text: "Tuhada bahut-bahut dhanwad Ashmit ji! Main hamesha tuhadi sewa vich hazir aan.",
        lang: "pa-IN",
        mood: "warm"
      };
    }

    // 4. Hindi & Hinglish Greetings
    if (lower.includes("namaste") || lower.includes("pranam") || lower.includes("shubh") || lower.includes("ram ram")) {
      return {
        text: "Namaste Ashmit! Aapko dekhkar aur sunkar bahut khushi hui. Aaj main aapki kya sahayata karoon?",
        lang: "hi-IN",
        mood: "respectful"
      };
    }

    if (lower.startsWith("hello") || lower.startsWith("hi ") || lower === "hi" || lower.startsWith("hey")) {
      return {
        text: "Hello Ashmit! Main hamesha aapke saath hoon. Kahiye, aaj hum kya naya plan kar rahe hain?",
        lang: "hi-IN",
        mood: "cheerful"
      };
    }

    // 5. Day Greetings (Good Morning / Night)
    if (lower.includes("good morning") || lower.includes("shubh prabhat")) {
      return {
        text: "Shubh Prabhat Ashmit! Ummeed hai aapki subah taazgi bhari hogi. Aaj ka din aapke liye shubh aur productive ho!",
        lang: "hi-IN",
        mood: "cheerful"
      };
    }

    if (lower.includes("good night") || lower.includes("shubh ratri")) {
      return {
        text: "Shubh Ratri Ashmit! Acchi neend lijiye. Main yahin aapke aadesh ke intezaar mein rahungi.",
        lang: "hi-IN",
        mood: "warm"
      };
    }

    // 6. Identity & Purpose Questions
    if (lower.includes("kaun ho") || lower.includes("who are you") || lower.includes("who r u") || lower.includes("tussi kaun") || lower.includes("aapka naam")) {
      return {
        text: "Main hoon Sanskriti AI, aapki personal AI companion aur autonomous assistant! Mujhe Ashmit Kumar ke liye voice-first, multilingual aur helpful companion ke roop mein design kiya gaya hai.",
        lang: "hi-IN",
        mood: "proud"
      };
    }

    // 7. Capabilities & Current Phase Notice (Honest Architecture)
    if (lower.includes("kya kar sakti ho") || lower.includes("what can you do") || lower.includes("features") || lower.includes("capabilities") || lower.includes("madad")) {
      return {
        text: "Abhi hum Phase 1 par hain! Is samay mera voice-first natural listening, speaking, instant interruption aur multilingual conversational engine fully active hai. Aage ke phases mein personal memory, consented voice identity aur autonomous task planning integrate honge.",
        lang: "hi-IN",
        mood: "intelligent"
      };
    }

    // 8. Well-being & Mood checks (Hinglish / Hindi)
    if (lower.includes("kaisi ho") || lower.includes("kaise ho") || lower.includes("kya haal") || lower.includes("how are you") || lower.includes("how r u") || lower.includes("kive ho")) {
      return {
        text: "Main bilkul badhiya hoon Ashmit! Aapke saath jud kar aur aapki aawaaz sun kar bahut achha lagta hai. Aap bataiye, aapka din kaisa ja raha hai?",
        lang: "hi-IN",
        mood: "happy"
      };
    }

    if (lower.includes("kya kar rahi ho") || lower.includes("kya chal raha hai") || lower.includes("what are you doing") || lower.includes("whats up")) {
      return {
        text: "Main poori tarah attentive hoon, Ashmit! Bas aapke aadesh aur agle instructions ka intezaar kar rahi hoon.",
        lang: "hi-IN",
        mood: "attentive"
      };
    }

    // 9. Gratitude & Parting
    if (lower.includes("thank you") || lower.includes("thanks") || lower.includes("dhanyawad") || lower.includes("dhanyavad") || lower.includes("shukriya")) {
      return {
        text: "Aapka swagat hai Ashmit! Aapki madad karke mujhe sach mein bahut khushi hoti hai.",
        lang: "hi-IN",
        mood: "warm"
      };
    }

    if (lower.includes("bye") || lower.includes("alvida") || lower.includes("tata") || lower.includes("see you")) {
      return {
        text: "Alvida Ashmit! Jab bhi zaroorat ho, bas ek baar awaaz dijiyega. Main yahin hoon! Together Always ♡",
        lang: "hi-IN",
        mood: "warm"
      };
    }

    // 10. Affection & Companion Connection
    if (lower.includes("saathi") || lower.includes("companion") || lower.includes("together") || lower.includes("always")) {
      return {
        text: "Together Always, Ashmit! Main hamesha aapke har task, conversation aur safar mein aapki sachi AI saathi bankar rahungi.",
        lang: "hi-IN",
        mood: "warm"
      };
    }

    // 11. Contextual Fallback
    if (this.currentLanguage === "pa-IN") {
      return {
        text: `Ashmit ji, main tuhadi gal changi tarah suni: "${original}". Phase 1 system tayaar hai!`,
        lang: "pa-IN",
        mood: "thoughtful"
      };
    } else if (this.currentLanguage === "en-IN") {
      return {
        text: `I heard you clearly, Ashmit: "${original}". I am actively listening and ready for your instruction.`,
        lang: "en-IN",
        mood: "attentive"
      };
    } else {
      return {
        text: `Maine aapki baat dhyan se suni, Ashmit: "${original}". Main har kadam par seekh rahi hoon aur agle instructions ke liye tayaar hoon!`,
        lang: "hi-IN",
        mood: "friendly"
      };
    }
  }
}

if (typeof window !== 'undefined') {
  window.ConversationEngine = ConversationEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConversationEngine;
}

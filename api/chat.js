/**
 * SANSKRITI AI - Conversation Chat Endpoint
 * Vercel Serverless Function & Node.js HTTP compatible
 * POST /api/chat
 */

function parseRequestBody(req) {
  return new Promise((resolve) => {
    // If body already parsed by Vercel or body-parser
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }

    if (typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch (e) {
        return resolve({});
      }
    }

    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) { // 1MB protection
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch (e) {
        resolve({});
      }
    });

    req.on('error', () => {
      resolve({});
    });
  });
}

function processConversation(message, lang) {
  const lower = (message || '').trim().toLowerCase();
  const rawMsg = (message || '').trim();

  // 1. Himachali & Pahari Dialect
  if (lower.includes('kasa ahein') || lower.includes('himachal') || lower.includes('pahari') || lower.includes('pahadi') || lower.includes('kainda')) {
    return {
      reply: 'Namaste Ashmit ji! Himachal diyan thandiyan te sundar pahadiyan wangu main vi bilkul shaant te tayaar hoon. Kahiye, ki sewa karaan?',
      lang: 'hi-IN',
      mood: 'cheerful'
    };
  }

  // 2. Punjabi Greetings & Conversation
  if (lower.includes('sat sri akal') || lower.includes('kiddan') || lower.includes('ki haal') || lower.includes('haal chaal')) {
    return {
      reply: 'Sat Sri Akal Ashmit ji! Main tuhade naal hamesha tayaar aan. Tuhada din kaisa ja reha hai?',
      lang: 'pa-IN',
      mood: 'warm'
    };
  }

  if (lower.includes('dhanwad') || lower.includes('shukriya ji')) {
    return {
      reply: 'Tuhada bahut-bahut dhanwad Ashmit ji! Main hamesha tuhadi sewa vich hazir aan.',
      lang: 'pa-IN',
      mood: 'warm'
    };
  }

  // 3. Identity / Assistant
  if (lower.includes('who are you') || lower.includes('kaun ho') || lower.includes('tussi kaun') || lower.includes('aapka naam')) {
    return {
      reply: 'Main Sanskriti AI hoon — Ashmit Kumar ji ki personal voice-first AI companion aur autonomous assistant! Main aapki aawaaz samajhkar madad karne ke liye tayaar hoon.',
      lang: 'hi-IN',
      mood: 'proud'
    };
  }

  // 4. Capability / Phase 1 Honesty
  if (lower.includes('kya kar sakti ho') || lower.includes('what can you do') || lower.includes('features') || lower.includes('capabilities')) {
    return {
      reply: 'Abhi hum Phase 1 par hain! Mera voice-first natural listening, speaking, instant interruption aur multilingual conversational engine fully active hai. Aage ke phases mein personal memory, consented voice identity aur autonomous task planning integrate honge.',
      lang: 'hi-IN',
      mood: 'intelligent'
    };
  }

  // 5. Language Switching Commands
  if (lower.includes('punjabi bolo') || lower.includes('punjabi vich')) {
    return {
      reply: 'Sat Sri Akal Ashmit ji! Hun main tuhade naal Punjabi vich hi gal kiti karengi.',
      lang: 'pa-IN',
      mood: 'warm'
    };
  }

  if (lower.includes('hindi bolo') || lower.includes('hindi mein')) {
    return {
      reply: 'Namaste Ashmit! Main bilkul Hindi mein baat karungi. Kahiye, main aapki kya madad karoon?',
      lang: 'hi-IN',
      mood: 'respectful'
    };
  }

  if (lower.includes('english') || lower.includes('speak in english')) {
    return {
      reply: 'Hello Ashmit! I have switched to English. How can I assist you right now?',
      lang: 'en-IN',
      mood: 'friendly'
    };
  }

  // 6. Hinglish & Hindi Greetings
  if (lower.includes('namaste') || lower.includes('pranam') || lower.includes('ram ram')) {
    return {
      reply: 'Namaste Ashmit! Aapko dekhkar aur sunkar bahut khushi hui. Aaj main aapki kya sahayata karoon?',
      lang: 'hi-IN',
      mood: 'respectful'
    };
  }

  if (lower.startsWith('hello') || lower.startsWith('hi ') || lower === 'hi' || lower.startsWith('hey')) {
    return {
      reply: 'Hello Ashmit! Main hamesha aapke saath hoon. Kahiye, aaj hum kya naya plan kar rahe hain?',
      lang: 'hi-IN',
      mood: 'cheerful'
    };
  }

  // 7. Well-being Checks
  if (lower.includes('kaisi ho') || lower.includes('kaise ho') || lower.includes('kya haal') || lower.includes('how are you')) {
    return {
      reply: 'Main bilkul badhiya hoon Ashmit! Aapke saath jud kar aur aapki aawaaz sun kar bahut achha lagta hai. Aap bataiye, aapka din kaisa ja raha hai?',
      lang: 'hi-IN',
      mood: 'happy'
    };
  }

  // 8. Gratitude & Parting
  if (lower.includes('thank you') || lower.includes('thanks') || lower.includes('dhanyawad') || lower.includes('shukriya')) {
    return {
      reply: 'Aapka swagat hai Ashmit! Aapki madad karke mujhe sach mein bahut khushi hoti hai.',
      lang: 'hi-IN',
      mood: 'warm'
    };
  }

  if (lower.includes('bye') || lower.includes('alvida') || lower.includes('see you')) {
    return {
      reply: 'Alvida Ashmit! Jab bhi zaroorat ho, bas ek baar aawaaz dijiyega. Main yahin hoon! Together Always ♡',
      lang: 'hi-IN',
      mood: 'warm'
    };
  }

  // 9. Companionship
  if (lower.includes('saathi') || lower.includes('companion') || lower.includes('together') || lower.includes('always')) {
    return {
      reply: 'Together Always, Ashmit! Main hamesha aapke har task, conversation aur safar mein aapki sachi AI saathi bankar rahungi.',
      lang: 'hi-IN',
      mood: 'warm'
    };
  }

  // 10. Default Contextual Responses
  if (lang === 'pa-IN') {
    return {
      reply: `Ashmit ji, main tuhadi gal changi tarah suni: "${rawMsg}". Phase 1 voice-first system active hai!`,
      lang: 'pa-IN',
      mood: 'friendly'
    };
  }

  if (lang === 'en-IN' || lang === 'en-US') {
    return {
      reply: `I heard you clearly, Ashmit: "${rawMsg}". Phase 1 voice-first system is active and ready for instructions!`,
      lang: 'en-IN',
      mood: 'friendly'
    };
  }

  return {
    reply: `Namaste Ashmit! Maine aapki baat dhyan se sun li: "${rawMsg}". Phase 1 voice-first system poori tarah active hai!`,
    lang: 'hi-IN',
    mood: 'friendly'
  };
}

module.exports = async (req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    const errorPayload = { error: 'Method Not Allowed. Use POST.' };
    if (typeof res.status === 'function') {
      return res.status(405).json(errorPayload);
    } else {
      res.statusCode = 405;
      return res.end(JSON.stringify(errorPayload));
    }
  }

  const body = await parseRequestBody(req);
  const userMsg = (body && body.message ? String(body.message) : '').trim();
  const lang = body && body.language ? String(body.language) : 'hi-IN';

  const reply = processConversation(userMsg, lang);

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(reply);
  } else {
    res.statusCode = 200;
    return res.end(JSON.stringify(reply));
  }
};

module.exports.processConversation = processConversation;


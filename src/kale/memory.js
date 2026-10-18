// Self-learning and conversational memory engine for Kyle.
// Automatically extracts and retains visitor profile, conversation context,
// and user-taught facts with strict storage limits (rolling FIFO/LRU).
// Runs 100% locally in the browser with zero external calls.

export const MEMORY_LIMITS = {
  MAX_FACTS: 50,           // Maximum learned facts/knowledge items
  MAX_TURNS: 60,           // Maximum conversation messages retained
  MAX_TRAITS: 20,          // Maximum visitor profile attributes
  STORAGE_KEY: "kyle_slm_memory_v1",
};

const DEFAULT_STORE = {
  profile: {},             // Extracted visitor profile (name, company, role, email, interests)
  facts: [],               // Learned knowledge items: [{ id, text, topic, addedAt, uses }]
  history: [],             // Rolling chat log: [{ id, who, text, time }]
  customAnswers: {},       // Altered Q&A pairs: { normalizedQuery: { text, action } }
  learningEnabled: true,
};

function loadStore() {
  if (typeof window === "undefined" || !window.localStorage) return { ...DEFAULT_STORE };
  try {
    const raw = window.localStorage.getItem(MEMORY_LIMITS.STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STORE };
    const parsed = JSON.parse(raw);
    return {
      profile: parsed.profile || {},
      facts: Array.isArray(parsed.facts) ? parsed.facts.slice(-MEMORY_LIMITS.MAX_FACTS) : [],
      history: Array.isArray(parsed.history) ? parsed.history.slice(-MEMORY_LIMITS.MAX_TURNS) : [],
      customAnswers: parsed.customAnswers || {},
      learningEnabled: parsed.learningEnabled !== false,
    };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

let store = loadStore();

function persistStore() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    // Keep strictly within limits
    const safePayload = {
      profile: store.profile,
      facts: store.facts.slice(-MEMORY_LIMITS.MAX_FACTS),
      history: store.history.slice(-MEMORY_LIMITS.MAX_TURNS),
      customAnswers: store.customAnswers,
      learningEnabled: store.learningEnabled,
    };
    window.localStorage.setItem(MEMORY_LIMITS.STORAGE_KEY, JSON.stringify(safePayload));
    notifyListeners();
  } catch (err) {
    console.warn("Kyle memory persist error:", err);
  }
}

const listeners = new Set();
function notifyListeners() {
  listeners.forEach((fn) => fn(getMemoryStats()));
}

export function subscribeMemory(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getMemoryStats() {
  return {
    factsCount: store.facts.length,
    maxFacts: MEMORY_LIMITS.MAX_FACTS,
    turnsCount: store.history.length,
    maxTurns: MEMORY_LIMITS.MAX_TURNS,
    profileKeys: Object.keys(store.profile).length,
    customAnswersCount: Object.keys(store.customAnswers).length,
    learningEnabled: store.learningEnabled,
    profile: { ...store.profile },
    facts: [...store.facts],
  };
}

export function toggleLearning(enable) {
  store.learningEnabled = typeof enable === "boolean" ? enable : !store.learningEnabled;
  persistStore();
  return store.learningEnabled;
}

export function clearMemory() {
  store = { ...DEFAULT_STORE, profile: {}, facts: [], history: [], customAnswers: {} };
  persistStore();
}

// Extract visitor profile traits like name, role, company, email from user message
function extractVisitorTraits(text) {
  const patch = {};
  const lower = text.toLowerCase();

  // Name: "my name is Alex", "I am John", "I'm Sarah", "call me Maya"
  const nameMatch = text.match(/\b(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+)\b/i);
  if (nameMatch && !/^(hiring|recruiter|engineer|developer|looking|here|interested|omkar|a|an|the|just|from)$/i.test(nameMatch[1])) {
    patch.name = nameMatch[1].trim();
  }

  // Email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    patch.email = emailMatch[1].toLowerCase();
  }

  // Company: "I work at Acme", "from Google", "at Stripe", "company is Meta"
  const compMatch = text.match(/\b(?:work at|work for|from|company is|representing)\s+([A-Z0-9][A-Za-z0-9&. -]{1,25})\b/i);
  if (compMatch && !/^(pune|india|home|college|university|ncer|mumbai)$/i.test(compMatch[1].trim())) {
    patch.company = compMatch[1].trim();
  }

  // Role: "recruiter", "engineering manager", "founder", "student", "developer"
  if (/\b(recruiter|talent acquisition|headhunter)\b/i.test(lower)) {
    patch.role = "Recruiter";
  } else if (/\b(engineering manager|tech lead|cto|vp engineering|team lead)\b/i.test(lower)) {
    patch.role = "Engineering Manager";
  } else if (/\b(software engineer|ai engineer|ml engineer|developer)\b/i.test(lower)) {
    patch.role = "Engineer";
  } else if (/\b(founder|co-founder|ceo)\b/i.test(lower)) {
    patch.role = "Founder";
  }

  // Areas of interest
  const interests = store.profile.interests ? [...store.profile.interests] : [];
  if (/\b(pneumonia|xai|research|paper)\b/i.test(lower) && !interests.includes("Research")) interests.push("Research");
  if (/\b(erp|trihub|systems|production)\b/i.test(lower) && !interests.includes("TriHub ERP")) interests.push("TriHub ERP");
  if (/\b(hire|intern|role|job|resume|cv)\b/i.test(lower) && !interests.includes("Hiring")) interests.push("Hiring");
  if (/\b(transformer|oulad|academic risk)\b/i.test(lower) && !interests.includes("Academic Risk")) interests.push("Academic Risk");
  if (interests.length > 0) patch.interests = interests.slice(-5);

  return patch;
}

// Auto-store conversation turn and extract insights
export function recordInteraction(who, text) {
  if (!text || typeof text !== "string") return;
  const clean = text.trim();
  if (!clean) return;

  // Append to history with rolling limit
  store.history.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    who,
    text: clean.slice(0, 400),
    time: Date.now(),
  });
  if (store.history.length > MEMORY_LIMITS.MAX_TURNS) {
    store.history = store.history.slice(-MEMORY_LIMITS.MAX_TURNS);
  }

  if (who === "you" && store.learningEnabled) {
    // Extract visitor profile traits
    const traits = extractVisitorTraits(clean);
    if (Object.keys(traits).length > 0) {
      store.profile = { ...store.profile, ...traits, lastSeen: Date.now() };
    }

    // Auto-detect learning prompts:
    // "Remember that...", "Learn this:...", "Note that...", "Actually,..."
    const learnMatch = clean.match(/^(?:remember that|note that|learn this:?|please remember|keep in mind that|actually,?)\s+(.+)$/i);
    if (learnMatch && learnMatch[1].length > 6) {
      teachFact(learnMatch[1].trim(), "conversation");
    }
  }

  persistStore();
}

// Learn a new explicit fact with automatic FIFO pruning
export function teachFact(factText, topic = "general") {
  if (!factText || typeof factText !== "string") return false;
  const text = factText.trim().slice(0, 280);
  if (text.length < 5) return false;

  // Check duplicate
  const existing = store.facts.find((f) => f.text.toLowerCase() === text.toLowerCase());
  if (existing) {
    existing.uses = (existing.uses || 0) + 1;
    existing.addedAt = Date.now();
    persistStore();
    return true;
  }

  // Prune oldest if at limit
  if (store.facts.length >= MEMORY_LIMITS.MAX_FACTS) {
    // Remove oldest with least uses
    store.facts.sort((a, b) => (a.uses || 0) - (b.uses || 0) || a.addedAt - b.addedAt);
    store.facts.shift();
  }

  store.facts.push({
    id: "f_" + Date.now().toString(36),
    text,
    topic,
    addedAt: Date.now(),
    uses: 1,
  });

  persistStore();
  return true;
}

export function normalizeQuery(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).join(" ");
}

// User-altered response from the UI Inspector: direct Q&A override
export function alterAnswer(question, answerText, action = null) {
  const norm = normalizeQuery(question);
  if (!norm || !answerText) return;

  store.customAnswers[norm] = {
    text: answerText.trim(),
    action: action || undefined,
    alteredAt: Date.now(),
  };

  // Also store into learned facts for generalization
  teachFact(`When asked about "${question}", the answer is: ${answerText.trim()}`, "custom-qa");
  persistStore();
}

export function removeAlteredAnswer(question) {
  const norm = normalizeQuery(question);
  if (store.customAnswers[norm]) {
    delete store.customAnswers[norm];
    persistStore();
  }
}

// Normalize text for token matching
function tokenize(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);
}

// Query the memory bank for personal profile reflection or learned facts
export function findLearnedAnswer(question) {
  if (!store.learningEnabled) return null;
  const q = question.toLowerCase().trim();
  const normQ = normalizeQuery(q);
  const tokens = tokenize(q);

  // 1. Check exact custom Q&A override first
  for (const [key, val] of Object.entries(store.customAnswers)) {
    if (normQ === key || normQ.includes(key) || key.includes(normQ)) {
      return { text: val.text, action: val.action, source: "learned:custom" };
    }
  }

  // 2. Personal profile reflection questions
  const p = store.profile;
  if (/\b(who am i|what is my name|what's my name|do you know my name|my name)\b/i.test(q)) {
    if (p.name) {
      return {
        text: `You're ${p.name}${p.company ? ` from ${p.company}` : ""}${p.role ? `, working as a ${p.role}` : ""}! I remembered that from our conversation.`,
        source: "memory:profile",
      };
    }
    return {
      text: "I haven't learned your name yet! Feel free to tell me by saying 'My name is...' or 'I'm...'.",
      source: "memory:profile",
    };
  }

  if (/\b(where do i work|what company|my company|my organization)\b/i.test(q)) {
    if (p.company) {
      return {
        text: `You work at ${p.company}${p.role ? ` as a ${p.role}` : ""}!`,
        source: "memory:profile",
      };
    }
    return {
      text: "You haven't mentioned your company yet. You can tell me anytime, like 'I work at Acme Corp'.",
      source: "memory:profile",
    };
  }

  if (/\b(what do you know about me|what have you learned|what's in your memory|my profile|do you remember me)\b/i.test(q)) {
    const details = [];
    if (p.name) details.push(`Name: ${p.name}`);
    if (p.role) details.push(`Role: ${p.role}`);
    if (p.company) details.push(`Company: ${p.company}`);
    if (p.email) details.push(`Email: ${p.email}`);
    if (p.interests?.length) details.push(`Interests: ${p.interests.join(", ")}`);

    if (details.length > 0 || store.facts.length > 0) {
      return {
        text: `Here is what I've learned from our session: ${details.length ? details.join(" · ") + "." : ""} (Plus ${store.facts.length} custom learned knowledge items).`,
        source: "memory:profile",
      };
    }
    return {
      text: "My conversational memory is active, but I haven't recorded personal details for you yet. As we talk, I'll automatically learn your name, role, and any facts you teach me!",
      source: "memory:profile",
    };
  }

  // 3. Search learned facts by token similarity
  if (store.facts.length > 0 && tokens.length > 0) {
    let bestFact = null;
    let bestScore = 0;

    for (const fact of store.facts) {
      const factTokens = tokenize(fact.text);
      let matchCount = 0;
      for (const t of tokens) {
        if (factTokens.includes(t)) matchCount++;
      }
      const score = matchCount / Math.max(tokens.length, 3);
      if (score > bestScore && score >= 0.45) {
        bestScore = score;
        bestFact = fact;
      }
    }

    if (bestFact) {
      bestFact.uses = (bestFact.uses || 0) + 1;
      persistStore();
      return {
        text: bestFact.text,
        source: "learned:fact",
      };
    }
  }

  return null;
}

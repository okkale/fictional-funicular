// Kyle (Knowledge Assistant for Learning & Engineering): Omkar's on-page guide.
// Pure intent rules over the portfolio data. No DOM here: each answer returns text plus an
// optional action, and the UI (Kale.jsx) performs it. Runs fully in the browser.
import { profile, xaiPaper } from "../data";

export const NAME = "Kyle";

// Every section a tour or an action may scroll to.
export const SECTIONS = ["#top", "#hero", "#metrics", "#build", "#expertise", "#projects", "#lab", "#systems", "#experience", "#stack", "#contact"];

const INTENTS = [
  {
    test: /\b(hi|hello|hey|namaste|yo)\b/,
    run: () => ({ text: `Hi! I'm ${NAME}, Omkar's assistant. Ask me about his research, his projects, the ERP he built, or how to hire him. Or you can just take the tour.` }),
  },
  {
    test: /resume|résumé|\bcv\b|download/,
    run: () => ({ text: "Sure, downloading Omkar's résumé for you now.", action: { type: "download" } }),
  },
  {
    test: /pneumonia|x-?ray|xai|grad-?cam|shap|lime|explain|medical/,
    run: () => ({
      text: `That's his published paper, ${xaiPaper.title}, and Omkar is the first author. He compared Grad-CAM, LIME and SHAP to see which explanation is fast and faithful enough for a clinic. Let me open it in Projects.`,
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /transformer|academic|student risk|oulad|attention|time series|temporal|at-risk/,
    run: () => ({
      text: "That's his academic risk project, built with T. Shinde. A temporal transformer reads weekly learning activity and flags students who are at risk, with 94.6% accuracy and 0.93 ROC-AUC across 32,000+ students. The paper for it is still in progress.",
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /research|paper|publication|publish/,
    run: () => ({
      text: "He has one published paper, as first author, on explainable pneumonia detection with CNNs, Grad-CAM, LIME and SHAP. A second one, on academic risk prediction, is still in progress. Both are in Projects.",
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /erp|trihub|agent|system|production|live|pipeline|lab/,
    run: () => ({
      text: "TriHub ERP is a multi-tenant college ERP Omkar built. Admissions, academics, exams, fees and certificates, all in one record, for admins, HODs, faculty and students. It's running in production with AI agents inside the daily work. The Model Lab shows it.",
      action: { type: "scroll", target: "#lab" },
    }),
  },
  {
    test: /project|built|build|speech|audio|summar|yaatra|travel|portfolio/,
    run: () => ({
      text: "Four AI projects: the published pneumonia XAI paper, academic risk prediction with a temporal transformer, a long-form speech to summary pipeline, and YaatraSarthi, an AI travel recommender.",
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /skill|expert|stack|tech|tool|language|framework|keras|tensorflow|python|good at/,
    run: () => ({
      text: "Five areas: deep learning, explainable AI, applied ML, AI systems and agents, and engineering. And every skill in Expertise links to the project where he actually used it.",
      action: { type: "scroll", target: "#expertise" },
    }),
  },
  {
    test: /experience|work|founder|startup|education|college|degree/,
    run: () => ({
      text: "He's in the final year of a B.E. in Computer Science with AI, graduating in 2027. He's also co-founder and CMO at Triverse Solutions, founder of VOK Partners, and he organised a national-level hackathon.",
      action: { type: "scroll", target: "#experience" },
    }),
  },
  {
    test: /github|code|repo/,
    run: () => ({ text: "Opening Omkar's GitHub in a new tab.", action: { type: "open", target: profile.github } }),
  },
  {
    test: /linkedin/,
    run: () => ({ text: "Opening his LinkedIn in a new tab.", action: { type: "open", target: profile.linkedin } }),
  },
  {
    test: /hire|contact|email|mail|reach|talk|available|job|role|intern/,
    run: () => ({
      text: `Omkar is open to ML, applied AI and agent engineering roles, and internships also. You can email him at ${profile.email}.`,
      action: { type: "scroll", target: "#contact" },
    }),
  },
  {
    test: /who|about|omkar|yourself|introduce/,
    run: () => ({
      text: "Omkar Kale is a final-year AI engineering student in Pune. He publishes explainable deep learning research, and he ships it inside real software, like the TriHub ERP.",
      action: { type: "scroll", target: "#hero" },
    }),
  },
  {
    test: /author|coauthor|co-author|who wrote/,
    run: () => ({
      text: "The pneumonia paper was authored by Omkar Kale as first author, alongside S. Salunke, S. Shinde, P. Thomake, P. Patil and R. Patil.",
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /oulad|peak week|critical week|weeks 6 to 8/,
    run: () => ({
      text: "The academic risk model trained on OULAD data across 32,000+ students. The attention weights showed weeks 6 to 8 are the critical window to flag at-risk students.",
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /\b(who are you|what is kyle|what model|how do you work|slm architecture)\b/,
    run: () => ({
      text: `I'm ${NAME}, Knowledge Assistant for Learning and Engineering. I'm an on-device character-level transformer with about 0.8M parameters, running 100% locally in your browser with zero server calls.`,
    }),
  },
  {
    test: /\b(metric|number|highlight|achievement)s?\b/,
    run: () => ({
      text: "The highlights: one published paper as first author, four AI projects, 94.6% accuracy on academic risk, 3000+ student records in CRM, and a live ERP.",
      action: { type: "scroll", target: "#metrics" },
    }),
  },
  {
    test: /help|what can you|command/,
    run: () => ({ text: "You can ask me things like: show research, the pneumonia paper, projects, open the ERP, skills, download résumé, or how do I hire him. Or start a tour." }),
  },
];

const FALLBACK = "Hmm, I don't know that one yet. Try asking about his research, projects, the ERP, skills, résumé or contact. Or start a tour from the buttons below.";

// The keyword rule that matches, as { text, action? }, or null when none does.
export function matchIntent(raw) {
  const q = raw.trim().toLowerCase();
  for (const it of INTENTS) if (q && it.test.test(q)) return it.run(q);
  return null;
}

// Returns { text, action? }, or null for empty input.
export function answer(raw) {
  if (!raw.trim()) return null;
  return matchIntent(raw) ?? { text: FALLBACK };
}

// Guided tours, one per kind of visitor. Each stop scrolls to a section, shows its title in the
// caption bar and narrates `line`. `tab` opens a research paper. `through` extends the stop to the
// end of a following section, so a short section and its neighbour are seen together.
export const TOURS = {
  recruiter: [
    {
      target: "#hero",
      title: "Who Omkar is",
      line: "Hey there. Meet Omkar Kale. He's wrapping up his AI engineering degree in Pune, finishing in 2027, and he's on the lookout for ML and AI engineer roles, or a good internship.",
    },
    {
      target: "#metrics",
      through: "#build", // the numbers, then the whole "Models that ship" portal
      title: "Proof in numbers",
      line: "Let's start with the highlights. One published research paper, four AI projects, a model that hits 94.6 percent accuracy on academic risk, and an ERP that real people use every day. Just below, you'll see the four kinds of work he does.",
    },
    {
      target: "#expertise",
      title: "What he's good at",
      line: "Here's where his skills live, grouped into five areas. The nice part is that nothing here is just a claim. Each skill points to the actual project behind it, so you can see the proof for yourself.",
    },
    {
      target: "#projects",
      title: "Projects",
      line: "On to the projects. Leading the pack is his published paper on explainable pneumonia detection, where he's the first author. Next up, a temporal transformer that predicts academic risk, with that paper on the way. And rounding it out, a speech summariser and a travel recommender.",
    },
    {
      target: "#lab",
      title: "Shipped software",
      line: "Research is only half the story, because he ships too. TriHub ERP is live in production, with AI agents handling everyday tasks. Around it, you've got CRM pipelines and a content automation engine.",
    },
    {
      target: "#experience",
      title: "Leadership",
      line: "Outside the classroom, he's been busy. He co-founded Triverse Solutions, started VOK Partners, and ran a national-level hackathon.",
    },
    {
      target: "#contact",
      title: "How to hire him",
      line: "And that brings us to the end. If you're hiring for 2026 or 2027, here's how to get in touch with him. Want his résumé? Just ask, and I'll grab it for you.",
    },
  ],
  engineer: [
    {
      target: "#expertise",
      title: "The skill map",
      line: "Let's kick things off with the skill map. Notice the little chips under each skill? Tap one, and I'll walk you straight to the work that backs it up.",
    },
    {
      target: "#projects",
      title: "Projects",
      line: "First up, the published work. He put a few CNN backbones head to head on chest X-rays, then tested which explanation method is quick enough, and trustworthy enough, for real clinical use. After that, there's a temporal transformer for academic risk that outperformed LSTM and GRU baselines. Every other build here shows its input, model, and output.",
    },
    {
      target: "#lab",
      title: "Agents in production",
      line: "Now for the engineering side. These are LLM agents that read through records, write up follow-ups, and keep tasks moving across the ERP, the CRM, and web apps.",
    },
    {
      target: "#stack",
      title: "Toolkit",
      line: "Last stop, the toolkit that makes it all happen, from the notebooks where models get trained, to the services running them in production.",
    },
  ],
  explore: [
    {
      target: "#hero",
      title: "Welcome",
      line: "Hey, glad you stopped by. Feel free to look around at your own pace. I'll hang out down in the corner, so hit Control K any time you've got a question.",
    },
    {
      target: "#build",
      title: "What he builds",
      line: "Here's a quick look at the four kinds of things Omkar builds, ranging from research models all the way to agents working inside real software.",
    },
    {
      target: "#projects",
      title: "Projects",
      line: "These are his projects. The first one is his published paper, on explainable pneumonia detection.",
    },
    {
      target: "#contact",
      title: "Say hello",
      line: "And if you'd like to chat with Omkar himself, you'll find everything you need right here.",
    },
  ],
};

export const SUGGEST = ["Show research", "Pneumonia paper", "Open the ERP", "Skills", "Download résumé", "How to hire him"];

// Every fixed line Kyle can say from this file, for recording the neural voice.
export function spokenLines() {
  return [...INTENTS.map((it) => it.run("").text), FALLBACK, ...Object.values(TOURS).flat().map((s) => s.line)];
}

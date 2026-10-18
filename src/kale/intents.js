// K.A.L.E. (Knowledge Assistant for Learning & Engineering): Omkar's on-page guide.
// Pure intent rules over the portfolio data. No DOM here: each answer returns text plus an
// optional action, and the UI (Kale.jsx) performs it. Runs fully in the browser.
import { profile, xaiPaper } from "../data";

export const NAME = "K.A.L.E.";

// Every section a tour or an action may scroll to.
export const SECTIONS = ["#top", "#hero", "#metrics", "#build", "#expertise", "#projects", "#lab", "#systems", "#experience", "#stack", "#contact"];

const INTENTS = [
  {
    test: /\b(hi|hello|hey|namaste|yo)\b/,
    run: () => ({ text: `Hello. I'm ${NAME}, Omkar's assistant. Ask me about his research, his projects, the ERP he shipped, or how to hire him. Or take the tour.` }),
  },
  {
    test: /resume|résumé|\bcv\b|download/,
    run: () => ({ text: "Downloading Omkar's résumé now.", action: { type: "download" } }),
  },
  {
    test: /pneumonia|x-?ray|xai|grad-?cam|shap|lime|explain|medical/,
    run: () => ({
      text: `${xaiPaper.title}: a published paper, with Omkar as first author. It compares Grad-CAM, LIME and SHAP to find which explanation is fast and faithful enough for a clinic. Opening it in Projects.`,
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /transformer|academic|student risk|oulad|attention|time series|temporal|at-risk/,
    run: () => ({
      text: "Academic risk prediction is one of Omkar's projects, built with T. Shinde: a temporal transformer that flags at-risk students from weekly learning activity, at 94.6% accuracy and 0.93 ROC-AUC across 32,000+ students. Its paper is in progress.",
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /research|paper|publication|publish/,
    run: () => ({
      text: "Omkar is first author of a published paper on explainable pneumonia detection with CNNs, Grad-CAM, LIME and SHAP. A second paper, on academic risk prediction, is in progress. Both are in Projects.",
      action: { type: "scroll", target: "#projects" },
    }),
  },
  {
    test: /erp|trihub|agent|system|production|live|pipeline|lab/,
    run: () => ({
      text: "TriHub ERP is a multi-tenant college ERP Omkar built: admissions, academics, exams, fees and certificates in one record, for admins, HODs, faculty and students. It runs in production with AI agents inside the daily workflows. The Model Lab shows the pipeline and real screens.",
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
      text: "Five areas: deep learning, explainable AI, applied ML, AI systems and agents, and engineering. Every skill in the Expertise section links to the paper or project where he used it.",
      action: { type: "scroll", target: "#expertise" },
    }),
  },
  {
    test: /experience|work|founder|startup|education|college|degree/,
    run: () => ({
      text: "Final-year B.E. in CSE (AI), graduating 2027. Co-founder and CMO at Triverse Solutions, founder of VOK Partners, and organiser of a national-level hackathon.",
      action: { type: "scroll", target: "#experience" },
    }),
  },
  {
    test: /github|code|repo/,
    run: () => ({ text: "Opening Omkar's GitHub in a new tab.", action: { type: "open", target: profile.github } }),
  },
  {
    test: /linkedin/,
    run: () => ({ text: "Opening LinkedIn in a new tab.", action: { type: "open", target: profile.linkedin } }),
  },
  {
    test: /hire|contact|email|mail|reach|talk|available|job|role|intern/,
    run: () => ({
      text: `Omkar is open to ML, applied AI and agent engineering roles, and internships. Email ${profile.email}.`,
      action: { type: "scroll", target: "#contact" },
    }),
  },
  {
    test: /who|about|omkar|yourself|introduce/,
    run: () => ({
      text: "Omkar Kale is a final-year AI engineering student in Pune. He publishes explainable deep learning research and ships it inside real software, like the TriHub ERP.",
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
    run: () => ({ text: "Try: show research, the pneumonia paper, projects, open the ERP, skills, download résumé, or how do I hire him. Or start a tour." }),
  },
];

const FALLBACK = "I don't have that yet. Ask about research, projects, the ERP, skills, résumé or contact, or start a tour from the buttons below.";

// Returns { text, action? }, or null for empty input.
export function answer(raw) {
  const q = raw.trim().toLowerCase();
  if (!q) return null;
  for (const it of INTENTS) if (it.test.test(q)) return it.run(q);
  return { text: FALLBACK };
}

// Guided tours, one per kind of visitor. Each stop scrolls to a section, shows its title in the
// caption bar and narrates `line`. `tab` opens a research paper. `through` extends the stop to the
// end of a following section, so a short section and its neighbour are seen together.
export const TOURS = {
  recruiter: [
    {
      target: "#hero",
      title: "Who Omkar is",
      line: "This is Omkar Kale, a final-year AI engineering student from Pune, graduating in 2027. He is looking for ML and AI engineer roles, and internships.",
    },
    {
      target: "#metrics",
      through: "#build", // the numbers, then the whole "Models that ship" portal
      title: "Proof in numbers",
      line: "The proof in numbers: one published paper, four AI projects, 94.6 percent accuracy on academic risk prediction, and an ERP running live with AI agents. And these are the four kinds of things he builds.",
    },
    {
      target: "#expertise",
      title: "What he's good at",
      line: "Five areas of expertise. Every skill here links to the paper or project where he actually used it, so you can check the evidence yourself.",
    },
    {
      target: "#projects",
      title: "Projects",
      line: "His projects, led by a published paper on explainable pneumonia detection, where he is first author. Then academic risk prediction with a temporal transformer, its paper in progress, plus speech to summary and a travel recommender.",
    },
    {
      target: "#lab",
      title: "Shipped software",
      line: "He also ships. TriHub ERP runs in production with AI agents inside the daily workflows, alongside CRM pipelines and a content automation engine.",
    },
    {
      target: "#experience",
      title: "Leadership",
      line: "Alongside the degree he co-founded Triverse Solutions, founded VOK Partners, and organised a national-level hackathon.",
    },
    {
      target: "#contact",
      title: "How to hire him",
      line: "If you are hiring for 2026 or 2027, this is how to reach him. I can also download his résumé for you, just ask.",
    },
  ],
  engineer: [
    {
      target: "#expertise",
      title: "The skill map",
      line: "Start with the skill map. Each skill carries proof chips; click one and I'll take you to the work behind it.",
    },
    {
      target: "#projects",
      title: "Projects",
      line: "The published project first: CNN backbones on chest X-rays, and which explanation method is fast and faithful enough for a clinic. Then a temporal transformer for academic risk, ahead of LSTM and GRU, and the other builds, each with its input, model and output.",
    },
    {
      target: "#lab",
      title: "Agents in production",
      line: "Then the systems side: LLM agents that read records, draft follow-ups and move work forward across ERP, CRM and web apps.",
    },
    {
      target: "#stack",
      title: "Toolkit",
      line: "And the toolkit behind all of it, from training notebooks to deployed services.",
    },
  ],
  explore: [
    {
      target: "#hero",
      title: "Welcome",
      line: "Welcome. Scroll at your own pace. I'll stay in the corner; press Control K any time to ask me something.",
    },
    {
      target: "#build",
      title: "What he builds",
      line: "These are the four kinds of things Omkar builds, from research models to agents inside software.",
    },
    {
      target: "#projects",
      title: "Projects",
      line: "Here are his projects, starting with a published paper on explainable pneumonia detection.",
    },
    {
      target: "#contact",
      title: "Say hello",
      line: "And if you'd like to talk to Omkar himself, everything you need is here.",
    },
  ],
};

export const SUGGEST = ["Show research", "Pneumonia paper", "Open the ERP", "Skills", "Download résumé", "How to hire him"];

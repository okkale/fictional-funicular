// All site content lives here. Edit this file to update the portfolio.

export const profile = {
  name: "Omkar Kale",
  role: "AI Engineer",
  email: "kaleomkar1011@gmail.com",
  linkedin: "https://www.linkedin.com/in/omkar-kale-391712298",
  github: "https://github.com/okkale",
  resume: "/Omkar_Kale_Resume.pdf",
};

// Only facts from the published paper, the projects and the live ERP.
export const metrics = [
  { value: 1, suffix: "", label: "Published paper, first author: explainable pneumonia detection" },
  { value: 4, suffix: "", label: "AI projects built, from X-rays to speech to recommendations" },
  { text: "Live", label: "TriHub ERP, in production with AI agents" },
  { value: 3000, suffix: "+", label: "Student records run through CRM pipelines" },
  { value: 94.6, decimals: 1, suffix: "%", label: "Accuracy, academic risk prediction project" },
];

export const xaiPaper = {
  title: "CNN Driven Pneumonia Detection using Explainable AI Methods",
  authors: "O. Kale, S. Salunke, S. Shinde, P. Thomake, P. Patil, R. Patil",
  role: "Published paper · First author",
  year: "2026",
  stack: ["TensorFlow", "Keras", "ResNet50V2", "Grad-CAM", "LIME", "SHAP"],
  question: "Doctors don't trust a pneumonia model that can't show its reasoning. Which explanation method is fast and faithful enough for a clinic?",
  findings: [
    "Benchmarked ResNet50V2, VGG16 and VGG19 on a public chest X-ray dataset.",
    "ResNet50V2 performed best of the three backbones.",
    "Grad-CAM is fast but coarse. KernelSHAP is faithful but too slow for real-time use.",
  ],
  methods: [
    { id: "gradcam", label: "Grad-CAM", src: "/research/gradcam.jpg", note: "Gradient heatmap. Fast, coarse localisation." },
    { id: "lime", label: "LIME", src: "/research/lime.jpg", note: "Superpixel boundaries the model relied on." },
    { id: "shap", label: "SHAP", src: "/research/shap.jpg", note: "Region attributions. Most faithful, slowest." },
  ],
  href: null, // TODO: DOI or publisher link
};

// TriHub ERP for the Model Lab: the student journey it runs end to end (from the TriHub client
// deck), real demo screens by role, and the architecture (from the ERP repo's architecture doc).
export const erpPipeline = [
  { id: "admission", label: "Admission", detail: "Enquiries, applications and onboarding into one student record." },
  { id: "enrolment", label: "Enrolment", detail: "Identity, guardians, documents, sections and subject mapping." },
  { id: "academics", label: "Academics", detail: "Timetable, attendance, lesson plans and faculty workload." },
  { id: "exams", label: "Exams", detail: "Eligibility, candidate lists, marks entry, grading and results." },
  { id: "fees", label: "Fees", detail: "Fee policies, invoices, receipts, ledgers and reconciliation." },
  { id: "alumni", label: "Certificates", detail: "Bonafide and leaving certificates, then alumni records." },
];

export const erpScreens = [
  { id: "admin", label: "Admin", src: "/erp/admin.jpg", caption: "Admin dashboard: approvals queue, attendance, fees and IQAC tasks." },
  { id: "hod", label: "HOD", src: "/erp/hod.jpg", caption: "HOD dashboard: department scope, workload and approvals." },
  { id: "faculty", label: "Faculty", src: "/erp/attendance.jpg", caption: "Faculty attendance marking for a lecture, with live counts." },
  { id: "student", label: "Student", src: "/erp/student.jpg", caption: "Student dashboard: timetable, pending actions and notices." },
  { id: "exams", label: "Exams", src: "/erp/exams.jpg", caption: "Examination management: lifecycle, eligibility and results." },
  { id: "finance", label: "Finance", src: "/erp/finance.jpg", caption: "Finance control centre: receivables, receipts and approvals." },
  { id: "timetable", label: "Timetable", src: "/erp/timetable.jpg", caption: "Timetable and class allotment builder." },
];

export const erpStack = [
  ["Backend", "NestJS, TypeScript, Prisma, PostgreSQL"],
  ["Frontend", "Next.js, React, TypeScript"],
  ["Realtime", "Socket.IO with a Redis adapter"],
  ["Security", "JWT, role-based access, tenant scoping, audit trail"],
  ["Architecture", "Multi-tenant SaaS, modular monolith, versioned REST API"],
  ["Apps", "Web for every role, plus a mobile app"],
];

export const projects = [
  {
    title: "Academic risk prediction",
    kind: "Time series · Transformers",
    status: "Paper in progress",
    team: "With T. Shinde",
    body: "An attention-based temporal transformer that flags at-risk students from weekly learning activity, ahead of logistic regression, random forest, LSTM and GRU baselines.",
    stack: ["Transformers", "Attention", "LSTM / GRU baselines", "OULAD"],
    visual: { type: "attention", peakWeeks: [6, 7, 8], weeks: 12 },
    results: [
      ["94.6%", "Accuracy"],
      ["0.93", "ROC-AUC"],
      ["32,000+", "Students"],
    ],
    scan: { input: "Weekly learning activity of 32,000+ students (OULAD)", model: "Temporal transformer with attention", output: "An at-risk flag, plus the weeks that mattered most (6 to 8)" },
    href: null,
  },
  {
    title: "Long-form speech to summary",
    kind: "Speech · NLP",
    body: "Audio preprocessing, speech recognition for hour-long inputs, then automatic summarisation into the points that matter.",
    stack: ["Python", "Speech recognition", "Summarisation"],
    visual: { type: "wave" },
    scan: { input: "Hour-long audio", model: "Speech recognition, then summarisation", output: "The points that matter, as text" },
    href: null,
  },
  {
    title: "YaatraSarthi",
    kind: "Recommendation systems",
    body: "Cultural travel marketplace with AI recommendations, booking workflows, QR ticketing and real-time updates.",
    stack: ["Recommender", "REST API", "QR ticketing"],
    visual: { type: "route" },
    scan: { input: "Traveller interests and bookings", model: "Recommender system", output: "Cultural trips, QR tickets, live updates" },
    href: null,
  },
];

export const systems = [
  {
    title: "TriHub ERP",
    body: "Multi-tenant college ERP for admins, HODs, faculty and students: admissions to alumni in one record, live in production with AI agents inside daily workflows.",
    tag: "Live",
    href: "https://trihuberp.up.railway.app",
    size: "lg",
  },
  {
    title: "Agents in business software",
    body: "LLM agents that read records, draft follow-ups and move work forward across ERP, CRM and web apps.",
    tag: "Agentic AI",
    size: "md",
  },
  {
    title: "CRM pipelines",
    body: "Lead capture, tracking and reporting across 3000+ student records.",
    tag: "Automation",
    size: "sm",
  },
  {
    title: "Social content engine",
    body: "Scheduling, publishing and engagement tracking. About 40% less manual work.",
    tag: "Workflow",
    size: "sm",
  },
  {
    title: "VOK Partners site",
    body: "Brand site built from scratch, with inquiry flows feeding the CRM.",
    tag: "Web",
    size: "md",
  },
];

export const experience = [
  {
    role: "B.E. Computer Science (Artificial Intelligence)",
    org: "Nutan College of Engineering & Research, Pune",
    period: "2023 - 2027",
    points: ["Published research paper in explainable computer vision (first author)", "Organised a national-level hackathon", "Core member, Codement Community: led 5+ SkillBoards", "Founding president, Tech Talk Friday podcast"],
  },
  {
    role: "Co-Founder & CMO",
    org: "Triverse Solutions",
    period: "Jul 2025 - Present",
    points: ["Product and go-to-market for SaaS and ERP products", "Client onboarding and delivery"],
  },
  {
    role: "Founder",
    org: "VOK Partners",
    period: "Jan 2025 - Present",
    points: ["Built the company website, lead capture and CRM automation"],
  },
  {
    role: "Digital Marketing Intern & CRM Manager",
    org: "NMIET, Pune",
    period: "May 2025 - Sep 2025",
    points: ["CRM workflows and reporting for 3000+ student records"],
  },
];

// Where a skill was used. Each proof chip links to the section that shows it.
const PROOF = {
  xai: { label: "Pneumonia XAI paper", target: "#projects" },
  temporal: { label: "Academic risk project", target: "#projects" },
  speech: { label: "Speech to summary", target: "#projects" },
  yaatra: { label: "YaatraSarthi", target: "#projects" },
  erp: { label: "TriHub ERP", target: "#systems" },
  crm: { label: "CRM pipelines", target: "#systems" },
  social: { label: "Social content engine", target: "#systems" },
  vok: { label: "VOK Partners site", target: "#systems" },
};

// Expertise areas. No self-rated percentages: every claim points at work that shows it.
export const expertise = [
  {
    id: "dl",
    name: "Deep learning",
    blurb: "CNNs, transfer learning and sequence models, trained and evaluated end to end.",
    skills: [
      { name: "TensorFlow & Keras", proof: [PROOF.xai] },
      { name: "CNNs & transfer learning", note: "ResNet50V2, VGG16/19, InceptionV3, DenseNet121, EfficientNet", proof: [PROOF.xai] },
      { name: "Transformers & attention", proof: [PROOF.temporal] },
      { name: "LSTM / GRU", note: "Baselines for the temporal model", proof: [PROOF.temporal] },
      { name: "Backbone benchmarking", note: "ResNet50V2 against VGG16 and VGG19", proof: [PROOF.xai] },
    ],
  },
  {
    id: "xai",
    name: "Explainable AI",
    blurb: "Making model decisions visible, then checking the explanations are faithful and fast enough to use.",
    skills: [
      { name: "Grad-CAM", proof: [PROOF.xai] },
      { name: "LIME", proof: [PROOF.xai] },
      { name: "SHAP / KernelSHAP", proof: [PROOF.xai] },
      { name: "Attention analysis", note: "Which semester weeks drive a risk prediction", proof: [PROOF.temporal] },
      { name: "Speed vs fidelity trade-offs", note: "Which explanation is usable in a clinic", proof: [PROOF.xai] },
    ],
  },
  {
    id: "applied",
    name: "Applied ML",
    blurb: "Speech, language and recommendation pipelines built around real inputs.",
    skills: [
      { name: "Speech recognition", note: "Hour-long audio", proof: [PROOF.speech] },
      { name: "Summarisation", proof: [PROOF.speech] },
      { name: "Recommender systems", proof: [PROOF.yaatra] },
      { name: "Classical baselines", note: "Logistic regression, random forest", proof: [PROOF.temporal] },
    ],
  },
  {
    id: "agents",
    name: "AI systems & agents",
    blurb: "LLM agents and automation inside software people use every day.",
    skills: [
      { name: "LLM agents in workflows", proof: [PROOF.erp] },
      { name: "ERP product", note: "Students, staff and operations", proof: [PROOF.erp] },
      { name: "CRM automation", note: "3000+ student records", proof: [PROOF.crm] },
      { name: "Workflow automation", note: "About 40% less manual work", proof: [PROOF.social] },
    ],
  },
  {
    id: "eng",
    name: "Engineering",
    blurb: "The stack that carries a model from notebook to production.",
    skills: [
      { name: "Python", proof: [PROOF.xai, PROOF.temporal, PROOF.speech] },
      { name: "REST APIs", proof: [PROOF.yaatra] },
      { name: "Deploy on Railway", proof: [PROOF.erp] },
      { name: "Web builds & inquiry flows", proof: [PROOF.vok] },
      { name: "Flask · SQLAlchemy · PostgreSQL · MongoDB · TypeScript", proof: [] },
    ],
  },
];

export const logos = [
  ["python", "Python"],
  ["tensorflow", "TensorFlow"],
  ["keras", "Keras"],
  ["scikitlearn", "Scikit-learn"],
  ["numpy", "NumPy"],
  ["pandas", "Pandas"],
  ["flask", "Flask"],
  ["postgresql", "PostgreSQL"],
  ["mysql", "MySQL"],
  ["mongodb", "MongoDB"],
  ["typescript", "TypeScript"],
  ["javascript", "JavaScript"],
  ["linux", "Linux"],
  ["git", "Git"],
  ["postman", "Postman"],
  ["railway", "Railway"],
];

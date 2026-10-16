// What K.A.L.E. says out loud for a line it shows on screen. Text-to-speech voices stumble on
// acronyms, product names and addresses, so these get spelled the way a person would say them.
// Used both when recording the neural voice lines (slm/record_voice.py) and by the browser voice.
const SAY = [
  [/K\.A\.L\.E\./g, "Kahlay"],
  [/\bKale\b/g, "Kahlay"], // his surname, not the vegetable
  [/kaleomkar1011@gmail\.com/gi, "Kahlay omkar one zero one one, at gmail dot com"],
  [/TriHub/g, "Try-hub"],
  [/YaatraSarthi/g, "Yaatra Saarthi"],
  [/ROC-AUC/g, "R O C, A U C"],
  [/\bOULAD\b/g, "O U L A D"],
  [/\bHODs\b/g, "H O Ds"],
  [/\bLLM\b/g, "L L M"],
  [/\bXAI\b/g, "X A I"],
  [/\bVOK\b/g, "V O K"],
  [/\bCMO\b/g, "C M O"],
  [/\bCRM\b/g, "C R M"],
  [/\bERP\b/g, "E R P"],
  [/\bCNNs?\b/g, (m) => (m.endsWith("s") ? "C N Ns" : "C N N")],
  [/\bAI\b/g, "A I"],
  [/\bML\b/g, "M L"],
  [/\bB\.E\./g, "B E"],
  [/Grad-CAM/g, "Grad CAM"],
  [/KernelSHAP/g, "Kernel SHAP"],
  [/\bSHAP\b/g, "Shap"],
  [/\bLIME\b/g, "Lime"],
  [/NestJS/g, "Nest J S"],
  [/Next\.js/g, "Next J S"],
  [/Socket\.IO/g, "Socket I O"],
  [/PostgreSQL/g, "Postgres Q L"],
  [/MySQL/g, "My S Q L"],
  [/MongoDB/g, "Mongo D B"],
  [/\bSaaS\b/g, "SaaS"],
  [/ResNet50V2/g, "ResNet 50 V 2"],
  [/VGG(\d+)/g, "V G G $1"],
  [/LSTM/g, "L S T M"],
  [/\bGRU\b/g, "G R U"],
  [/(\d[\d,]*)\+/g, "$1 plus"],
];

export function speakable(text) {
  return SAY.reduce((s, [re, to]) => s.replace(re, to), text);
}

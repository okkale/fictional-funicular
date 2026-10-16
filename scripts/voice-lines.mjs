// Prints every fixed K.A.L.E. line as JSON: [{ text, say }]. Optional argv[2]: a JSON file of
// extra lines (the model's answers). Bundled and run by slm/record_voice.py.
import { readFileSync } from "node:fs";
import { spokenLines } from "../src/kale/intents.js";
import { speakable } from "../src/kale/speakable.js";

const extra = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], "utf8")) : [];
const lines = [...new Set([...spokenLines(), ...extra])];
console.log(JSON.stringify(lines.map((text) => ({ text, say: speakable(text) }))));

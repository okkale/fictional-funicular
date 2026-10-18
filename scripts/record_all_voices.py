import asyncio
import hashlib
import json
import re
import sys
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
MALE_DIR = ROOT / "public" / "kale" / "voice"
FEMALE_DIR = ROOT / "public" / "kale" / "voice" / "female"

MALE_VOICE, MALE_RATE, MALE_PITCH = "en-CA-LiamNeural", "+8%", "+0Hz"
FEMALE_VOICE, FEMALE_RATE, FEMALE_PITCH = "en-US-JennyNeural", "+4%", "+0Hz"

SAY = [
    (re.compile(r"\bKale\b"), "Kahlay"),
    (re.compile(r"kaleomkar1011@gmail\.com", re.I), "Kahlay omkar one zero one one, at gmail dot com"),
    (re.compile(r"TriHub"), "Try-hub"),
    (re.compile(r"YaatraSarthi"), "Yaatra Saarthi"),
    (re.compile(r"ROC-AUC"), "R O C, A U C"),
    (re.compile(r"\bOULAD\b"), "O U L A D"),
    (re.compile(r"\bHODs\b"), "H O Ds"),
    (re.compile(r"\bLLM\b"), "L L M"),
    (re.compile(r"\bXAI\b"), "X A I"),
    (re.compile(r"\bVOK\b"), "V O K"),
    (re.compile(r"\bCMO\b"), "C M O"),
    (re.compile(r"\bCRM\b"), "C R M"),
    (re.compile(r"\bERP\b"), "E R P"),
    (re.compile(r"\bCNNs\b"), "C N Ns"),
    (re.compile(r"\bCNN\b"), "C N N"),
    (re.compile(r"\bAI\b"), "A I"),
    (re.compile(r"\bML\b"), "M L"),
    (re.compile(r"\bB\.E\."), "B E"),
    (re.compile(r"Grad-CAM"), "Grad CAM"),
    (re.compile(r"KernelSHAP"), "Kernel SHAP"),
    (re.compile(r"\bSHAP\b"), "Shap"),
    (re.compile(r"\bLIME\b"), "Lime"),
    (re.compile(r"NestJS"), "Nest J S"),
    (re.compile(r"Next\.js"), "Next J S"),
    (re.compile(r"Socket\.IO"), "Socket I O"),
    (re.compile(r"PostgreSQL"), "Postgres Q L"),
    (re.compile(r"MySQL"), "My S Q L"),
    (re.compile(r"MongoDB"), "Mongo D B"),
    (re.compile(r"\bSaaS\b"), "SaaS"),
    (re.compile(r"ResNet50V2"), "ResNet 50 V 2"),
    (re.compile(r"VGG(\d+)"), r"V G G \1"),
    (re.compile(r"LSTM"), "L S T M"),
    (re.compile(r"\bGRU\b"), "G R U"),
    (re.compile(r"(\d[\d,]*)\+"), r"\1 plus"),
]

def speakable(text: str) -> str:
    res = text
    for pattern, repl in SAY:
        res = pattern.sub(repl, res)
    return res

def gather_lines():
    lines = set()
    # 1. Existing male index
    male_index_file = MALE_DIR / "index.json"
    if male_index_file.exists():
        with open(male_index_file, "r", encoding="utf-8") as f:
            for k in json.load(f).keys():
                lines.add(k)

    # 2. Extract from intents.js
    intents_text = (ROOT / "src" / "kale" / "intents.js").read_text(encoding="utf-8")
    for match in re.finditer(r'text:\s*"([^"]+)"', intents_text):
        lines.add(match.group(1))
    for match in re.finditer(r'text:\s*`([^`]+)`', intents_text):
        raw = match.group(1)
        raw = raw.replace("${NAME}", "Kyle")
        lines.add(raw)
    for match in re.finditer(r'line:\s*"([^"]+)"', intents_text):
        lines.add(match.group(1))

    # Specific quick question responses:
    lines.add("The pneumonia paper was authored by Omkar Kale as first author, alongside S. Salunke, S. Shinde, P. Thomake, P. Patil and R. Patil.")
    lines.add("The academic risk model trained on OULAD data across 32,000+ students. The attention weights showed weeks 6 to 8 are the critical window to flag at-risk students.")
    lines.add("Because he does both sides. Published research in explainable deep learning, and production engineering in NestJS and React. He knows what a model is doing, and he knows how to deploy it inside real software.")
    lines.add("He organised a national-level hackathon, served as Joint Cultural Secretary at NMIET, and ran clubs and tech initiatives across campus.")
    lines.add("I'm Kyle, Knowledge Assistant for Learning and Engineering. I'm an on-device character-level transformer with about 0.8M parameters, running 100% locally in your browser with zero server calls.")
    lines.add("The highlights: one published paper as first author, four AI projects, 94.6% accuracy on academic risk, 3000+ student records in CRM, and a live ERP.")

    return sorted(list(lines))

async def record_gender(lines, out_dir, voice, rate, pitch, gender_name):
    out_dir.mkdir(parents=True, exist_ok=True)
    index_file = out_dir / "index.json"
    manifest = {}
    if index_file.exists():
        try:
            with open(index_file, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            manifest = {}

    print(f"\nRecording {len(lines)} lines for {gender_name} ({voice})...")
    for i, raw_text in enumerate(lines, 1):
        say_text = speakable(raw_text)
        name = hashlib.sha1(f"{voice}{rate}{pitch}{say_text}".encode()).hexdigest()[:12] + ".mp3"
        manifest[raw_text] = name
        mp3_path = out_dir / name
        if not mp3_path.exists():
            try:
                await edge_tts.Communicate(say_text, voice, rate=rate, pitch=pitch).save(str(mp3_path))
                print(f"[{i}/{len(lines)}] {gender_name} recorded {name}: {say_text[:40]}...")
            except Exception as e:
                print(f"Error recording {name} for {gender_name}: {e}")
        else:
            # File already exists
            pass

    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=0)

    print(f"Saved {gender_name} index to {index_file} ({len(manifest)} entries).")
    return manifest

async def main():
    lines = gather_lines()
    print(f"Total unique lines to ensure in audio manifests: {len(lines)}")
    # Record male
    male_manifest = await record_gender(lines, MALE_DIR, MALE_VOICE, MALE_RATE, MALE_PITCH, "Male")
    # Also write to public/kale/voice/male/index.json
    (MALE_DIR / "male").mkdir(exist_ok=True)
    with open(MALE_DIR / "male" / "index.json", "w", encoding="utf-8") as f:
        json.dump(male_manifest, f, ensure_ascii=False, indent=0)

    # Record female
    await record_gender(lines, FEMALE_DIR, FEMALE_VOICE, FEMALE_RATE, FEMALE_PITCH, "Female")
    print("\nALL AUDIO RECORDINGS AND MANIFESTS COMPLETE!")

if __name__ == "__main__":
    asyncio.run(main())

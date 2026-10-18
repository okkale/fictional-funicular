import asyncio
import hashlib
import json
import re
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
SRC_INDEX = ROOT / "public" / "kale" / "voice" / "index.json"
OUT = ROOT / "public" / "kale" / "voice" / "female"
VOICE, RATE, PITCH = "en-US-JennyNeural", "+4%", "+0Hz"

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

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with open(SRC_INDEX, "r", encoding="utf-8") as f:
        src_manifest = json.load(f)

    manifest = {}
    print(f"Recording {len(src_manifest)} female lines using {VOICE}...")
    
    # Process sequentially or with limited concurrency to avoid throttling
    for i, raw_text in enumerate(src_manifest.keys(), 1):
        say_text = speakable(raw_text)
        name = hashlib.sha1(f"{VOICE}{RATE}{PITCH}{say_text}".encode()).hexdigest()[:12] + ".mp3"
        manifest[raw_text] = name
        path = OUT / name
        if not path.exists():
            try:
                await edge_tts.Communicate(say_text, VOICE, rate=RATE, pitch=PITCH).save(str(path))
                print(f"[{i}/{len(src_manifest)}] Recorded {name}: {say_text[:40]}...")
            except Exception as e:
                print(f"Error recording {name}: {e}")
        else:
            print(f"[{i}/{len(src_manifest)}] Exists {name}")

    index_path = OUT / "index.json"
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=0)

    # Also ensure public/kale/voice/male has its index.json
    male_dir = ROOT / "public" / "kale" / "voice" / "male"
    male_dir.mkdir(parents=True, exist_ok=True)
    male_index_path = male_dir / "index.json"
    with open(male_index_path, "w", encoding="utf-8") as f:
        json.dump(src_manifest, f, ensure_ascii=False, indent=0)

    print(f"Done! {len(manifest)} female voice lines saved to {OUT}")

if __name__ == "__main__":
    asyncio.run(main())

"""Record Kyle's lines with a neural male voice (Microsoft en-CA-LiamNeural, Canadian English,
through the edge-tts package). Every line Kyle can say is fixed text (tour narration, keyword
answers and the model's answers), so each gets an MP3 and the site plays it instead of the
browser's built-in voice. Pronunciation comes from src/kale/speakable.js.

Run after changing any line:  python slm/record_voice.py   (needs: pip install edge-tts)
"""
import asyncio
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

sys.path.insert(0, str(Path(__file__).parent))
from corpus import DECLINE, TOPICS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "kale" / "voice"
VOICE, RATE, PITCH = "en-CA-LiamNeural", "+8%", "+0Hz"


def lines():
    with tempfile.TemporaryDirectory() as tmp:
        extra = Path(tmp) / "extra.json"
        extra.write_text(json.dumps([a for _, a, _ in TOPICS] + [DECLINE], ensure_ascii=False), encoding="utf8")
        bundle = Path(tmp) / "lines.mjs"
        npx = "npx.cmd" if sys.platform == "win32" else "npx"
        subprocess.run([npx, "rolldown", "scripts/voice-lines.mjs", "--file", str(bundle), "--format", "esm"], cwd=ROOT, check=True, capture_output=True)
        out = subprocess.run(["node", str(bundle), str(extra)], cwd=ROOT, check=True, capture_output=True, encoding="utf8")
        return json.loads(out.stdout)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for row in lines():
        name = hashlib.sha1(f"{VOICE}{RATE}{PITCH}{row['say']}".encode()).hexdigest()[:12] + ".mp3"
        manifest[row["text"]] = name
        path = OUT / name
        if not path.exists():
            await edge_tts.Communicate(row["say"], VOICE, rate=RATE, pitch=PITCH).save(str(path))
            print("recorded", name, row["say"][:60])
    for f in OUT.glob("*.mp3"):
        if f.name not in manifest.values():
            f.unlink()
    (OUT / "index.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=0), encoding="utf8")
    print(f"{len(manifest)} lines, {sum(f.stat().st_size for f in OUT.glob('*.mp3')) // 1024} KB")


asyncio.run(main())

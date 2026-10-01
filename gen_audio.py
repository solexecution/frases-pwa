import asyncio, json, sys, hashlib
from pathlib import Path
import edge_tts

VOICE = "es-MX-DaliaNeural"
RATE = "-8%"
ROOT = Path(__file__).parent
AUDIO = ROOT / "audio"
MANIFEST = AUDIO / "index.json"

def clean(s):
    for c in "…¿¡":
        s = s.replace(c, "")
    return s.strip()

async def synth(text, out):
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(out))

async def main():
    force = "--force" in sys.argv
    phrases = json.loads((ROOT / "phrases.json").read_text(encoding="utf-8"))
    AUDIO.mkdir(exist_ok=True)
    done = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() and not force else {}
    made = 0
    for i, row in enumerate(phrases):
        name = f"{i:03d}.mp3"
        key = hashlib.sha1((VOICE + RATE + row[0]).encode("utf-8")).hexdigest()[:12]
        out = AUDIO / name
        if not force and out.exists() and done.get(name) == key:
            continue
        await synth(clean(row[0]), out)
        done[name] = key
        made += 1
        print(f"  {name}  {row[0]}")
    for f in AUDIO.glob("*.mp3"):
        idx = int(f.stem)
        if idx >= len(phrases):
            f.unlink()
            done.pop(f.name, None)
            print(f"  removed {f.name}")
    MANIFEST.write_text(json.dumps(done, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"done. {made} generated, {len(phrases)} phrases total.")

asyncio.run(main())

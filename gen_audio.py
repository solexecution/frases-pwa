import asyncio, json, sys, hashlib
from pathlib import Path
import edge_tts

VOICE = "es-MX-DaliaNeural"
EN_VOICE = "en-US-AriaNeural"
EN_PITCH = "+0Hz"
RATE = "-8%"
EN_RATE = "-4%"
SLOW_RATE = "-30%"
ROOT = Path(__file__).parent
AUDIO = ROOT / "audio"
SLOW = AUDIO / "slow"
EN = AUDIO / "en"
MANIFEST = AUDIO / "index.json"

def clean(s):
    for c in "…¿¡":
        s = s.replace(c, "")
    return s.strip()

def en_clean(s):
    import re
    s = re.sub(r"\([^)]*\)", "", s)
    s = s.replace("/", ", ").replace("…", " ")
    return re.sub(r"\s+", " ", s).strip(" ,")

def spaced(s):
    words = [w for w in clean(s).replace(",", " ").split() if w]
    return ", ".join(words)

async def synth(text, voice, rate, out, pitch="+0Hz"):
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(str(out))

async def main():
    force = "--force" in sys.argv
    phrases = json.loads((ROOT / "phrases.json").read_text(encoding="utf-8"))
    AUDIO.mkdir(exist_ok=True)
    SLOW.mkdir(exist_ok=True)
    EN.mkdir(exist_ok=True)
    done = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() and not force else {}
    made = 0
    for i, row in enumerate(phrases):
        name = f"{i:03d}.mp3"
        nk = hashlib.sha1((VOICE + RATE + row[0]).encode("utf-8")).hexdigest()[:12]
        if force or not (AUDIO / name).exists() or done.get(name) != nk:
            await synth(clean(row[0]), VOICE, RATE, AUDIO / name)
            done[name] = nk; made += 1; print(f"  {name}  {row[0]}")
        sname = f"slow/{i:03d}.mp3"
        sk = hashlib.sha1((VOICE + SLOW_RATE + "sp" + row[0]).encode("utf-8")).hexdigest()[:12]
        if force or not (SLOW / f"{i:03d}.mp3").exists() or done.get(sname) != sk:
            await synth(spaced(row[0]), VOICE, SLOW_RATE, SLOW / f"{i:03d}.mp3")
            done[sname] = sk; made += 1; print(f"  {sname}")
        ename = f"en/{i:03d}.mp3"
        ek = hashlib.sha1((EN_VOICE + EN_RATE + EN_PITCH + row[1]).encode("utf-8")).hexdigest()[:12]
        if force or not (EN / f"{i:03d}.mp3").exists() or done.get(ename) != ek:
            await synth(en_clean(row[1]), EN_VOICE, EN_RATE, EN / f"{i:03d}.mp3", EN_PITCH)
            done[ename] = ek; made += 1; print(f"  {ename}  {row[1]}")
    prefix = {AUDIO: "", SLOW: "slow/", EN: "en/"}
    for base in (AUDIO, SLOW, EN):
        for f in base.glob("*.mp3"):
            if int(f.stem) >= len(phrases):
                key = prefix[base] + f.name
                f.unlink(); done.pop(key, None); print(f"  removed {key}")
    MANIFEST.write_text(json.dumps(done, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"done. {made} files written, {len(phrases)} phrases x3 sets.")

asyncio.run(main())

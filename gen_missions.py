import asyncio, json, hashlib, subprocess, os
from pathlib import Path
import edge_tts

ROOT = Path(__file__).parent
OUT = ROOT / "audio" / "m"
RATE = "-8%"
NPC = {"m": "es-MX-JorgeNeural", "f": "es-US-PalomaNeural"}
YOU = "es-MX-DaliaNeural"
TRIM = "areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB"

def clean(s):
    for c in "…¿¡":
        s = s.replace(c, "")
    return s.strip()

def shrink(path):
    tmp = Path(str(path) + ".tmp.mp3")
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(path), "-af", TRIM,
                        "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "32k", str(tmp)])
    if r.returncode == 0 and tmp.exists() and tmp.stat().st_size > 500:
        os.replace(tmp, path)
    else:
        tmp.unlink(missing_ok=True)

def name(voice, text):
    return hashlib.sha1((voice + RATE + text).encode("utf-8")).hexdigest()[:10] + ".mp3"

async def make(voice, text):
    fn = name(voice, text)
    path = OUT / fn
    if not path.exists():
        await edge_tts.Communicate(clean(text), voice, rate=RATE).save(str(path))
        shrink(path)
        print("  ", fn, text)
    return "m/" + fn

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = json.loads((ROOT / "missions_src.json").read_text(encoding="utf-8"))
    for m in src:
        nv = NPC[m["voice"]]
        for s in m["steps"]:
            s["npc"]["a"] = await make(nv, s["npc"]["es"])
            for o in s["opts"]:
                o["a"] = await make(YOU, o["es"])
    (ROOT / "missions.json").write_text(json.dumps(src, ensure_ascii=False), encoding="utf-8")
    used = {a.split("/")[1] for m in src for s in m["steps"] for a in [s["npc"]["a"]] + [o["a"] for o in s["opts"]]}
    for f in OUT.glob("*.mp3"):
        if f.name not in used:
            f.unlink()
    print("missions:", len(src), "clips:", len(used))

asyncio.run(main())

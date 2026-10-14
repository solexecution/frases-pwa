import asyncio, json, hashlib
from pathlib import Path
from audiolib import render, EXT

ROOT = Path(__file__).parent
OUT = ROOT / "audio" / "m"
RATE = "-8%"
NPC = {"m": "es-MX-JorgeNeural", "f": "es-US-PalomaNeural"}
YOU = "es-MX-DaliaNeural"


def clean(s):
    for c in "…¿¡":
        s = s.replace(c, "")
    return s.strip()


def name(voice, text):
    return hashlib.sha1((voice + RATE + text).encode("utf-8")).hexdigest()[:10] + EXT


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = json.loads((ROOT / "missions_src.json").read_text(encoding="utf-8"))
    sem = asyncio.Semaphore(4)
    jobs = {}
    for m in src:
        nv = NPC[m["voice"]]
        for s in m["steps"]:
            s["npc"]["a"] = "m/" + name(nv, s["npc"]["es"])
            jobs[s["npc"]["a"]] = (s["npc"]["es"], nv)
            for o in s["opts"]:
                o["a"] = "m/" + name(YOU, o["es"])
                jobs[o["a"]] = (o["es"], YOU)

    async def run(a, text, voice):
        out = ROOT / "audio" / a
        if not out.exists():
            await render(clean(text), voice, RATE, out, sem)

    await asyncio.gather(*(run(a, t, v) for a, (t, v) in jobs.items()))
    (ROOT / "missions.json").write_text(json.dumps(src, ensure_ascii=False), encoding="utf-8")
    used = {a.split("/")[1] for a in jobs}
    for f in OUT.glob("*.*"):
        if f.name not in used:
            f.unlink()
    print("missions:", len(src), "clips:", len(used))


if __name__ == "__main__":
    asyncio.run(main())

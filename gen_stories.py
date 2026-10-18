import asyncio, json, sys
from pathlib import Path
from audiolib import render, key, EXT
from gen_audio import clean, VOICE, RATE

ROOT = Path(__file__).parent
SRC = ROOT / "stories_src"
OUT = ROOT / "audio" / "st"
MANIFEST = ROOT / "audio" / "index.json"
SLOW_RATE = "-25%"
ORDER = ["intro", "mi_dia", "cafe", "familia", "semana", "feria", "cita", "techo", "doctor", "merida"]


def load():
    stories = []
    for sid in ORDER:
        p = SRC / (sid + ".json")
        if not p.exists():
            raise SystemExit("missing story source " + str(p))
        stories.append(json.loads(p.read_text(encoding="utf-8")))
    return stories


async def main():
    force = "--force" in sys.argv
    stories = load()
    (ROOT / "stories.json").write_text(json.dumps(stories, ensure_ascii=False), encoding="utf-8")
    OUT.mkdir(parents=True, exist_ok=True)
    done = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    jobs = []
    for s in stories:
        for n, sn in enumerate(s["sentences"]):
            base = f"st/{s['id']}_{n:02d}"
            text = clean(sn["es"])
            jobs.append((base + EXT, text, RATE))
            jobs.append((base + "_s" + EXT, text, SLOW_RATE))
    sem = asyncio.Semaphore(4)
    todo = []
    for name, text, rate in jobs:
        k = key(VOICE, rate, "+0Hz", text)
        out = ROOT / "audio" / name
        if force or not out.exists() or done.get(name) != k:
            todo.append((name, text, rate, k))

    async def run(job):
        name, text, rate, k = job
        await render(text, VOICE, rate, ROOT / "audio" / name, sem)
        done[name] = k

    await asyncio.gather(*(run(j) for j in todo))
    keep = {j[0].split("/", 1)[1] for j in jobs}
    for f in OUT.glob("*.*"):
        if f.name not in keep:
            f.unlink()
            done.pop("st/" + f.name, None)
    MANIFEST.write_text(json.dumps(done, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"stories: {len(stories)}, sentences: {sum(len(s['sentences']) for s in stories)}, clips written: {len(todo)}")


if __name__ == "__main__":
    asyncio.run(main())
